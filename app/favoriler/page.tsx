"use client";

import { useWishlist } from "@/components/WishlistProvider";
import { useCart } from "@/components/CartProvider";
import { products as staticProducts } from "@/lib/products";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveCatalog, resolveEffective } from "@/lib/useStock";
import { mergeProducts } from "@/lib/customProducts";
import { useMemo } from "react";

export default function WishlistPage() {
  const { ids, remove, clear, isHydrated } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  // Favourites are stored as bare product ids and can point at admin-added
  // products, which don't exist in the static catalog — resolving against
  // `products` alone silently dropped them from the list (and from the count).
  const liveCatalog = useLiveCatalog();
  const catalog = useMemo(
    () => mergeProducts(staticProducts, liveCatalog.customProducts, liveCatalog.categories),
    [liveCatalog.customProducts, liveCatalog.categories],
  );

  const items = useMemo(
    () =>
      ids
        .map((id) => catalog.find((p) => p.id === id))
        .filter((p): p is (typeof catalog)[number] => Boolean(p))
        // Overlay live stock/price/name so the card matches the rest of the
        // storefront and "Sepete Taşı" gets a product the cart will accept.
        .map((p) => ({ product: p, live: resolveEffective(liveCatalog, p) })),
    [ids, catalog, liveCatalog],
  );

  if (!isHydrated) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yükleniyor
        </p>
      </main>
    );
  }

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
              {items.map(({ product: p, live }) => (
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
                          {live.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-foreground/50 mt-2 line-clamp-2 max-w-md">
                        {p.shortDescription}
                      </p>
                      <div className="flex items-baseline gap-3 mt-3">
                        <span className="font-audiowide text-base text-foreground tracking-tight">
                          {formatPrice(live.price)}
                        </span>
                        {p.originalPrice ? (
                          <span className="text-[12px] text-foreground/30 line-through">
                            {formatPrice(p.originalPrice)}
                          </span>
                        ) : null}
                        <span
                          className={`text-[10px] font-audiowide uppercase tracking-[0.3em] ${
                            live.stock <= 0
                              ? "text-foreground/40"
                              : live.stock <= 5
                              ? "text-foreground/70"
                              : "text-foreground/40"
                          }`}
                        >
                          {live.stock <= 0
                            ? "Stokta Yok"
                            : live.stock <= 5
                            ? `Son ${live.stock} adet`
                            : "Stokta Var"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          // Colour-variant products can't be added without a
                          // colorKey (the order API rejects the line), so send
                          // the shopper to the product page to choose one.
                          if (live.hasVariants) {
                            router.push(`/products/${p.id}`);
                            return;
                          }
                          addToCart({
                            ...p,
                            name: live.name,
                            price: live.price,
                            stock: live.stock,
                          });
                          remove(p.id);
                        }}
                        disabled={live.stock <= 0}
                        className="flex-1 sm:flex-none px-6 py-3 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={12} />
                        {live.hasVariants ? "Renk Seç" : "Sepete Taşı"}
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
