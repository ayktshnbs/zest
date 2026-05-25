"use client";

import React, { useState } from "react";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { CartSidebar } from "./CartSidebar";

export const Navbar = () => {
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full bg-[#fdf9e9]/80 backdrop-blur-md z-40 border-b border-[#dedacb]">
        <div className="max-w-7xl mx-auto px-5 md:px-16 h-20 flex items-center justify-between">
          {/* Mobile Menu */}
          <button className="md:hidden text-[#1c1c13]">
            <Menu size={24} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-[#b80035] rounded-full flex items-center justify-center text-[#ffc329]">
              <span className="font-bold text-lg">Z</span>
            </div>
            <span className="font-display text-2xl font-extrabold text-[#b80035]">Zest</span>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8">
            {["Shop All", "Cookware", "Cutlery", "Dining", "Tools"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="font-body font-medium text-[#1c1c13] transition-colors hover:text-[#b80035]"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-5 text-[#1c1c13]">
            <button className="hidden sm:block hover:text-[#b80035] transition-colors">
              <Search size={22} />
            </button>
            <button className="hidden sm:block hover:text-[#b80035] transition-colors">
              <User size={22} />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-[#b80035] transition-colors"
            >
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#795900] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
