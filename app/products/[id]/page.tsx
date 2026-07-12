// Server wrapper for the product detail page.
//
// The interactive page (gallery, color picker, cart) stays a client component
// in ProductDetailClient.tsx — this file exists so search engines get real
// per-product <title>/<meta> tags and Product JSON-LD in the initial HTML,
// which a "use client" page can't provide.
//
// Data sources:
//   * Built-in products: lib/products.ts (available at build/request time).
//   * Custom (admin-added, "c-…") products: fetched from the backend catalog
//     API via BACKEND_URL with a short revalidate. If the API is unreachable
//     we fall back to brand-generic metadata — never a broken page.

import type { Metadata } from "next";
import { getProductById } from "@/lib/products";
import { ProductDetailClient } from "./ProductDetailClient";

const SITE_URL = "https://www.zesthome.net";

type CustomProduct = {
  id: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  imageUrls: string[];
  isActive: boolean;
};

type CatalogPayload = {
  customProducts?: CustomProduct[];
  stock?: Record<string, number>;
  variants?: Record<string, { stock: number }[]>;
};

// Best-effort catalog fetch for custom products + live stock. 60s revalidate
// keeps metadata fresh without hammering the API.
async function fetchCatalog(): Promise<CatalogPayload | null> {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:4000";
  try {
    const res = await fetch(`${backend}/api/catalog/stock`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as CatalogPayload;
  } catch {
    return null;
  }
}

const absolute = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path}`;

type ProductSeo = {
  name: string;
  description: string;
  images: string[];
  priceTRY: number; // e.g. 399.99
  inStock: boolean;
};

// Resolve whatever we can about the product server-side. null → unknown id
// (client shows its own not-found), metadata falls back to generic.
async function resolveSeo(id: string): Promise<ProductSeo | null> {
  const staticP = getProductById(id);
  const catalog = await fetchCatalog();

  if (staticP) {
    const variantRows = catalog?.variants?.[id];
    const liveStock =
      variantRows && variantRows.length > 0
        ? variantRows.reduce((sum, v) => sum + (v.stock ?? 0), 0)
        : catalog?.stock?.[id];
    return {
      name: staticP.name,
      description: staticP.shortDescription,
      images: (staticP.images.length > 0 ? staticP.images : [staticP.imageUrl]).map(absolute),
      priceTRY: staticP.price,
      inStock: (liveStock ?? staticP.stock) > 0,
    };
  }

  const custom = catalog?.customProducts?.find((p) => p.id === id && p.isActive);
  if (custom) {
    const variantRows = catalog?.variants?.[id];
    const liveStock =
      variantRows && variantRows.length > 0
        ? variantRows.reduce((sum, v) => sum + (v.stock ?? 0), 0)
        : catalog?.stock?.[id] ?? 0;
    return {
      name: custom.name,
      description: custom.shortDescription ?? custom.description ?? "",
      images: custom.imageUrls.map(absolute),
      priceTRY: custom.priceCents / 100,
      inStock: liveStock > 0,
    };
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const seo = await resolveSeo(params.id);
  if (!seo) {
    return {
      title: "Ürün | Zest Home",
      description: "Zest Home premium mutfak gereçleri.",
    };
  }
  const url = `${SITE_URL}/products/${params.id}`;
  return {
    title: `${seo.name} | Zest Home`,
    description: seo.description,
    alternates: { canonical: url },
    openGraph: {
      title: seo.name,
      description: seo.description,
      url,
      siteName: "Zest Home",
      images: seo.images.slice(0, 4).map((img) => ({ url: img })),
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.name,
      description: seo.description,
      images: seo.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const seo = await resolveSeo(params.id);

  const jsonLd = seo
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: seo.name,
        image: seo.images,
        description: seo.description,
        brand: { "@type": "Brand", name: "Zest Home" },
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/products/${params.id}`,
          priceCurrency: "TRY",
          price: seo.priceTRY.toFixed(2),
          availability: seo.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ProductDetailClient params={params} />
    </>
  );
}
