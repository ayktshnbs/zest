"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Search, Heart, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { CartSidebar } from "./CartSidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { products } from "@/lib/products";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/utils";

export const Navbar = () => {
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isSearchOpen]);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Anasayfa", href: "/" },
    { name: "Alışveriş", href: "/shop" },
    { name: "Kategoriler", href: "/kategoriler" },
    { name: "Hikayemiz", href: "/about" },
    { name: "İletişim", href: "/contact" },
  ];

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("tr");
    if (q.length < 2) return [];
    return products
      .filter((p) => {
        const hay = [p.name, p.categoryLabel, p.subcategoryLabel ?? "", ...p.tags]
          .join(" ")
          .toLocaleLowerCase("tr");
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [searchQuery]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-40 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isScrolled
            ? "bg-background/80 backdrop-blur-md py-3 md:py-4 border-b border-foreground/5"
            : "bg-transparent py-5 md:py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <span
              className={`font-audiowide text-2xl tracking-[0.2em] transition-colors duration-500 ${
                isScrolled ? "text-foreground" : "text-foreground/90"
              }`}
            >
              ZEST KITCHENE
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative font-audiowide text-[11px] uppercase tracking-[0.4em] transition-all duration-500 hover:opacity-50 ${
                    isScrolled
                      ? isActive
                        ? "text-foreground"
                        : "text-foreground/40"
                      : isActive
                      ? "text-foreground/90"
                      : "text-foreground/50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 md:gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Ara"
              className={`p-2 transition-all duration-500 ${
                isScrolled ? "text-foreground" : "text-foreground/90"
              }`}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <Link
              href="/favoriler"
              aria-label="Favoriler"
              className={`relative p-2 transition-all duration-500 hidden sm:block ${
                isScrolled ? "text-foreground" : "text-foreground/90"
              }`}
            >
              <Heart size={18} strokeWidth={1.5} />
              <AnimatePresence>
                {wishlistCount > 0 ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-0 right-0 text-[7px] w-3.5 h-3.5 flex items-center justify-center font-audiowide rounded-full bg-foreground text-background"
                  >
                    {wishlistCount}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Sepet"
              className={`relative p-2 transition-all duration-500 ${
                isScrolled ? "text-foreground" : "text-foreground/90"
              }`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-0 right-0 text-[7px] w-3.5 h-3.5 flex items-center justify-center font-audiowide rounded-full bg-foreground text-background"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Search overlay */}
      <AnimatePresence>
        {isSearchOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-md"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              className="max-w-3xl mx-auto pt-32 px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
                  Ürün Ara
                </span>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  aria-label="Kapat"
                  className="p-2 text-foreground/60 hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitSearch} className="relative border-b border-foreground/20 focus-within:border-foreground transition-colors">
                <Search
                  size={20}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-foreground/40"
                />
                <input
                  autoFocus
                  type="search"
                  placeholder="Ürün, kategori, etiket arayın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent pl-8 py-4 text-lg font-body text-foreground placeholder:text-foreground/30 focus:outline-none"
                />
              </form>

              {searchQuery.trim().length >= 2 ? (
                <div className="mt-8 space-y-1">
                  {searchResults.length === 0 ? (
                    <p className="text-foreground/40 text-sm py-4">
                      &ldquo;{searchQuery}&rdquo; için sonuç yok.
                    </p>
                  ) : (
                    searchResults.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-4 p-3 border border-transparent hover:border-foreground/10 transition-colors"
                      >
                        <div className="relative w-12 h-12 bg-secondary/30 flex-shrink-0">
                          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-audiowide uppercase tracking-[0.3em] text-foreground/40">
                            {p.categoryLabel}
                          </p>
                          <p className="text-sm text-foreground truncate">{p.name}</p>
                        </div>
                        <span className="font-audiowide text-xs text-foreground tracking-tight whitespace-nowrap">
                          {formatPrice(p.price)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              ) : (
                <div className="mt-10 space-y-6">
                  <p className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40">
                    Popüler Kategoriler
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/shop/${c.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="text-[10px] font-body uppercase tracking-[0.2em] border border-foreground/10 px-4 py-2 hover:border-foreground transition-colors"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
