"use client";

import { useState, useMemo, useEffect } from "react";
import { products } from "@/lib/mockData";
import { ProductCard } from "@/components/ProductCard";
import { Search, SlidersHorizontal, ChevronDown, X, Filter, LayoutGrid, List, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = ["Tümü", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "Tümü" || product.category === selectedCategory;
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        const matchesRating = product.rating >= minRating;
        
        return matchesSearch && matchesCategory && matchesPrice && matchesRating;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
      });
  }, [searchQuery, selectedCategory, sortBy, priceRange, minRating]);

  return (
    <main className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase mb-3 block">Mağaza</span>
            <h1 className="font-display text-5xl md:text-7xl font-black text-foreground tracking-tighter">
              Tüm Koleksiyon
            </h1>
          </motion.div>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4 bg-accent/50 p-2 rounded-[2rem] border border-border"
          >
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-[1.5rem] transition-all ${viewMode === "grid" ? "bg-white dark:bg-primary shadow-lg text-foreground dark:text-white" : "text-foreground/40 hover:text-foreground"}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-[1.5rem] transition-all ${viewMode === "list" ? "bg-white dark:bg-primary shadow-lg text-foreground dark:text-white" : "text-foreground/40 hover:text-foreground"}`}
            >
              <List size={20} />
            </button>
          </motion.div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block lg:col-span-3 space-y-10 sticky top-32 h-fit">
            {/* Search */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg">Ara</h3>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-5 rounded-[2rem] bg-white dark:bg-neutral-900 border border-border focus:border-primary/30 outline-none shadow-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg">Kategoriler</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-white dark:bg-neutral-900 text-foreground/60 border border-border hover:border-primary/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-lg">Fiyat Aralığı</h3>
                <span className="text-xs font-black text-primary bg-primary/5 px-3 py-1 rounded-full">{priceRange[1]} TL</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="500" 
                step="10"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                <span>0 TL</span>
                <span>500 TL</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg">Minimum Puan</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMinRating(star)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      minRating >= star 
                        ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20" 
                        : "bg-white dark:bg-neutral-900 border border-border text-foreground/30"
                    }`}
                  >
                    <Star size={16} fill={minRating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg">Sıralama</h3>
              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-neutral-900 px-6 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest border border-border focus:border-primary/30 outline-none cursor-pointer shadow-sm transition-all pr-12"
                >
                  <option value="default">Varsayılan</option>
                  <option value="price-low">En Düşük Fiyat</option>
                  <option value="price-high">En Yüksek Fiyat</option>
                  <option value="rating">En Yüksek Puan</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/30" size={18} />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-9">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex gap-4 mb-8">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex-1 flex items-center justify-center gap-3 bg-white dark:bg-neutral-900 p-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm border border-border"
              >
                <SlidersHorizontal size={18} className="text-primary" />
                Filtrele & Sırala
              </button>
            </div>

            {filteredProducts.length > 0 ? (
              <motion.div 
                layout
                className={`grid gap-10 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" 
                    : "grid-cols-1"
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 bg-white dark:bg-neutral-900 rounded-[4rem] border border-dashed border-border"
              >
                <div className="bg-accent w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Search size={40} className="text-foreground/20" />
                </div>
                <h3 className="font-display text-3xl font-black text-foreground mb-4 tracking-tighter">Sonuç Bulunamadı</h3>
                <p className="text-foreground/50 font-medium italic mb-10">Kriterlerinize uygun ürün bulunamadı. Lütfen filtreleri güncelleyin.</p>
                <button 
                  onClick={() => {
                    setSearchQuery(""); 
                    setSelectedCategory("Tümü");
                    setPriceRange([0, 500]);
                    setMinRating(0);
                  }}
                  className="btn-primary"
                >
                  Tüm Filtreleri Temizle
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-background z-[101] rounded-t-[4rem] shadow-2xl lg:hidden flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-border flex justify-between items-center bg-white dark:bg-neutral-950">
                <h3 className="font-display text-2xl font-black tracking-tighter">Filtrele</h3>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="p-3 bg-accent rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32">
                {/* Search in Mobile Filter */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg">Ara</h3>
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-8 py-5 rounded-[2rem] bg-accent border-none outline-none font-medium"
                  />
                </div>

                {/* Categories - Mobile */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg">Kategoriler</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                          selectedCategory === cat
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-white dark:bg-neutral-900 border border-border"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price - Mobile */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-lg">Fiyat Aralığı</h3>
                    <span className="text-sm font-black text-primary">{priceRange[1]} TL</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="500" 
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full h-3 bg-accent rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 bg-white dark:bg-neutral-950 border-t border-border">
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full btn-primary py-6 text-lg"
                >
                  Sonuçları Gör ({filteredProducts.length})
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

