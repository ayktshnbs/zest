"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { products } from "@/lib/products";
import { categories, categoryMap } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { SortKey } from "@/types";

type BadgeFilter = "new" | "bestseller" | "sale";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Öne Çıkanlar" },
  { value: "popular", label: "En Popüler" },
  { value: "newest", label: "Yeni Gelenler" },
  { value: "price-asc", label: "Fiyat: Artan" },
  { value: "price-desc", label: "Fiyat: Azalan" },
  { value: "name-asc", label: "İsim: A → Z" },
];

const PAGE_SIZE = 12;

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("cat") ?? "all",
  );
  const [selectedSub, setSelectedSub] = useState<string>(
    searchParams.get("sub") ?? "all",
  );
  const [sortBy, setSortBy] = useState<SortKey>(
    (searchParams.get("sort") as SortKey) || "featured",
  );
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const max = Math.max(...products.map((p) => p.price));
    const fromUrl = Number(searchParams.get("max"));
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : Math.ceil(max / 100) * 100;
  });
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    searchParams.get("instock") === "1",
  );
  const [badgeFilters, setBadgeFilters] = useState<BadgeFilter[]>(() => {
    const raw = searchParams.get("badges");
    if (!raw) return [];
    return raw.split(",").filter((x): x is BadgeFilter =>
      ["new", "bestseller", "sale"].includes(x),
    );
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(...products.map((p) => p.price)) / 100) * 100,
    [],
  );

  const activeCategory = selectedCategory !== "all" ? categoryMap[selectedCategory] : undefined;

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory !== "all") params.set("cat", selectedCategory);
    if (selectedSub !== "all") params.set("sub", selectedSub);
    if (sortBy !== "featured") params.set("sort", sortBy);
    if (maxPrice !== priceCeiling) params.set("max", String(maxPrice));
    if (inStockOnly) params.set("instock", "1");
    if (badgeFilters.length > 0) params.set("badges", badgeFilters.join(","));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, selectedCategory, selectedSub, sortBy, maxPrice, inStockOnly, badgeFilters, pathname, router, priceCeiling]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSub("all");
  }, [selectedCategory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return products
      .filter((p) => {
        if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
        if (selectedSub !== "all" && p.subcategory !== selectedSub) return false;
        if (p.price > maxPrice) return false;
        if (inStockOnly && p.stock <= 0) return false;
        if (badgeFilters.length > 0) {
          const matches =
            (badgeFilters.includes("new") && p.isNew) ||
            (badgeFilters.includes("bestseller") && p.isBestSeller) ||
            (badgeFilters.includes("sale") && (p.discountPercent ?? 0) > 0);
          if (!matches) return false;
        }
        if (q) {
          const hay = [p.name, p.categoryLabel, p.subcategoryLabel ?? "", ...p.tags]
            .join(" ")
            .toLocaleLowerCase("tr");
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-asc":
            return a.price - b.price;
          case "price-desc":
            return b.price - a.price;
          case "name-asc":
            return a.name.localeCompare(b.name, "tr");
          case "newest":
            return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) ||
              b.id.localeCompare(a.id);
          case "popular":
            return b.reviewCount - a.reviewCount || b.rating - a.rating;
          case "featured":
          default:
            return (
              Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
              Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)) ||
              b.rating - a.rating
            );
        }
      });
  }, [query, selectedCategory, selectedSub, sortBy, maxPrice, inStockOnly, badgeFilters]);

  const toggleBadge = (badge: BadgeFilter) => {
    setBadgeFilters((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge],
    );
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedSub("all");
    setSortBy("featured");
    setMaxPrice(priceCeiling);
    setInStockOnly(false);
    setBadgeFilters([]);
    setVisibleCount(PAGE_SIZE);
  };

  const hasActiveFilter =
    query !== "" ||
    selectedCategory !== "all" ||
    selectedSub !== "all" ||
    sortBy !== "featured" ||
    maxPrice !== priceCeiling ||
    inStockOnly ||
    badgeFilters.length > 0;

  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Header */}
        <div className="mb-12 md:mb-20 text-center space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-audiowide text-5xl md:text-7xl text-foreground tracking-tight uppercase">
              Mutfak Gereçleri
            </h1>
            <p className="font-body text-foreground/40 text-lg md:text-xl max-w-2xl mx-auto mt-6 font-light leading-relaxed">
              Mutfaktaki her anı daha özel kılan, minimalizm ve fonksiyonelliğin birleştiği özel
              koleksiyonumuz.
            </p>
          </motion.div>
        </div>

        {/* Search bar */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative border-b border-foreground/10 focus-within:border-foreground transition-colors">
            <Search
              size={16}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-foreground/30"
            />
            <input
              type="search"
              placeholder="Ürün, kategori veya etiket arayın..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="w-full bg-transparent pl-7 pr-10 py-4 font-body text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-foreground/30 hover:text-foreground"
                aria-label="Aramayı temizle"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category chips */}
        <div className="mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-4 justify-center min-w-max px-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`font-audiowide text-[9px] uppercase tracking-[0.3em] whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "text-foreground border-b border-foreground pb-1"
                  : "text-foreground/30 hover:text-foreground"
              }`}
            >
              Tümü
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`font-audiowide text-[9px] uppercase tracking-[0.3em] whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug
                    ? "text-foreground border-b border-foreground pb-1"
                    : "text-foreground/30 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory chips (only when a category is selected) */}
        {activeCategory ? (
          <div className="mb-8 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 justify-center min-w-max px-2">
              <button
                onClick={() => setSelectedSub("all")}
                className={`text-[10px] font-body uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${
                  selectedSub === "all"
                    ? "border-foreground text-foreground"
                    : "border-foreground/10 text-foreground/40 hover:text-foreground hover:border-foreground/30"
                }`}
              >
                Tüm {activeCategory.shortLabel}
              </button>
              {activeCategory.subcategories.map((sub) => (
                <button
                  key={sub.slug}
                  onClick={() => setSelectedSub(sub.slug)}
                  className={`text-[10px] font-body uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${
                    selectedSub === sub.slug
                      ? "border-foreground text-foreground"
                      : "border-foreground/10 text-foreground/40 hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Toolbar */}
        <div className="sticky top-20 z-30 py-4 border-y border-foreground/5 bg-background/90 backdrop-blur-md mb-12">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground transition-colors"
            >
              <SlidersHorizontal size={14} strokeWidth={1.5} />
              Filtrele
              {hasActiveFilter ? (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-foreground" />
              ) : null}
            </button>

            <div className="flex items-center gap-6 md:gap-10">
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
              <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40">
                {filtered.length} ürün
              </span>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilter ? (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {selectedCategory !== "all" ? (
                <FilterChip onClear={() => setSelectedCategory("all")}>
                  {categoryMap[selectedCategory]?.label}
                </FilterChip>
              ) : null}
              {selectedSub !== "all" && activeCategory ? (
                <FilterChip onClear={() => setSelectedSub("all")}>
                  {activeCategory.subcategories.find((s) => s.slug === selectedSub)?.label}
                </FilterChip>
              ) : null}
              {inStockOnly ? (
                <FilterChip onClear={() => setInStockOnly(false)}>
                  Sadece stoktakiler
                </FilterChip>
              ) : null}
              {badgeFilters.map((b) => (
                <FilterChip key={b} onClear={() => toggleBadge(b)}>
                  {b === "new" ? "Yeni Gelenler" : b === "bestseller" ? "Çok Satanlar" : "İndirimliler"}
                </FilterChip>
              ))}
              {maxPrice !== priceCeiling ? (
                <FilterChip onClear={() => setMaxPrice(priceCeiling)}>
                  Maks. {formatPrice(maxPrice)}
                </FilterChip>
              ) : null}
              {query ? (
                <FilterChip onClear={() => setQuery("")}>"{query}"</FilterChip>
              ) : null}
              <button
                onClick={resetFilters}
                className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground underline underline-offset-4 ml-2"
              >
                Temizle
              </button>
            </div>
          ) : null}
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="py-32 text-center space-y-4">
            <p className="font-audiowide text-[11px] uppercase tracking-[0.4em] text-foreground/60">
              Sonuç bulunamadı
            </p>
            <p className="text-foreground/40 text-sm max-w-md mx-auto">
              Aradığınız kriterlere uygun ürün yok. Filtrelerinizi değiştirerek tekrar deneyin.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground border-b border-foreground/20 hover:border-foreground pb-1"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-20"
            >
              <AnimatePresence mode="popLayout">
                {filtered.slice(0, visibleCount).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
            </motion.div>

            {visibleCount < filtered.length ? (
              <div className="mt-24 text-center">
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/60 hover:text-foreground transition-colors border-b border-foreground/10 hover:border-foreground pb-2"
                >
                  Daha Fazla Yükle ({filtered.length - visibleCount} ürün kaldı)
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[90]"
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-[91] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-foreground/5">
                <span className="font-audiowide text-[11px] uppercase tracking-[0.4em]">
                  Filtreler
                </span>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 text-foreground/60 hover:text-foreground"
                  aria-label="Kapat"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-10">
                <div>
                  <p className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
                    Maksimum Fiyat
                  </p>
                  <input
                    type="range"
                    min={50}
                    max={priceCeiling}
                    step={50}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-foreground"
                  />
                  <div className="flex justify-between text-[10px] font-body text-foreground/50 mt-2">
                    <span>{formatPrice(50)}</span>
                    <span className="font-audiowide text-foreground tracking-wider">
                      {formatPrice(maxPrice)}
                    </span>
                    <span>{formatPrice(priceCeiling)}</span>
                  </div>
                </div>

                <div>
                  <p className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
                    Etiketler
                  </p>
                  <div className="space-y-2">
                    {(
                      [
                        ["new", "Yeni Gelenler"],
                        ["bestseller", "Çok Satanlar"],
                        ["sale", "İndirimli Ürünler"],
                      ] as [BadgeFilter, string][]
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex items-center gap-3 cursor-pointer py-2 group"
                      >
                        <input
                          type="checkbox"
                          checked={badgeFilters.includes(value)}
                          onChange={() => toggleBadge(value)}
                          className="rounded-none border-foreground/30 text-foreground focus:ring-foreground/30"
                        />
                        <span className="font-body text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
                    Stok
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer py-2 group">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded-none border-foreground/30 text-foreground focus:ring-foreground/30"
                    />
                    <span className="font-body text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                      Sadece stoktaki ürünler
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-foreground/5 flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-4 border border-foreground/10 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors"
                >
                  Temizle
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90"
                >
                  Sonuçları Göster
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function FilterChip({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-body text-foreground/70">
      {children}
      <button
        onClick={onClear}
        className="text-foreground/40 hover:text-foreground"
        aria-label="Filtreyi kaldır"
      >
        <X size={11} />
      </button>
    </span>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-40 text-center font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">Yükleniyor</div>}>
      <ShopContent />
    </Suspense>
  );
}
