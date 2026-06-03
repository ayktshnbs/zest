"use client";

import React from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Lock, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
} from "@/lib/utils";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const shippingCost =
    totalPrice >= FREE_SHIPPING_THRESHOLD || totalPrice === 0
      ? 0
      : STANDARD_SHIPPING_COST;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-[101] shadow-2xl flex flex-col overflow-hidden border-l border-foreground/5"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-foreground/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShoppingBag size={20} className="text-foreground" strokeWidth={1.5} />
                  <div>
                    <h2 className="font-audiowide text-sm uppercase tracking-[0.3em] text-foreground">
                      Sepetim
                    </h2>
                    <p className="text-[10px] text-foreground/40 font-body mt-0.5">
                      {totalItems} ürün
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-foreground/50 hover:text-foreground transition-colors"
                  aria-label="Kapat"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Free shipping progress */}
              {totalPrice > 0 ? (
                <div className="px-6 md:px-8 py-4 border-b border-foreground/5">
                  <div className="flex items-center justify-between mb-2 gap-2 text-[10px] font-audiowide uppercase tracking-[0.25em]">
                    <span className="text-foreground/60 flex items-center gap-2">
                      <Truck size={11} />
                      {remaining > 0
                        ? `${formatPrice(remaining)} kaldı`
                        : "Ücretsiz kargo kazandınız"}
                    </span>
                  </div>
                  <div className="w-full h-px bg-foreground/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
                      }}
                      className="h-full bg-foreground"
                    />
                  </div>
                </div>
              ) : null}

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-16 h-16 border border-foreground/10 flex items-center justify-center">
                      <ShoppingBag size={22} className="text-foreground/40" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2">
                      <p className="font-audiowide text-lg uppercase tracking-tight text-foreground">
                        Sepetiniz Boş
                      </p>
                      <p className="text-foreground/50 text-sm">
                        En sevdiğiniz ürünleri buraya ekleyin.
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      onClick={onClose}
                      className="mt-2 px-8 py-3 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90"
                    >
                      Alışverişe Başla
                    </Link>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: 30 }}
                        className="flex gap-4 group"
                      >
                        <Link
                          href={`/products/${item.id}`}
                          onClick={onClose}
                          className="relative w-20 h-20 bg-secondary/30 overflow-hidden flex-shrink-0"
                        >
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[9px] font-audiowide uppercase tracking-[0.3em] text-foreground/40">
                                {item.categoryLabel}
                              </span>
                              <Link
                                href={`/products/${item.id}`}
                                onClick={onClose}
                                className="block"
                              >
                                <h3 className="font-body text-sm text-foreground truncate hover:text-foreground/70">
                                  {item.name}
                                </h3>
                              </Link>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-foreground/40 hover:text-foreground transition-colors"
                              aria-label="Ürünü kaldır"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-foreground/15">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 hover:bg-foreground/5 transition-colors"
                                aria-label="Azalt"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-8 text-center text-xs font-audiowide">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="p-1.5 hover:bg-foreground/5 transition-colors disabled:opacity-40"
                                aria-label="Arttır"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            <span className="font-audiowide text-sm text-foreground tracking-tight">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 ? (
                <div className="p-6 md:p-8 border-t border-foreground/10 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-body">
                      <span className="text-foreground/60">Ara toplam</span>
                      <span className="text-foreground">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-body">
                      <span className="text-foreground/60">Kargo</span>
                      <span className="text-foreground font-audiowide text-[10px] uppercase tracking-wider">
                        {shippingCost === 0 ? "Ücretsiz" : formatPrice(shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-3 border-t border-foreground/10">
                      <span className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground">
                        Toplam
                      </span>
                      <span className="font-audiowide text-xl text-foreground tracking-tight">
                        {formatPrice(totalPrice + shippingCost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      href="/odeme"
                      onClick={onClose}
                      className="w-full text-center py-4 bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      Ödemeye Geç <ArrowRight size={14} />
                    </Link>
                    <Link
                      href="/sepet"
                      onClick={onClose}
                      className="w-full text-center py-3 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors"
                    >
                      Sepeti Görüntüle
                    </Link>
                    <p className="text-center text-[9px] text-foreground/40 font-audiowide uppercase tracking-[0.3em] flex items-center justify-center gap-1.5">
                      <Lock size={10} /> 256-bit SSL Güvenli Ödeme
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
