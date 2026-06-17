"use client";

// Client hook for live, admin-managed catalog data (GET /api/catalog/stock):
//   - stock          : live stock per product id
//   - overrides      : admin name/price edits per built-in product id
//   - categories     : admin-added categories (joined with the built-in list)
//   - customProducts : brand-new admin-added products
//
// Module-level cache + single in-flight request so a page full of components
// triggers ONE network call. Failure-safe: if the backend is unreachable the
// fields stay null and callers fall back to the static catalog — it never
// blanks out names/prices or marks everything out of stock just because the API
// is down.

import { useEffect, useState } from "react";
import {
  catalogApi,
  type CatalogOverride,
  type CustomProductData,
  type ProductVariant,
  type PublicCategory,
} from "./api";

type CatalogData = {
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

let cache: CatalogData | null = null;
let inflight: Promise<CatalogData | null> | null = null;
const subs = new Set<(d: CatalogData) => void>();

const notify = () => {
  if (!cache) return;
  for (const fn of subs) fn(cache);
};

const load = (): Promise<CatalogData | null> => {
  if (cache) return Promise.resolve(cache);
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
        notify();
        return cache;
      })
      .catch(() => null) // backend down — callers keep static values
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

export interface LiveProduct {
  stock: number | null; // null = unknown (use static)
  name: string | null; // null = no override
  priceCents: number | null; // null = no override
  shortDescription: string | null;
  description: string | null;
}

const pick = (d: CatalogData | null, id: string): LiveProduct => ({
  stock: d && id in d.stock ? d.stock[id] : null,
  name: d?.overrides[id]?.name ?? null,
  priceCents: d?.overrides[id]?.priceCents ?? null,
  shortDescription: d?.overrides[id]?.shortDescription ?? null,
  description: d?.overrides[id]?.description ?? null,
});

/** Live stock + name/price overrides for one product. Overlay onto the static
 *  product as `live.name ?? product.name`, `live.priceCents != null ? … : product.price`. */
export const useLiveProduct = (productId: string): LiveProduct => {
  const [data, setData] = useState<LiveProduct>(() => pick(cache, productId));
  useEffect(() => {
    let active = true;
    load().then((d) => {
      if (active && d) setData(pick(d, productId));
    });
    return () => {
      active = false;
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
    if (cache) setData(cache);
    load().then((d) => { if (active && d) setData(d); });
    const sub = (d: CatalogData) => { if (active) setData(d); };
    subs.add(sub);
    return () => { active = false; subs.delete(sub); };
  }, []);
  return data;
};

/** Manually invalidate the cache (e.g. after admin saves a change). */
export const refreshLiveCatalog = async () => {
  cache = null;
  return load();
};
