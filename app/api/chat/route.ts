import type { NextRequest } from "next/server";
import { products } from "@/lib/products";
import { categories } from "@/lib/categories";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
  formatPrice,
} from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Try these free-tier models in order; the first one the key is allowed to
// use wins. Free-tier quota varies by model/region, so a single hard-coded
// model can return 429 (RESOURCE_EXHAUSTED) even on the first request.
// Override with GEMINI_MODEL (single name or comma-separated list).
const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];
const ENV_MODELS = (process.env.GEMINI_MODEL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MODEL_CHAIN = ENV_MODELS.length ? ENV_MODELS : DEFAULT_MODELS;

type ChatMessage = { role: "user" | "assistant"; content: string };
type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };
type GeminiResult =
  | { ok: true; model: string; reply: string }
  | { ok: false; status: number; detail: string; modelsTried: string[] };

// Compact, always-current product catalog injected as context.
const catalogText = products
  .map((p) => {
    const price = formatPrice(p.price);
    const orig = p.originalPrice ? ` (eski ${formatPrice(p.originalPrice)})` : "";
    const stockText = p.stock > 0 ? `stokta` : "tükendi";
    const group = p.subcategoryLabel ?? p.categoryLabel;
    return `- ${p.name} | ${group} | ${price}${orig} | ${stockText} | ${p.shortDescription} | /products/${p.id}`;
  })
  .join("\n");

const categoriesText = categories
  .map(
    (c) =>
      `- ${c.label}${
        c.subcategories.length
          ? ": " + c.subcategories.map((s) => s.label).join(", ")
          : " (çok yakında)"
      }`,
  )
  .join("\n");

const SYSTEM_PROMPT = `Sen "Zest Home" adlı Türk mutfak ve ev ürünleri e-ticaret sitesinin yapay zekâ asistanısın. Adın "Zest Asistan".

Görevin: müşterilere uygun ürünleri önermek; ürün, fiyat ve stok bilgisi vermek; kategorilerde yol göstermek; kargo, iade ve sipariş gibi soruları yanıtlamak.

Kurallar:
- Her zaman Türkçe, kısa ve samimi yanıt ver. Gerektiğinde madde işareti kullan.
- YALNIZCA aşağıdaki katalog ve mağaza bilgilerini kullan. Bilgi yoksa uydurma; emin değilsen müşteriyi /shop veya /contact sayfasına yönlendir.
- Ürün önerirken adını ve bağlantısını markdown ile ver: [Ürün Adı](/products/kimlik).
- Fiyatları katalogdaki gibi TL olarak belirt. Stokta olmayan ürünü önerme.
- Mağazayla ilgisiz sorulara kibarca "bu konuda yardımcı olamıyorum" deyip mağazaya yönlendir.

Mağaza bilgileri:
- Kargo: ${FREE_SHIPPING_THRESHOLD} TL ve üzeri siparişlerde ücretsiz; altındaki siparişlerde ${STANDARD_SHIPPING_COST} TL standart kargo. Tahmini teslimat 2-4 iş günü.
- İade: Teslimattan sonra 14 gün koşulsuz iade. Ürün orijinal ambalajıyla gönderilmelidir.
- Yardım sayfaları: kargo /yardim/kargo, iade /yardim/iade, iletişim /contact.

Kategoriler:
${categoriesText}

Ürün kataloğu (ad | kategori | fiyat | stok | açıklama | bağlantı):
${catalogText}`;

async function callGemini(
  apiKey: string,
  contents: GeminiContent[],
): Promise<GeminiResult> {
  let lastStatus = 0;
  let lastDetail = "no attempt";

  for (const model of MODEL_CHAIN) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      });
    } catch (err) {
      lastStatus = 0;
      lastDetail = `fetch failed: ${String(err)}`;
      continue;
    }

    if (!res.ok) {
      lastStatus = res.status;
      lastDetail = (await res.text()).slice(0, 600);
      console.error(`Gemini ${model} -> ${res.status}: ${lastDetail}`);
      continue; // try the next model (404 = no such model, 429 = no quota)
    }

    const data = (await res.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        finishReason?: string;
      }[];
    };
    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";

    if (reply) return { ok: true, model, reply };

    lastStatus = 200;
    lastDetail = `empty reply (finishReason=${data.candidates?.[0]?.finishReason ?? "?"})`;
    console.error(`Gemini ${model} -> ${lastDetail}`);
  }

  return { ok: false, status: lastStatus, detail: lastDetail, modelsTried: MODEL_CHAIN };
}

