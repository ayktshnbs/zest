"use client";

import React from "react";
import { Star, ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "./CartProvider";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-2xl p-4 group transition-all hover:shadow-xl hover:shadow-[#1c1c13]/5 border border-transparent hover:border-[#dedacb]">
      <div className="aspect-square rounded-xl overflow-hidden mb-6 bg-[#f2eede] relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={() => addToCart(product)}
          className="absolute bottom-4 right-4 bg-[#b80035] text-white p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
        >
          <ShoppingCart size={20} />
        </button>
      </div>
      <div className="px-2">
        <div className="flex gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < product.rating ? "#ffc329" : "none"}
              color={i < product.rating ? "#ffc329" : "#ccc"}
            />
          ))}
        </div>
        <h4 className="font-display font-bold text-[#1c1c13] mb-1 group-hover:text-[#b80035] transition-colors leading-tight">
          {product.name}
        </h4>
        <p className="font-body text-sm text-[#5c3f40] mb-3 line-clamp-1">{product.description}</p>
        <p className="font-body font-bold text-lg text-[#1c1c13]">${product.price}</p>
        
        <button 
          onClick={() => addToCart(product)}
          className="w-full mt-4 py-3 rounded-full border border-[#1c1c13]/10 font-bold text-sm hover:bg-[#1c1c13] hover:text-white transition-colors lg:hidden"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  );
};
