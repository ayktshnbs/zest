"use client";

import { useCart } from "@/components/CartProvider";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  Tag,
  RefreshCw,
} from "lucide-react";
import {
  estimatedDelivery,
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
} from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart, isHydrated } =
    useCart();
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const shippingCost = totalPrice >= FREE_SHIPPING_THRESHOLD || totalPrice === 0
    ? 0
    : STANDARD_SHIPPING_COST;
  const total = totalPrice + shippingCost;

  const remainingForFreeShipping = useMemo(
    () => Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice),
    [totalPrice],
  );

  const handleCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    setCouponMessage("Bu kupon kodu geçerli değil veya süresi dolmuş.");
  };

  if (!isHydrated) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yükleniyor
        </p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
        <div className="max-w-2xl mx-auto px-5 md:px-16 text-center space-y-8">
          <div className="w-20 h-20 mx-auto border border-foreground/10 flex items-center justify-center">
            <ShoppingBag size={28} className="text-foreground/40" strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            <h1 className="font-audiowide text-3xl md:text-4xl uppercase tracking-tight">
              Sepetiniz Boş
            </h1>
            <p className="text-foreground/50">
              Henüz sepete ürün eklemediniz. Koleksiyonumuzu keşfederek başlayın.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-block px-10 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
          >
            Alışverişe Başla
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 md:pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        <div className="mb-12 flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
              Sepetim
            </span>
            <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight">
              {cart.length} ürün sepetinizde
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors border-b border-foreground/10 hover:border-foreground pb-1"
          >
            Sepeti Boşalt
          </button>
        </div>

        {/* Free shipping progress */}
        <div className="mb-12 p-6 border border-foreground/10">
          <div className="flex items-center justify-between mb-3 gap-2 text-xs font-audiowide uppercase tracking-[0.2em]">
            <span className="text-foreground/60 flex items-center gap-2">
              <Truck size={14} />
              {remainingForFreeShipping > 0
                ? `Ücretsiz kargo için ${formatPrice(remainingForFreeShipping)} kaldı`
                : "Tebrikler! Ücretsiz kargo kazandınız"}
            </span>
            <span className="text-foreground/40">
              {formatPrice(totalPrice)} / {formatPrice(FREE_SHIPPING_THRESHOLD)}
            </span>
          </div>
          <div className="w-full h-1 bg-foreground/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
              }}
              transition={{ duration: 0.6 }}
              className="h-full bg-foreground"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Items */}
          <section className="lg:col-span-8 min-w-0 space-y-8">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="flex flex-col sm:flex-row gap-6 pb-8 border-b border-foreground/10"
                >
                  <Link
                    href={`/products/${item.id}`}
                    className="relative w-full sm:w-32 aspect-square sm:aspect-square bg-secondary/30 flex-shrink-0 overflow-hidden"
                  >
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40">
                          {item.categoryLabel}
                        </span>
                        <Link href={`/products/${item.id}`} className="block">
                          <h3 className="font-body text-base md:text-lg text-foreground hover:text-foreground/70 transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-foreground/40 font-body">
                          {item.sku} ·{" "}
                          {item.stock > 0
                            ? `${item.stock} adet stokta`
                            : "Stokta yok"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-foreground/40 hover:text-foreground transition-colors p-1"
                        aria-label="Ürünü kaldır"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div className="flex items-center border border-foreground/15">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2.5 hover:bg-foreground/5 transition-colors"
                          aria-label="Azalt"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 text-center font-audiowide text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2.5 hover:bg-foreground/5 transition-colors"
                          disabled={item.quantity >= item.stock}
                          aria-label="Arttır"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-audiowide text-base text-foreground tracking-tight">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.originalPrice ? (
                          <p className="text-[11px] text-foreground/30 line-through font-body">
                            {formatPrice(item.originalPrice * item.quantity)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </section>

          {/* Summary */}
          <aside className="lg:col-span-4 min-w-0">
            <div className="lg:sticky lg:top-32 space-y-6 border border-foreground/10 p-6 md:p-8">
              <h2 className="font-audiowide text-sm uppercase tracking-[0.3em]">
                Sipariş Özeti
              </h2>

              <div className="space-y-3 text-sm font-body">
                <Line label="Ara toplam" value={formatPrice(totalPrice)} />
                <Line
                  label="Kargo"
                  value={
                    shippingCost === 0 ? (
                      <span className="text-foreground font-audiowide text-[10px] uppercase tracking-wider">
                        Ücretsiz
                      </span>
                    ) : (
                      formatPrice(shippingCost)
                    )
                  }
                />
                <Line label="Tahmini teslimat" value={estimatedDelivery()} muted />
              </div>

              <form onSubmit={handleCoupon} className="space-y-2">
                <label className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50 flex items-center gap-2">
                  <Tag size={11} /> İndirim kuponu
                </label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Kupon kodu"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 border border-foreground/15 bg-transparent px-3 py-3 text-sm font-body placeholder:text-foreground/30 focus:outline-none focus:border-foreground"
                  />
                  <button
                    type="submit"
                    className="px-4 border border-l-0 border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
                  >
                    Uygula
                  </button>
                </div>
                {couponMessage ? (
                  <p className="text-[11px] text-foreground/50 font-body">{couponMessage}</p>
                ) : null}
              </form>

              <div className="pt-6 border-t border-foreground/10 flex items-end justify-between">
                <span className="font-audiowide text-xs uppercase tracking-[0.3em]">
                  Toplam
                </span>
                <span className="font-audiowide text-2xl text-foreground tracking-tight">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/odeme"
                className="w-full block text-center py-5 bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
              >
                Ödemeye Geç <ArrowRight size={14} className="inline ml-2" />
              </Link>
              <Link
                href="/shop"
                className="w-full block text-center py-4 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors"
              >
                Alışverişe Devam Et
              </Link>

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-foreground/10 text-center">
                <Trust icon={<ShieldCheck size={16} />} label="256-bit SSL" />
                <Trust icon={<Truck size={16} />} label="Hızlı Kargo" />
                <Trust icon={<RefreshCw size={16} />} label="14 Gün İade" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Line({
  label,
  value,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className={muted ? "text-foreground/50" : "text-foreground/60"}>{label}</span>
      <span className={`text-right ${muted ? "text-foreground/50" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-foreground/50">
      {icon}
      <span className="text-[9px] font-audiowide uppercase tracking-[0.2em] leading-tight">
        {label}
      </span>
    </div>
  );
}
