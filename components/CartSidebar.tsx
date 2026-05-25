"use client";

import React from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Zap, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-[101] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-8 border-b border-border flex items-center justify-between bg-white dark:bg-neutral-950">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ShoppingBag size={24} className="text-primary" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl font-black tracking-tighter">Sepetiniz</h2>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-3 bg-accent rounded-full hover:bg-primary hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Free Shipping Progress */}
              {totalPrice > 0 && (
                <div className="px-8 py-4 bg-primary/5 border-b border-primary/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                      {totalPrice >= 500 ? "Ücretsiz Kargo Kazandınız!" : `Ücretsiz kargo için ${500 - totalPrice} TL daha ekleyin`}
                    </span>
                    <Truck size={14} className="text-primary/60" />
                  </div>
                  <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalPrice / 500) * 100, 100)}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center animate-bounce">
                      <ShoppingBag size={40} className="text-foreground/10" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-black tracking-tighter">Sepetiniz Boş</p>
                      <p className="text-foreground/40 font-medium italic mt-2">En sevdiğiniz ürünleri buraya ekleyin.</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="btn-primary"
                    >
                      Alışverişe Başla
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex gap-6 group"
                      >
                        <div className="relative w-28 h-28 bg-white dark:bg-neutral-800 rounded-[2rem] overflow-hidden border border-border flex-shrink-0 group-hover:shadow-lg transition-all duration-500">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60">{item.category}</span>
                              <h3 className="font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</h3>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-foreground/20 hover:text-destructive transition-colors hover:bg-destructive/10 rounded-full"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-accent rounded-2xl px-2 py-1 gap-4">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-4 text-center font-black text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="font-display font-black text-lg text-primary">
                              {item.price * item.quantity} TL
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="p-8 bg-white dark:bg-neutral-950 border-t border-border space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-foreground/40">Ara Toplam</span>
                      <span className="font-bold">{totalPrice} TL</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-foreground/40">Kargo</span>
                      <span className="text-secondary font-black uppercase tracking-tighter">
                        {totalPrice >= 500 ? "Ücretsiz" : "29.90 TL"}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-border">
                      <span className="font-display font-black text-lg tracking-tighter">Toplam</span>
                      <span className="font-display text-3xl font-black text-primary tracking-tighter">
                        {totalPrice >= 500 ? totalPrice : (totalPrice + 29.9).toFixed(2)} TL
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <button className="w-full btn-primary py-6 text-lg tracking-[0.2em] group uppercase">
                      Şimdi Öde
                      <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">
                      <Zap size={12} fill="currentColor" />
                      Güvenli Ödeme & Hızlı Teslimat
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


