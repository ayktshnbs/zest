"use client";

// Client hook for live, admin-managed catalog data (GET /api/catalog/stock →
// stock + name/price overrides). Module-level cache + single in-flight request
// so a page full of ProductCards triggers ONE network call. Failure-safe: if
// the backend is unreachable the fields stay null and callers fall back to the
// static catalog — it never blanks out names/prices or marks everything out of
// stock just because the API is down.

import { useEffect, useState } from "react";
import { catalogApi, type CatalogOverride } from "./api";

type CatalogData = {
  stock: Record<string, number>;
  overrides: Record<string, CatalogOverride>;
};

let cache: CatalogData | null = null;
let inflight: Promise<CatalogData | null> | null = null;

const load = (): Promise<CatalogData | null> => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = catalogApi
      .catalog()
      .then((d) => {
        cache = d;
        return d;
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
}

const pick = (d: CatalogData | null, id: string): LiveProduct => ({
  stock: d && id in d.stock ? d.stock[id] : null,
  name: d?.overrides[id]?.name ?? null,
  priceCents: d?.overrides[id]?.priceCents ?? null,
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
