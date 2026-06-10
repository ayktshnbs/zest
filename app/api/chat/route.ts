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

// Free-tier Gemini model. Override with GEMINI_MODEL if this name changes.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

type ChatMessage = { role: "user" | "assistant"; content: string };

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

  const contents = messages
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Gemini API error", res.status, detail);
      const error =
        res.status === 429
          ? "Şu anda yoğunluk var, lütfen birazdan tekrar deneyin."
          : "Asistan şu anda yanıt veremiyor.";
      return Response.json({ error }, { status: 502 });
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";

    if (!reply) {
      return Response.json(
        { error: "Asistan boş yanıt verdi, lütfen tekrar deneyin." },
        { status: 502 },
      );
    }

    return Response.json({ reply });
  } catch (err) {
    console.error("Chat route error", err);
    return Response.json(
      { error: "Bağlantı hatası, lütfen tekrar deneyin." },
      { status: 502 },
    );
  }
}
