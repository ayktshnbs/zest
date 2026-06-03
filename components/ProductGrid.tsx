"use client";

import { Product, SortKey } from "@/types";
import { ProductCard } from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

interface ProductGridProps {
  products: Product[];
  initialSort?: SortKey;
  pageSize?: number;
  emptyState?: React.ReactNode;
  showLoadMore?: boolean;
}

const sortProducts = (items: Product[], key: SortKey): Product[] => {
  const copy = [...items];
  switch (key) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    case "newest":
      return copy.sort(
        (a, b) =>
          Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) ||
          b.id.localeCompare(a.id),
      );
    case "popular":
      return copy.sort(
        (a, b) =>
          b.reviewCount - a.reviewCount || b.rating - a.rating,
      );
    case "featured":
    default:
      return copy.sort(
        (a, b) =>
          Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
          Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)) ||
          b.rating - a.rating,
      );
  }
};

export const ProductGrid = ({
  products,
  initialSort = "featured",
  pageSize = 12,
  emptyState,
  showLoadMore = true,
}: ProductGridProps) => {
  const [visible, setVisible] = useState(pageSize);
  const sorted = useMemo(() => sortProducts(products, initialSort), [products, initialSort]);
  const slice = sorted.slice(0, visible);

  if (sorted.length === 0) {
    return (
      <div className="py-32 text-center">
        {emptyState ?? (
          <div className="space-y-4">
            <p className="font-audiowide text-[11px] uppercase tracking-[0.4em] text-foreground/60">
              Sonuç bulunamadı
            </p>
            <p className="text-foreground/40 text-sm">
              Filtrelerinizi değiştirerek tekrar deneyin.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-24"
      >
        <AnimatePresence mode="popLayout">
          {slice.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </AnimatePresence>
      </motion.div>

      {showLoadMore && visible < sorted.length ? (
        <div className="mt-32 text-center">
          <button
            onClick={() => setVisible((v) => v + pageSize)}
            className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40 hover:text-foreground transition-colors border-b border-foreground/5 hover:border-foreground pb-2"
          >
            Daha Fazla Yükle ({sorted.length - visible} ürün kaldı)
          </button>
        </div>
      ) : null}
    </>
  );
};
