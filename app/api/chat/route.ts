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

export async function POST(req: NextRequest) {
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

// Diagnostic: visit /api/chat in a browser to see whether the key works and
// which model responds (or the exact Gemini error). No secrets are exposed.
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ configured: false, modelsTried: MODEL_CHAIN });
  }
  const result = await callGemini(apiKey, [
    { role: "user", parts: [{ text: "Test: merhaba" }] },
  ]);
  if (result.ok) {
    return Response.json({ configured: true, ok: true, model: result.model });
  }
  return Response.json({
    configured: true,
    ok: false,
    status: result.status,
    detail: result.detail,
    modelsTried: result.modelsTried,
  });
}
