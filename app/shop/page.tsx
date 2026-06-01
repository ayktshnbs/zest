"use client";

import { useState, useMemo, useEffect } from "react";
import { products } from "@/lib/mockData";
import { ProductCard } from "@/components/ProductCard";
import { Search, SlidersHorizontal, ChevronDown, X, Filter, LayoutGrid, List, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [sortBy, setSortBy] = useState("default");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categories = ["Tümü", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory = selectedCategory === "Tümü" || product.category === selectedCategory;
        return matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        return 0;
      });
  }, [selectedCategory, sortBy]);

  return (
    <main className="min-h-screen pt-48 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Collection Header */}
        <div className="mb-24 text-center space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-audiowide text-6xl md:text-8xl text-foreground tracking-tight uppercase">
              Mutfak Gereçleri
            </h1>
            <p className="font-body text-foreground/40 text-lg md:text-xl max-w-2xl mx-auto mt-8 font-light leading-relaxed">
              Mutfaktaki her anı daha özel kılan, minimalizm ve fonksiyonelliğin birleştiği özel koleksiyonumuz.
            </p>
          </motion.div>
        </div>

        {/* Sticky Filter Bar */}
        <div className={`sticky top-20 z-30 transition-all duration-500 py-6 border-y border-foreground/5 bg-background/90 backdrop-blur-md mb-20 ${isScrolled ? "opacity-100 translate-y-0" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`font-audiowide text-[9px] uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                      selectedCategory === cat ? "text-foreground border-b border-foreground pb-1" : "text-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-audiowide text-[9px] uppercase tracking-[0.3em] border-none focus:ring-0 cursor-pointer text-foreground/60 hover:text-foreground transition-colors"
              >
                <option value="default">Sırala</option>
                <option value="price-low">Fiyat: Düşükten Yükseğe</option>
                <option value="price-high">Fiyat: Yüksekten Düşüğe</option>
              </select>
              <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/20">
                {filteredProducts.length} Ürün
              </span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-24"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination / Load More */}
        <div className="mt-32 text-center">
          <button className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-black/40 hover:text-black transition-colors border-b border-black/5 hover:border-black pb-2">
            Daha Fazla Yükle
          </button>
        </div>
      </div>
    </main>
  );
}

