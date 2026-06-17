"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Category, Product, SortKey } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveCatalog } from "@/lib/useStock";
import { mergeProducts } from "@/lib/customProducts";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Öne Çıkanlar" },
  { value: "popular", label: "En Popüler" },
  { value: "newest", label: "Yeni Gelenler" },
  { value: "price-asc", label: "Fiyat: Artan" },
  { value: "price-desc", label: "Fiyat: Azalan" },
  { value: "name-asc", label: "İsim: A → Z" },
];

const PAGE_SIZE = 12;

export const CategoryShop = ({
  category,
  products: staticInCategory,
}: {
  category: Category;
  products: Product[];
}) => {
  // Pull admin-added products into this category from the live catalog.
  const liveCatalog = useLiveCatalog();
  const retired = useMemo(() => new Set(liveCatalog.retiredIds), [liveCatalog.retiredIds]);
  const products = useMemo(() => {
    const merged = mergeProducts(
      staticInCategory,
      liveCatalog.customProducts,
      liveCatalog.categories,
    );
    return merged.filter((p) => p.category === category.slug && !retired.has(p.id));
  }, [staticInCategory, liveCatalog.customProducts, liveCatalog.categories, category.slug, retired]);

  const searchParams = useSearchParams();
  const initialSub = (() => {
    const fromUrl = searchParams.get("sub");
    if (fromUrl && category.subcategories.some((s) => s.slug === fromUrl)) {
      return fromUrl;
    }
    return "all";
  })();
  const [selectedSub, setSelectedSub] = useState<string>(initialSub);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Keep selectedSub in sync if the URL changes (e.g. navigating back/forward
  // between subcategory deep-links).
  useEffect(() => {
    const fromUrl = searchParams.get("sub");
    if (!fromUrl) {
      setSelectedSub("all");
      return;
    }
    if (category.subcategories.some((s) => s.slug === fromUrl)) {
      setSelectedSub(fromUrl);
    }
  }, [searchParams, category.subcategories]);

  const filtered = useMemo(() => {
    const base =
      selectedSub === "all"
        ? products
        : products.filter((p) => p.subcategory === selectedSub);
    const copy = [...base];
    switch (sortBy) {
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
        return copy.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
      case "featured":
      default:
        return copy.sort(
          (a, b) =>
            Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
            Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)) ||
            b.rating - a.rating,
        );
    }
  }, [products, selectedSub, sortBy]);

  return (
    <>
      <div className="mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-3 min-w-max">
          <button
            onClick={() => setSelectedSub("all")}
            className={`text-[10px] font-body uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${
              selectedSub === "all"
                ? "border-foreground text-foreground"
                : "border-foreground/10 text-foreground/40 hover:text-foreground hover:border-foreground/30"
            }`}
          >
            Tümü ({products.length})
          </button>
          {category.subcategories.map((sub) => {
            const count = products.filter((p) => p.subcategory === sub.slug).length;
            return (
              <button
                key={sub.slug}
                onClick={() => setSelectedSub(sub.slug)}
                className={`text-[10px] font-body uppercase tracking-[0.2em] px-4 py-2 border transition-colors whitespace-nowrap ${
                  selectedSub === sub.slug
                    ? "border-foreground text-foreground"
                    : "border-foreground/10 text-foreground/40 hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {sub.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky top-20 z-30 py-4 border-y border-foreground/5 bg-background/90 backdrop-blur-md mb-12">
        <div className="flex items-center justify-between gap-6">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40">
            {filtered.length} ürün
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-transparent font-audiowide text-[10px] uppercase tracking-[0.3em] border-none focus:ring-0 cursor-pointer text-foreground/60 hover:text-foreground"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-32 text-center">
          <p className="font-audiowide text-[11px] uppercase tracking-[0.4em] text-foreground/60">
            Bu alt kategoride ürün yok
          </p>
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-20"
          >
            <AnimatePresence mode="popLayout">
              {filtered.slice(0, visibleCount).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </AnimatePresence>
          </motion.div>

          {visibleCount < filtered.length ? (
            <div className="mt-24 text-center">
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/60 hover:text-foreground transition-colors border-b border-foreground/10 hover:border-foreground pb-2"
              >
                Daha Fazla Yükle
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
};
