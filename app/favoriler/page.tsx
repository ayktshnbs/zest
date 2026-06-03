"use client";

import { useWishlist } from "@/components/WishlistProvider";
import { useCart } from "@/components/CartProvider";
import { products } from "@/lib/products";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WishlistPage() {
  const { ids, remove, clear, isHydrated } = useWishlist();
  const { addToCart } = useCart();

  if (!isHydrated) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yükleniyor
        </p>
      </main>
    );
  }

  const items = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  return (
    <main className="min-h-screen pt-28 md:pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        <div className="mb-12 flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
              Favoriler
            </span>
            <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight">
              Favori Listem
            </h1>
            <p className="text-foreground/50 text-sm font-body">
              {items.length} ürün kaydedildi
            </p>
          </div>
          {items.length > 0 ? (
            <button
              onClick={clear}
              className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors border-b border-foreground/10 hover:border-foreground pb-1"
            >
              Listeyi Temizle
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="py-32 text-center space-y-6">
            <div className="w-16 h-16 mx-auto border border-foreground/10 flex items-center justify-center">
              <Heart size={20} className="text-foreground/40" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="font-audiowide text-xl md:text-2xl uppercase tracking-tight">
                Henüz favoriniz yok
              </h2>
              <p className="text-foreground/50 max-w-md mx-auto">
                Beğendiğiniz ürünleri favorilerinize ekleyerek burada toplayabilir, daha sonra
                rahatça erişebilirsiniz.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-block px-10 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90"
            >
              Koleksiyonu Keşfet
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-foreground/10">
            <AnimatePresence>
              {items.map((p) => (
                <motion.article
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="py-8 flex flex-col sm:flex-row gap-6"
                >
                  <Link
                    href={`/products/${p.id}`}
                    className="relative w-full sm:w-40 aspect-square sm:aspect-square bg-secondary/30 flex-shrink-0 overflow-hidden"
                  >
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40">
                        {p.categoryLabel}
                      </span>
                      <Link href={`/products/${p.id}`} className="block mt-1">
                        <h3 className="font-body text-lg text-foreground hover:text-foreground/70 transition-colors">
                          {p.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-foreground/50 mt-2 line-clamp-2 max-w-md">
                        {p.shortDescription}
                      </p>
                      <div className="flex items-baseline gap-3 mt-3">
                        <span className="font-audiowide text-base text-foreground tracking-tight">
                          {formatPrice(p.price)}
                        </span>
                        {p.originalPrice ? (
                          <span className="text-[12px] text-foreground/30 line-through">
                            {formatPrice(p.originalPrice)}
                          </span>
                        ) : null}
                        <span
                          className={`text-[10px] font-audiowide uppercase tracking-[0.3em] ${
                            p.stock <= 0
                              ? "text-foreground/40"
                              : p.stock <= 5
                              ? "text-foreground/70"
                              : "text-foreground/40"
                          }`}
                        >
                          {p.stock <= 0
                            ? "Stokta Yok"
                            : p.stock <= 5
                            ? `Son ${p.stock} adet`
                            : "Stokta Var"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          addToCart(p);
                          remove(p.id);
                        }}
                        disabled={p.stock <= 0}
                        className="flex-1 sm:flex-none px-6 py-3 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={12} />
                        Sepete Taşı
                      </button>
                      <Link
                        href={`/products/${p.id}`}
                        className="flex-1 sm:flex-none px-6 py-3 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors flex items-center justify-center gap-2"
                      >
                        İncele <ArrowRight size={12} />
                      </Link>
                      <button
                        onClick={() => remove(p.id)}
                        className="sm:ml-auto p-3 text-foreground/40 hover:text-foreground transition-colors"
                        aria-label="Favorilerden çıkar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
