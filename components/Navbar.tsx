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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Anasayfa", href: "/" },
    { name: "Alışveriş", href: "/shop" },
    { name: "Hakkımızda", href: "/about" },
    { name: "İletişim", href: "/contact" },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-40 transition-all duration-500 ${
          isScrolled 
            ? "glass py-3 shadow-premium" 
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-secondary shadow-lg shadow-primary/20 group-hover:scale-110 transition-all duration-300">
              <span className="font-bold text-xl">Z</span>
            </div>
            <span className="font-display text-2xl font-black text-primary tracking-tighter">Zest</span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative font-body font-bold text-xs uppercase tracking-[0.2em] transition-all hover:text-primary group ${
                    isActive ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </Link>
              );
            })}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search - Desktop */}
            <div className="hidden md:flex relative group">
              <input 
                type="text" 
                placeholder="Ürün ara..."
                className="w-0 group-hover:w-48 transition-all duration-500 pl-10 pr-4 py-2 bg-accent rounded-full border-none focus:ring-2 focus:ring-primary/20 font-body text-xs opacity-0 group-hover:opacity-100"
              />
              <button className="p-3 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors relative z-10">
                <Search size={20} className="text-foreground/70" />
              </button>
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-3 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors text-foreground/70"
                aria-label="Temayı Değiştir"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {/* Profile */}
            <button className="hidden sm:flex p-3 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors text-foreground/70">
              <User size={20} />
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors group"
            >
              <ShoppingBag size={20} className="text-foreground group-hover:scale-110 transition-transform" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg shadow-primary/30"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile Menu Button - Hidden on Desktop */}
            <button 
              className="lg:hidden p-3 hover:bg-white dark:hover:bg-white/10 rounded-full transition-colors"
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
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 w-[85%] max-w-[400px] h-full bg-background z-[101] shadow-2xl lg:hidden flex flex-col"
            >
              <div className="p-8 border-b border-border flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-secondary">
                    <span className="font-bold text-xl">Z</span>
                  </div>
                  <span className="font-display text-2xl font-black text-primary">Zest</span>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 bg-accent rounded-full hover:bg-primary hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <nav className="flex-1 p-8 overflow-y-auto">
                <div className="space-y-4">
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
                        className={`flex items-center justify-between p-5 rounded-3xl font-display text-xl font-bold transition-all ${
                          pathname === link.href 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        {link.name}
                        <ChevronRight size={20} className={pathname === link.href ? "opacity-100" : "opacity-20"} />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-12 p-8 glass-card rounded-[2rem] space-y-6">
                  <h4 className="font-display font-bold text-lg">Kategoriler</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {["Bıçaklar", "Pişirme", "Sofra", "Kahve"].map((cat) => (
                      <Link 
                        key={cat} 
                        href={`/shop?cat=${cat}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-3 bg-white dark:bg-white/5 rounded-2xl text-center font-medium hover:text-primary transition-colors"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>

              <div className="p-8 border-t border-border space-y-6 bg-accent/30">
                <p className="text-neutral-500 text-sm font-medium">Bizi sosyal medyada takip edin</p>
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer">
                      <Menu size={20} />
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