// ── Rate limiting ─────────────────────────────────────────────────────
// This route is a Next handler, so it never passes through the Express
// globalRateLimiter — without this anyone could loop it and drain the Gemini
// quota. Fixed window per client IP, held in module memory.
//
// Caveat: memory is per server instance, so on a multi-instance/serverless
// deployment the effective limit is (LIMIT × instances). That's still a hard
// ceiling per instance and costs nothing; a shared store would be the upgrade
// if abuse ever gets past it.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12; // messages per IP per minute
const hits = new Map<string, { count: number; resetAt: number }>();

const clientIp = (req: NextRequest): string => {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
};

const rateLimit = (ip: string): { ok: boolean; retryAfter: number } => {
  const now = Date.now();
  // Opportunistic sweep so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [key, v] of hits) if (v.resetAt <= now) hits.delete(key);
  }
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
};

export async function POST(req: NextRequest) {
  const { ok: withinLimit, retryAfter } = rateLimit(clientIp(req));
  if (!withinLimit) {
    return Response.json(
      { error: "Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin." },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Sohbet asistanı henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const rawMessages = (body as { messages?: unknown })?.messages;
  const messages: ChatMessage[] = Array.isArray(rawMessages)
    ? (rawMessages as ChatMessage[])
    : [];

  const contents: GeminiContent[] = messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content.slice(0, 2000) }],
    }));

  // Gemini requires the first turn to be from the user.
  while (contents.length && contents[0].role === "model") contents.shift();

  if (contents.length === 0) {
    return Response.json({ error: "Mesaj boş." }, { status: 400 });
  }

  const result = await callGemini(apiKey, contents);
  if (result.ok) return Response.json({ reply: result.reply });

  const error =
    result.status === 429
      ? "Asistan şu anda çok yoğun, lütfen birazdan tekrar deneyin."
      : result.status === 400 || result.status === 403
        ? "Asistan yapılandırmasında bir sorun oluştu."
        : "Asistan şu anda yanıt veremiyor, lütfen tekrar deneyin.";
  return Response.json({ error }, { status: 502 });
}

// Diagnostic probe. Reports configuration for free; only performs a real
// (billed) Gemini call when CHAT_DIAGNOSTIC_TOKEN is configured AND supplied,
// because this endpoint is public and every hit used to cost a model call.
// Upstream error text is never echoed — it goes to the server log instead.
export async function GET(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  const expected = process.env.CHAT_DIAGNOSTIC_TOKEN;
  const supplied =
    req.headers.get("x-diagnostic-token") ??
    new URL(req.url).searchParams.get("token");

  const base = { configured: Boolean(apiKey), modelsTried: MODEL_CHAIN };

  // No token configured, or the wrong one supplied → configuration only.
  if (!expected || supplied !== expected) {
    return Response.json({
      ...base,
      probed: false,
      hint: "Set CHAT_DIAGNOSTIC_TOKEN and pass ?token=… to run a live probe.",
    });
  }
  if (!apiKey) return Response.json({ ...base, probed: false });

  const { ok: withinLimit } = rateLimit(clientIp(req));
  if (!withinLimit) {
    return Response.json({ ...base, probed: false, error: "rate_limited" }, { status: 429 });
  }

  const result = await callGemini(apiKey, [
    { role: "user", parts: [{ text: "Test: merhaba" }] },
  ]);
  if (result.ok) {
    return Response.json({ ...base, probed: true, ok: true, model: result.model });
  }
  // `detail` (raw upstream body) is deliberately omitted — callGemini already
  // logged it server-side.
  console.error(`Gemini diagnostic failed: ${result.status} ${result.detail}`);
  return Response.json({ ...base, probed: true, ok: false, status: result.status });
}
