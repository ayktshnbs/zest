"use client";

import React, { useState } from "react";
import { Star, ShoppingCart, Heart, Eye } from "lucide-react";
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
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-neutral-900 rounded-[2.5rem] p-4 transition-all duration-500 hover:shadow-premium-hover border border-transparent hover:border-primary/10 overflow-hidden"
    >
      {/* Wishlist Button */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          setIsWishlisted(!isWishlisted);
        }}
        className={`absolute top-6 right-6 z-20 p-3 rounded-full transition-all duration-300 ${
          isWishlisted 
            ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" 
            : "bg-white/80 dark:bg-black/40 backdrop-blur-md text-foreground/40 hover:text-primary hover:scale-110"
        }`}
      >
        <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2.5} />
      </button>

      {/* Product Image Link */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square rounded-[2rem] overflow-hidden mb-6 bg-accent/50 dark:bg-neutral-800">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 33vw"
        />
        
        {/* Overlay Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center gap-3 z-10"
            >
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  // Quick View logic could go here
                }}
                className="p-4 bg-white dark:bg-neutral-800 text-foreground rounded-full shadow-xl hover:bg-primary hover:text-white transition-all duration-300 scale-90 hover:scale-100"
              >
                <Eye size={22} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
      
      {/* Product Info */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 bg-primary/5 px-3 py-1 rounded-full">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-secondary text-secondary" />
            <span className="text-xs font-bold text-foreground/60">{product.rating}.0</span>
          </div>
        </div>
        
        <Link href={`/products/${product.id}`}>
          <h4 className="font-display font-bold text-[#1c1c13] dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight text-lg tracking-tight">
            {product.name}
          </h4>
        </Link>
        
        <p className="font-body text-sm text-foreground/50 mb-6 line-clamp-1 font-medium italic">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mb-0.5">Fiyat</span>
            <p className="font-display font-black text-2xl text-primary">{product.price} TL</p>
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="relative flex items-center justify-center w-14 h-14 bg-neutral-950 dark:bg-primary text-white rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 active:scale-90 overflow-hidden group/btn"
          >
            <ShoppingCart size={22} className="group-hover/btn:-translate-y-12 transition-transform duration-500" />
            <span className="absolute translate-y-12 group-hover/btn:translate-y-0 transition-transform duration-500 font-bold text-[10px] uppercase">Ekle</span>
          </button>
        </div>
      </div>

      {/* Quick Badges */}
      {product.price > 200 && (
        <div className="absolute top-6 left-6 z-20">
          <span className="bg-secondary text-secondary-foreground text-[10px] font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-tighter">
            Ücretsiz Kargo
          </span>
        </div>
      )}
    </motion.div>
  );
};



