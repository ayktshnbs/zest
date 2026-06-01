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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface z-[101] shadow-2xl flex flex-col overflow-hidden border-l border-white/5"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ShoppingBag size={24} className="text-primary" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-glow">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl font-black tracking-tighter text-text-primary">Sepetiniz</h2>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-all duration-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Free Shipping Progress */}
              {totalPrice > 0 && (
                <div className="px-8 py-5 bg-accent/5 border-b border-accent/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                      {totalPrice >= 500 ? "Ücretsiz Kargo Kazandınız!" : `Ücretsiz kargo için ${500 - totalPrice} TL daha ekleyin`}
                    </span>
                    <Truck size={14} className="text-accent" />
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalPrice / 500) * 100, 100)}%` }}
                      className="h-full bg-accent shadow-glow"
                    />
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center shadow-inner border border-white/5">
                      <ShoppingBag size={40} className="text-text-secondary/30" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-black tracking-tighter text-text-primary">Sepetiniz Boş</p>
                      <p className="text-text-secondary font-medium italic mt-2">En sevdiğiniz ürünleri buraya ekleyin.</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="btn-primary mt-4"
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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: 50 }}
                        className="flex gap-6 group p-4 rounded-3xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                      >
                        <div className="relative w-24 h-24 bg-[#1a1d23] rounded-2xl overflow-hidden border border-white/5 flex-shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">{item.category}</span>
                              <h3 className="font-display font-bold text-text-primary truncate">{item.name}</h3>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-text-secondary hover:text-red-400 transition-colors rounded-full hover:bg-red-400/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1 gap-4">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 hover:text-white transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-4 text-center font-black text-sm text-text-primary">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 hover:text-white transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-display font-bold text-lg text-text-primary">
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
                <div className="p-8 bg-surface border-t border-white/5 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-text-secondary">Ara Toplam</span>
                      <span className="font-bold text-text-primary">{totalPrice} TL</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-text-secondary">Kargo</span>
                      <span className="text-accent font-bold uppercase tracking-widest text-xs">
                        {totalPrice >= 500 ? "Ücretsiz" : "29.90 TL"}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-6 border-t border-white/5">
                      <span className="font-display font-black text-lg tracking-tighter text-text-primary">Toplam</span>
                      <span className="font-display text-3xl font-black text-text-primary tracking-tighter">
                        {totalPrice >= 500 ? totalPrice : (totalPrice + 29.9).toFixed(2)} <span className="text-lg text-text-secondary">TL</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-5 pt-4">
                    <button className="w-full btn-primary py-5 text-sm tracking-[0.3em] uppercase">
                      Güvenli Ödeme
                      <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[9px] font-black text-text-secondary uppercase tracking-[0.3em]">
                      <Zap size={10} className="text-accent" />
                      256-Bit SSL Şifreleme
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


