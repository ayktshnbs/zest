"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, Sparkles } from "lucide-react";
import { useCart } from "./CartProvider";
import { motion } from "framer-motion";

export const MobileNav = () => {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const navItems = [
    { name: "Vitrin", href: "/", icon: Home },
    { name: "Keşfet", href: "/shop", icon: Search },
    { name: "Sepet", href: "/cart", icon: ShoppingBag, badge: totalItems },
    { name: "Zest", href: "/about", icon: Sparkles },
  ];

  return (
    <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px]">
      <nav className="bg-black/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl flex items-center justify-between px-6 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center gap-1 transition-all"
            >
              <div className={`relative p-2 rounded-full transition-all duration-500 ${
                isActive ? "text-white scale-110" : "text-white/40"
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-white text-black text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-audiowide border border-black/10">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`font-audiowide text-[7px] uppercase tracking-[0.2em] transition-all duration-500 ${
                isActive ? "text-white opacity-100" : "text-white/20"
              }`}>
                {item.name}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="mobileNavDot"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
