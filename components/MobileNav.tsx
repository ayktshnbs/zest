"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, Sparkles } from "lucide-react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { motion } from "framer-motion";

export const MobileNav = () => {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();

  const navItems = [
    { name: "Vitrin", href: "/", icon: Home },
    { name: "Keşfet", href: "/shop", icon: Search },
    { name: "Favori", href: "/favoriler", icon: Heart, badge: wishlistCount },
    { name: "Sepet", href: "/sepet", icon: ShoppingBag, badge: totalItems },
    { name: "Zest Kitchene", href: "/about", icon: Sparkles },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[440px]">
      <nav className="bg-black/85 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl flex items-center justify-between px-4 py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
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
      </nav>
    </div>
  );
};
