"use client";

import React from "react";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#fdf9e9] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-[#dedacb] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-[#b80035]" />
              <h2 className="font-display text-xl font-bold text-[#1c1c13]">Your Cart ({totalItems})</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#f2eede] rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-20 h-20 bg-[#f2eede] rounded-full flex items-center justify-center">
                  <ShoppingBag size={32} className="text-[#1c1c13]/20" />
                </div>
                <p className="font-body text-[#1c1c13]/60">Your cart is feeling a bit lonely.</p>
                <button
                  onClick={onClose}
                  className="bg-[#b80035] text-white px-8 py-3 rounded-full font-bold hover:bg-[#e11d48] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-24 h-24 bg-white rounded-xl overflow-hidden border border-[#dedacb] flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-display font-bold text-[#1c1c13] truncate">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#1c1c13]/20 hover:text-[#ba1a1a] transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-[#5c3f40] mb-3">${item.price}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#dedacb] rounded-full px-2 py-1 bg-white">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:text-[#b80035]"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:text-[#b80035]"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-bold text-[#1c1c13] ml-auto">
                        ${(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-[#dedacb] space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[#1c1c13]/60 font-body">Subtotal</span>
                <span className="font-display text-2xl font-extrabold text-[#1c1c13]">
                  ${totalPrice.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-[#5c3f40] text-center">Shipping and taxes calculated at checkout.</p>
              <button className="w-full bg-[#b80035] hover:bg-[#e11d48] text-white py-5 rounded-full font-bold shadow-lg shadow-[#b80035]/20 transition-all hover:-translate-y-1 active:scale-95">
                Checkout Now
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
