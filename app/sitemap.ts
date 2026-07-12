// Sitemap for search engines. Static routes + every product URL.
//
// Built-in products come from the static catalog. Custom (admin-added)
// products and the retired-product list come from the backend catalog API —
// fetched best-effort so a temporarily unreachable API still yields a valid
// sitemap of the static catalog.

import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { categories } from "@/lib/categories";

const SITE_URL = "https://www.zesthome.net";

type CatalogPayload = {
  customProducts?: { id: string; isActive: boolean; updatedAt?: string }[];
  retiredIds?: string[];
};

async function fetchCatalog(): Promise<CatalogPayload> {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:4000";
  try {
    const res = await fetch(`${backend}/api/catalog/stock`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    return (await res.json()) as CatalogPayload;
  } catch {
    return {};
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await fetchCatalog();
  const retired = new Set(catalog.retiredIds ?? []);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/kategoriler`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/yardim/kargo`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/yardim/iade`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/hukuki/kullanim-kosullari`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/hukuki/mesafeli-satis`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/hukuki/on-bilgilendirme`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/hukuki/gizlilik`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/hukuki/kvkk`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/hukuki/cerez`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/shop/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const builtInProducts: MetadataRoute.Sitemap = products
    .filter((p) => !retired.has(p.id))
    .map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const customProducts: MetadataRoute.Sitemap = (catalog.customProducts ?? [])
    .filter((p) => p.isActive)
    .map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...categoryRoutes, ...builtInProducts, ...customProducts];
}
