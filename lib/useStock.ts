"use client";

// Client hook for live, admin-managed catalog data (GET /api/catalog/stock):
//   - stock          : live stock per product id
//   - overrides      : admin name/price/badge edits per built-in product id
//   - categories     : admin-added categories (joined with the built-in list)
//   - customProducts : brand-new admin-added products
//   - variants       : per-colour rows (stock + gallery) per product id
//
// Module-level cache + single in-flight request so a page full of components
// triggers ONE network call. Failure-safe: if the backend is unreachable the
// fields stay null and callers fall back to the static catalog — it never
// blanks out names/prices or marks everything out of stock just because the API
// is down.
//
// The cache is time-boxed (CATALOG_TTL_MS) and revalidated when the tab regains
// focus. Without that it was populated once per page load and never again, so a
// shopper who browsed for an hour checked out against hour-old stock and prices
// and hit a 409 at the end.

import { useEffect, useState } from "react";
import {
  catalogApi,
  type CatalogOverride,
  type CustomProductData,
  type ProductVariant,
  type PublicCategory,
} from "./api";
import type { Product } from "@/types";

export type CatalogData = {
  stock: Record<string, number>;
  overrides: Record<string, CatalogOverride>;
  retiredIds: string[];
  categories: PublicCategory[];
  customProducts: CustomProductData[];
  variants: Record<string, ProductVariant[]>;
};

const EMPTY: CatalogData = {
  stock: {},
  overrides: {},
  retiredIds: [],
  categories: [],
  customProducts: [],
  variants: {},
};

/** How long a fetched catalog snapshot is considered fresh. */
const CATALOG_TTL_MS = 60_000;

let cache: CatalogData | null = null;
let cachedAt = 0;
let inflight: Promise<CatalogData | null> | null = null;
const subs = new Set<(d: CatalogData) => void>();

const notify = () => {
  if (!cache) return;
  for (const fn of subs) fn(cache);
};

const isFresh = () => cache != null && Date.now() - cachedAt < CATALOG_TTL_MS;

const load = (force = false): Promise<CatalogData | null> => {
  if (!force && isFresh()) return Promise.resolve(cache);
  if (!inflight) {
    inflight = catalogApi
      .catalog()
      .then((d) => {
        // Tolerate older API responses that don't include the new fields.
        cache = {
          stock: d.stock ?? {},
          overrides: d.overrides ?? {},
          retiredIds: d.retiredIds ?? [],
          categories: d.categories ?? [],
          customProducts: d.customProducts ?? [],
          variants: d.variants ?? {},
        };
        cachedAt = Date.now();
        notify();
        return cache;
      })
      // Backend down — callers keep static values. Keep any previous snapshot
      // rather than dropping to nothing.
      .catch(() => cache)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

/** Revalidate when the tab comes back after being away longer than the TTL. */
const startFocusRevalidation = (() => {
  let started = false;
  return () => {
    if (started || typeof window === "undefined") return;
    started = true;
    const onFocus = () => {
      if (!isFresh()) void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });
  };
})();

export interface LiveProduct {
  stock: number | null; // null = unknown (use static)
  name: string | null; // null = no override
  priceCents: number | null; // null = no override
  shortDescription: string | null;
  description: string | null;
  // Admin-uploaded photos that replace the static catalog images. null/empty
  // means "use the static images on disk".
  imageUrls: string[] | null;
  // True when the product sells in colour variants — the customer MUST pick
  // one before it can be added to the cart (the API rejects a line without a
  // colorKey), so listing UIs send them to the product page instead.
  hasVariants: boolean;
  // Admin overrides with storefront parity for custom products. null = use the
  // static catalog value.
  badges: { isNew?: boolean; isBestSeller?: boolean; isFeatured?: boolean } | null;
  volumeLabel: string | null;
  setSize: number | null;
}

const pick = (d: CatalogData | null, id: string): LiveProduct => {
  // For variant products there is no inventory row — sum each variant's stock
  // so ProductCard's "Tükendi" badge fires only when every color is sold out.
  const variantRows = d?.variants?.[id];
  const hasVariants = Boolean(variantRows && variantRows.length > 0);
  const stockFromVariants = hasVariants
    ? variantRows!.reduce((sum, v) => sum + (v.stock ?? 0), 0)
    : null;
  const ovr = d?.overrides[id];
  return {
    stock:
      stockFromVariants != null
        ? stockFromVariants
        : d && id in d.stock
        ? d.stock[id]
        : null,
    name: ovr?.name ?? null,
    priceCents: ovr?.priceCents ?? null,
    shortDescription: ovr?.shortDescription ?? null,
    description: ovr?.description ?? null,
    imageUrls: ovr?.imageUrls && ovr.imageUrls.length > 0 ? ovr.imageUrls : null,
    hasVariants,
    badges: ovr?.badges ?? null,
    volumeLabel: ovr?.volumeLabel ?? null,
    setSize: ovr?.setSize ?? null,
  };
};

/**
 * Overlay the live catalog onto a static Product, returning the values the
 * storefront should actually filter, sort and display on.
 *
 * Listing pages need this for EVERY product at once (a per-product hook can't
 * be called in a loop), and they were previously filtering/sorting on the raw
 * static fields — which hid every admin-added product behind "stokta olanlar"
 * (custom products carry stock: 0) and ignored admin price edits.
 */
export const resolveEffective = (
  d: CatalogData | null,
  product: Product,
): { stock: number; price: number; name: string; hasVariants: boolean } => {
  const live = pick(d, product.id);
  return {
    stock: live.stock ?? product.stock,
    price: live.priceCents != null ? live.priceCents / 100 : product.price,
    name: live.name ?? product.name,
    hasVariants: live.hasVariants,
  };
};

/** Live stock + name/price overrides for one product. Overlay onto the static
 *  product as `live.name ?? product.name`, `live.priceCents != null ? … : product.price`. */
export const useLiveProduct = (productId: string): LiveProduct => {
  const [data, setData] = useState<LiveProduct>(() => pick(cache, productId));
  useEffect(() => {
    let active = true;
    startFocusRevalidation();
    void load().then((d) => {
      if (active && d) setData(pick(d, productId));
    });
    // Subscribe so an admin save (refreshLiveCatalog) or a TTL revalidation
    // reaches cards already on screen, instead of leaving them stale until
    // they remount.
    const sub = (d: CatalogData) => {
      if (active) setData(pick(d, productId));
    };
    subs.add(sub);
    return () => {
      active = false;
      subs.delete(sub);
    };
  }, [productId]);
  return data;
};

/** Full live catalog snapshot — use when you need the admin-added products or
 *  categories, not just one product's overrides. */
export const useLiveCatalog = (): CatalogData => {
  const [data, setData] = useState<CatalogData>(cache ?? EMPTY);
  useEffect(() => {
    let active = true;
    startFocusRevalidation();
    if (cache) setData(cache);
    void load().then((d) => { if (active && d) setData(d); });
    const sub = (d: CatalogData) => { if (active) setData(d); };
    subs.add(sub);
    return () => { active = false; subs.delete(sub); };
  }, []);
  return data;
};

/** Manually invalidate the cache (e.g. after admin saves a change). */
export const refreshLiveCatalog = async () => {
  cache = null;
  cachedAt = 0;
  return load(true);
};
