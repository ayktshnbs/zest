"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "./CartProvider";
import { motion } from "framer-motion";

export const MobileNav = () => {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const navItems = [
    { name: "Anasayfa", href: "/", icon: Home },
    { name: "Ara", href: "/shop", icon: Search },
    { name: "Sepet", href: "/cart", icon: ShoppingBag, badge: totalItems },
    { name: "Profil", href: "/profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <nav className="glass rounded-[2rem] shadow-premium flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center p-3 transition-colors"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-400 ease-luxury ${
                isActive ? "bg-accent text-white scale-110 shadow-glow" : "text-text-secondary hover:text-white"
              }`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-background text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-lg">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] mt-1 font-bold uppercase tracking-widest transition-all duration-400 ${
                isActive ? "text-white opacity-100" : "opacity-0 h-0"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
