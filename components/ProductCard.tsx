"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
}

export const ProductCard = ({ product, variant = "default" }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  const wishlisted = inWishlist(product.id);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const compact = variant === "compact";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col bg-card"
    >
      <Link
        href={`/products/${product.id}`}
        className="block relative aspect-[4/5] overflow-hidden bg-secondary/30"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${
            outOfStock ? "opacity-60 grayscale" : ""
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          loading="lazy"
        />

        {/* Top-left badge stack */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {product.discountPercent ? (
            <span className="bg-foreground text-background font-audiowide text-[9px] tracking-[0.2em] uppercase px-2.5 py-1">
              -%{product.discountPercent}
            </span>
          ) : null}
          {product.isNew ? (
            <span className="bg-background text-foreground font-audiowide text-[8px] tracking-[0.25em] uppercase px-2.5 py-1 border border-foreground/10">
              Yeni
            </span>
          ) : null}
          {product.isBestSeller ? (
            <span className="bg-background text-foreground font-audiowide text-[8px] tracking-[0.25em] uppercase px-2.5 py-1 border border-foreground/10">
              Çok Satan
            </span>
          ) : null}
        </div>

        {/* Out of stock overlay */}
        {outOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50">
            <span className="bg-foreground text-background font-audiowide text-[10px] tracking-[0.3em] uppercase px-4 py-2">
              Tükendi
            </span>
          </div>
        ) : null}

        {/* Desktop quick add */}
        <AnimatePresence>
          {isHovered && !outOfStock ? (
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
          ) : null}
        </AnimatePresence>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? "Favorilerden çıkar" : "Favorilere ekle"}
          className={`absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center bg-background transition-colors ${
            wishlisted ? "text-foreground" : "text-foreground/30 hover:text-foreground"
          }`}
        >
          <Heart size={16} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </Link>

      <div className={`pt-6 flex flex-col items-center text-center ${compact ? "px-1" : "px-2"}`}>
        <span className="font-audiowide text-[8px] uppercase tracking-[0.4em] text-foreground/30 mb-2">
          {product.categoryLabel}
        </span>

        <Link href={`/products/${product.id}`} className="block mb-2 w-full">
          <h4 className="font-body text-sm text-foreground font-medium tracking-tight leading-relaxed line-clamp-1">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-baseline gap-2 mb-3">
          <p className="font-audiowide text-xs text-foreground tracking-wide">
            {formatPrice(product.price)}
          </p>
          {product.originalPrice ? (
            <p className="font-body text-[11px] text-foreground/30 line-through">
              {formatPrice(product.originalPrice)}
            </p>
          ) : null}
        </div>

        {/* Stock indicator */}
        <span
          className={`font-audiowide text-[7px] uppercase tracking-[0.3em] mb-4 ${
            outOfStock
              ? "text-foreground/40"
              : lowStock
              ? "text-foreground/70"
              : "text-foreground/30"
          }`}
        >
          {outOfStock
            ? "Stokta Yok"
            : lowStock
            ? `Son ${product.stock} adet`
            : "Stokta Var"}
        </span>

        {/* Mobile add to cart */}
        <button
          disabled={outOfStock}
          onClick={(e) => {
            e.preventDefault();
            addToCart(product);
          }}
          className="lg:hidden w-full py-4 bg-foreground text-background font-audiowide text-[9px] uppercase tracking-[0.3em] transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {outOfStock ? "Stokta Yok" : "Sepete Ekle"}
        </button>
      </div>
    </motion.div>
  );
};
