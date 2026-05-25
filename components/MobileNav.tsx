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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <nav className="glass rounded-[2rem] shadow-premium flex items-center justify-around p-2 border border-white/20">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center p-3 transition-colors"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "text-foreground/60 hover:text-primary"
              }`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#fdf9e9] dark:border-black">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-bold tracking-tight transition-all duration-300 ${
                isActive ? "text-primary opacity-100" : "opacity-0"
              }`}>
                {item.name}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
