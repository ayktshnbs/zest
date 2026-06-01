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
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="metallic-card group shine-sweep"
    >
      {/* Product Image Link */}
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-[#1a1d23]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-110"
          sizes="(max-w-640px) 100vw, (max-w-1024px) 50vw, 25vw"
          loading="lazy"
        />
        
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Wishlist Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className={`absolute top-5 right-5 z-20 p-3 rounded-full transition-all duration-400 ease-luxury ${
            isWishlisted 
              ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" 
              : "bg-black/40 backdrop-blur-md text-white/40 hover:text-primary hover:scale-110 border border-white/10"
          }`}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>

        {/* Floating Quick Action */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-6 right-6 z-10"
            >
              <div className="glass px-5 py-3 rounded-2xl flex items-center justify-between border border-white/10 shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">İncele</span>
                <ArrowUpRight size={16} className="text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
      
      {/* Product Info */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star size={10} className="fill-primary text-primary" />
            <span className="text-[10px] font-bold text-text-secondary">{product.rating}.0</span>
          </div>
        </div>
        
        <Link href={`/products/${product.id}`}>
          <h4 className="font-display font-bold text-text-primary group-hover:text-primary transition-colors duration-400 ease-luxury text-lg tracking-tight leading-tight">
            {product.name}
          </h4>
        </Link>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[8px] text-text-secondary font-bold uppercase tracking-widest mb-0.5 opacity-50">Fiyat</span>
            <p className="font-display font-bold text-xl text-text-primary tracking-tight">
              {product.price} <span className="text-sm font-medium text-text-secondary">TL</span>
            </p>
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-12 h-12 bg-white/5 border border-white/10 text-text-primary rounded-xl transition-all duration-400 ease-luxury hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center group/btn"
          >
            <ShoppingCart size={18} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
