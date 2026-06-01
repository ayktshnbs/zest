"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Search, User, Menu, X, ChevronRight, Moon, Sun } from "lucide-react";
import { useCart } from "./CartProvider";
import { CartSidebar } from "./CartSidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Anasayfa", href: "/" },
    { name: "Alışveriş", href: "/shop" },
    { name: "Hikayemiz", href: "/about" },
    { name: "İletişim", href: "/contact" },
  ];

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <span className={`font-audiowide text-2xl tracking-[0.2em] transition-colors duration-500 ${isScrolled ? "text-foreground" : "text-foreground/90"}`}>ZEST</span>
          </Link>

          {/* Desktop Links - Minimal Centered */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative font-audiowide text-[11px] uppercase tracking-[0.4em] transition-all duration-500 hover:opacity-50 ${
                    isScrolled 
                      ? (isActive ? "text-foreground" : "text-foreground/40")
                      : (isActive ? "text-foreground/90" : "text-foreground/50")
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Icons - Minimal Right */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className={`p-2 transition-all duration-500 ${isScrolled ? "text-foreground" : "text-foreground/90"}`}>
              <Search size={18} strokeWidth={1.5} />
            </button>
            
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 transition-all duration-500 ${isScrolled ? "text-foreground" : "text-foreground/90"}`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className={`absolute top-0 right-0 text-[7px] w-3.5 h-3.5 flex items-center justify-center font-audiowide rounded-full ${isScrolled ? "bg-foreground text-background" : "bg-foreground text-background"}`}
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
    </>
  );
};
