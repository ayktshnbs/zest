"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  ShoppingBag,
  Heart,
  Menu as MenuIcon,
  X,
  ChevronRight,
} from "lucide-react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "@/lib/categories";

export const MobileNav = () => {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  const navItems = [
    { name: "Vitrin", href: "/", icon: Home },
    { name: "Keşfet", href: "/shop", icon: Search },
    { name: "Favori", href: "/favoriler", icon: Heart, badge: wishlistCount },
    { name: "Sepet", href: "/sepet", icon: ShoppingBag, badge: totalItems },
  ];

  const menuLinks = [
    { name: "Anasayfa", href: "/" },
    { name: "Alışveriş", href: "/shop" },
    { name: "Kategoriler", href: "/kategoriler" },
    { name: "Hikayemiz", href: "/about" },
    { name: "İletişim", href: "/contact" },
  ];

  const helpLinks = [
    { name: "Kargo & Teslimat", href: "/yardim/kargo" },
    { name: "İade & Değişim", href: "/yardim/iade" },
    { name: "Favorilerim", href: "/favoriler" },
  ];

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[440px]">
        <nav className="bg-black/85 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl flex items-center justify-between px-4 py-3">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex flex-col items-center gap-1 transition-all flex-1"
              >
                <div
                  className={`relative p-2 rounded-full transition-all duration-500 ${
                    isActive ? "text-white scale-110" : "text-white/40"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 bg-white text-black text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-audiowide border border-black/10">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`font-audiowide text-[7px] uppercase tracking-[0.2em] transition-all duration-500 ${
                    isActive ? "text-white opacity-100" : "text-white/20"
                  }`}
                >
                  {item.name}
                </span>

                {isActive ? (
                  <motion.div
                    layoutId="mobileNavDot"
                    className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                  />
                ) : null}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Menüyü aç"
            className="relative flex flex-col items-center gap-1 transition-all flex-1"
          >
            <div
              className={`relative p-2 rounded-full transition-all duration-500 ${
                isMenuOpen ? "text-white scale-110" : "text-white/40"
              }`}
            >
              <MenuIcon size={18} strokeWidth={isMenuOpen ? 2 : 1.5} />
            </div>
            <span
              className={`font-audiowide text-[7px] uppercase tracking-[0.2em] transition-all duration-500 ${
                isMenuOpen ? "text-white opacity-100" : "text-white/20"
              }`}
            >
              Menü
            </span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.div
              key="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              key="mobile-menu-drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="md:hidden fixed inset-x-0 bottom-0 top-12 bg-background z-[101] shadow-2xl flex flex-col overflow-hidden rounded-t-3xl border-t border-foreground/10"
            >
              <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-foreground/10">
                <div>
                  <p className="font-audiowide text-sm uppercase tracking-[0.3em] text-foreground">
                    Menü
                  </p>
                  <p className="text-[10px] text-foreground/40 font-body mt-0.5">
                    Zest Kitchene
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Menüyü kapat"
                  className="p-2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10 pb-28 scrollbar-hide">
                <section>
                  <p className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
                    Gezin
                  </p>
                  <ul className="space-y-1">
                    {menuLinks.map((link) => {
                      const isActive = isItemActive(link.href);
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center justify-between py-3 border-b border-foreground/5 transition-colors ${
                              isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                            }`}
                          >
                            <span className="font-audiowide text-xs uppercase tracking-[0.3em]">
                              {link.name}
                            </span>
                            <ChevronRight size={16} className="opacity-40" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section>
                  <p className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
                    Kategoriler
                  </p>
                  <ul className="space-y-3">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/shop/${c.slug}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2"
                        >
                          <span className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground">
                            {c.label}
                          </span>
                        </Link>
                        {c.subcategories.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {c.subcategories.map((sub) => (
                              <Link
                                key={sub.slug}
                                href={`/shop/${c.slug}/${sub.slug}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-[10px] font-body border border-foreground/10 px-3 py-1.5 text-foreground/70 hover:border-foreground hover:text-foreground transition-colors"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <p className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
                    Yardım
                  </p>
                  <ul className="space-y-1">
                    {helpLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between py-3 border-b border-foreground/5 text-foreground/70 hover:text-foreground transition-colors"
                        >
                          <span className="font-body text-sm">{link.name}</span>
                          <ChevronRight size={16} className="opacity-40" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};
