"use client";

import { useRecentlyViewed } from "./RecentlyViewedProvider";
import { products } from "@/lib/products";
import { ProductRow } from "./ProductRow";

export const RecentlyViewedRow = ({ excludeId }: { excludeId?: string }) => {
  const { ids, isHydrated } = useRecentlyViewed();
  if (!isHydrated) return null;
  const items = ids
    .filter((id) => id !== excludeId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => Boolean(p));
  if (items.length === 0) return null;
  return (
    <ProductRow
      eyebrow="Geçmiş"
      title="Son İncelediğiniz Ürünler"
      description="Daha önce göz attığınız ürünler — kaldığınız yerden devam edin."
      products={items}
    />
  );
};
