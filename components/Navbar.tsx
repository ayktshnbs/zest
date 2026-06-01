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
        className={`fixed top-0 w-full z-40 transition-all duration-600 ease-luxury ${
          isScrolled 
            ? "glass py-4" 
            : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-metallic border border-white/10 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-black/50 group-hover:scale-105 group-hover:shadow-glow transition-all duration-400 ease-luxury">
              <span className="font-bold text-xl">Z</span>
            </div>
            <span className="font-display text-2xl font-black text-text-primary tracking-tighter group-hover:text-primary transition-colors duration-400">Zest</span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-12 glass px-10 py-3 rounded-full border-white/5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative font-body font-bold text-[10px] uppercase tracking-[0.3em] transition-all duration-400 hover:text-white group ${
                    isActive ? "text-white" : "text-text-secondary"
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-px bg-accent transition-all duration-400 ease-luxury shadow-glow ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </Link>
              );
            })}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4 glass px-4 py-2 rounded-full border-white/5">
            {/* Search - Desktop */}
            <button className="hidden md:flex p-2 text-text-secondary hover:text-accent hover:shadow-glow transition-all duration-400 rounded-full">
              <Search size={18} />
            </button>

            {/* Profile */}
            <button className="hidden sm:flex p-2 text-text-secondary hover:text-accent hover:shadow-glow transition-all duration-400 rounded-full">
              <User size={18} />
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-text-primary hover:text-accent transition-all duration-400 group"
            >
              <ShoppingBag size={20} className="group-hover:scale-110 transition-transform duration-400" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-black shadow-glow"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile Menu Button - Hidden on Desktop */}
            <button 
              className="lg:hidden p-2 text-text-primary hover:text-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 w-[85%] max-w-[400px] h-full bg-surface z-[101] shadow-2xl lg:hidden flex flex-col border-r border-white/5"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                    <span className="font-bold text-xl">Z</span>
                  </div>
                  <span className="font-display text-2xl font-black text-text-primary">Zest</span>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 bg-white/5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <nav className="flex-1 p-8 overflow-y-auto">
                <div className="space-y-6">
                  {navLinks.map((link, i) => (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * i }}
                      key={link.name}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between p-6 rounded-2xl font-display text-xl font-bold transition-all duration-400 ${
                          pathname === link.href 
                            ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                            : "hover:bg-white/5 text-text-primary"
                        }`}
                      >
                        {link.name}
                        <ChevronRight size={20} className={pathname === link.href ? "opacity-100" : "opacity-20"} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </nav>

              <div className="p-10 border-t border-white/5 space-y-6">
                <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em]">Bizi Takip Edin</p>
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:border-primary transition-colors cursor-pointer group">
                      <div className="w-5 h-5 bg-text-secondary group-hover:bg-primary transition-colors rounded-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
