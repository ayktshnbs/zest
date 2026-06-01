"use client";

import React, { useState } from "react";
import { Star, ShoppingCart, Heart, Eye, ArrowUpRight } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "./CartProvider";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col bg-card"
    >
      {/* Product Image Link */}
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-secondary/30">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          sizes="(max-w-640px) 100vw, (max-w-1024px) 50vw, 25vw"
          loading="lazy"
        />
        
        {/* Desktop Add to Cart - Visible only on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
              className="hidden lg:block absolute bottom-4 left-4 right-4 bg-foreground text-background py-4 font-audiowide text-[9px] uppercase tracking-[0.3em] z-20 hover:opacity-90 transition-opacity"
            >
              Sepete Ekle
            </motion.button>
          )}
        </AnimatePresence>

        {/* Favorite Icon - Minimal */}
        <button 
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-background text-foreground/20 hover:text-foreground transition-colors"
        >
          <Heart size={16} strokeWidth={1.5} />
        </button>
      </Link>
      
      {/* Product Info - Minimalist Typography */}
      <div className="pt-6 flex flex-col items-center text-center px-2">
        <span className="font-audiowide text-[8px] uppercase tracking-[0.4em] text-foreground/30 mb-2">
          {product.category}
        </span>
        
        <Link href={`/products/${product.id}`} className="block mb-2 w-full">
          <h4 className="font-body text-sm text-foreground font-medium tracking-tight leading-relaxed line-clamp-1">
            {product.name}
          </h4>
        </Link>
        
        <p className="font-audiowide text-xs text-foreground tracking-wide mb-6">
          {product.price} <span className="text-[10px] text-foreground/40 font-normal">TL</span>
        </p>

        {/* Mobile Add to Cart - Always visible on touch devices */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            addToCart(product);
          }}
          className="lg:hidden w-full py-4 bg-foreground text-background font-audiowide text-[9px] uppercase tracking-[0.3em] transition-transform active:scale-95"
        >
          Sepete Ekle
        </button>
      </div>
    </motion.div>
  );
};
