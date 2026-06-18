"use client";

import {
  products,
  getProductById,
  getRelatedProducts,
} from "@/lib/products";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { useRecentlyViewed } from "@/components/RecentlyViewedProvider";
import {
  Star,
  Truck,
  RefreshCw,
  Minus,
  Plus,
  ShoppingCart,
  ArrowLeft,
  Heart,
  Share2,
  Check,
  ChevronRight,
  Package,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProductRow } from "@/components/ProductRow";
import { RecentlyViewedRow } from "@/components/RecentlyViewedRow";
import { categoryMap } from "@/lib/categories";
import { useLiveProduct, useLiveCatalog } from "@/lib/useStock";
import { customToProduct } from "@/lib/customProducts";
import {
  estimatedDelivery,
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/utils";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  // Try the static catalog first; fall back to admin-added (custom) products
  // from the live catalog. A static lookup that returns undefined for an id
  // that's actually a custom product would otherwise 404 it.
  const staticProduct = getProductById(params.id);
  const liveCatalog = useLiveCatalog();
  // Retired built-ins are permanently redirected to the storage category — they
  // were replaced by the new set-style products.
  const isRetired = liveCatalog.retiredIds.includes(params.id);
  const customMatch = !staticProduct
    ? liveCatalog.customProducts.find((p) => p.id === params.id && p.isActive)
    : undefined;
  const product = staticProduct
    ?? (customMatch ? customToProduct(customMatch, liveCatalog.categories) : undefined);
  const isCustomLoadPending =
    !staticProduct && !customMatch && liveCatalog.customProducts.length === 0;
  // Color variants for set products. When present, the customer MUST pick one
  // before adding to cart; image gallery + stock follow the selection.
  const variants = liveCatalog.variants[params.id] ?? [];
  const hasVariants = variants.length > 0;
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const selectedVariant = hasVariants
    ? variants.find((v) => v.colorKey === selectedColorKey) ?? variants[0]
    : null;

  const { addToCart } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const { track } = useRecentlyViewed();
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"ozellikler" | "materyal" | "bakim">("ozellikler");
  const [mainImage, setMainImage] = useState(product?.imageUrl ?? "");
  const [justAdded, setJustAdded] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  // Live stock from the backend; falls back to the static seed value.
  const live = useLiveProduct(params.id);

  useEffect(() => {
    if (product) track(product.id);
  }, [product, track]);

  // When the selected color changes, swap the main image to that variant's
  // first photo so the gallery follows the swatch.
  useEffect(() => {
    if (selectedVariant?.imageUrls?.[0]) {
      setMainImage(selectedVariant.imageUrls[0]);
    }
  }, [selectedVariant?.colorKey, selectedVariant?.imageUrls]);

  // 301 redirect for retired built-in products → users land on the storage
  // category instead of a dead page (better for old bookmarks + SEO).
  useEffect(() => {
    if (isRetired) router.replace("/shop/saklama-kaplari");
  }, [isRetired, router]);
  if (isRetired) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yönlendiriliyor…
        </p>
      </main>
    );
  }

  if (!product) {
    if (isCustomLoadPending) {
      return (
        <main className="min-h-screen pt-40 text-center">
          <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
            Yükleniyor
          </p>
        </main>
      );
    }
    notFound();
  }

  const wishlisted = inWishlist(product.id);
  // For variant products, the chosen color drives stock + gallery; otherwise
  // fall back to the global stock + base images.
  const effectiveStock = hasVariants
    ? selectedVariant?.stock ?? 0
    : live.stock ?? product.stock;
  const effectiveName = live.name ?? product.name;
  const effectivePrice = live.priceCents != null ? live.priceCents / 100 : product.price;
  const effectiveShortDescription = live.shortDescription ?? product.shortDescription;
  const effectiveDescription = live.description ?? product.description;
  // Cart carries the admin-overridden name/price (the server re-prices anyway).
  const effectiveProduct = { ...product, name: effectiveName, price: effectivePrice };
  const outOfStock = effectiveStock <= 0;
  const lowStock = !outOfStock && effectiveStock <= 5;
  // Filter out retired built-ins from the related shelf so we don't surface
  // products the user just hid (those photos are gone too).
  const retiredSet = new Set(liveCatalog.retiredIds);
  const related = getRelatedProducts(product, 8).filter((p) => !retiredSet.has(p.id)).slice(0, 4);
  const cat = categoryMap[product.category];

  const variantImages = selectedVariant?.imageUrls ?? [];
  const productImages =
    variantImages.length > 0
      ? variantImages
      : product.images.length > 0
      ? product.images
      : [product.imageUrl];

  const handleAddToCart = () => {
    const color = selectedVariant
      ? {
          key: selectedVariant.colorKey,
          label: selectedVariant.colorLabel,
          hex: selectedVariant.colorHex,
        }
      : undefined;
    // Provide the chosen image as the cart thumbnail.
    const productForCart = {
      ...effectiveProduct,
      imageUrl: productImages[0] ?? effectiveProduct.imageUrl,
      stock: effectiveStock,
    };
    addToCart(productForCart, quantity, color);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/sepet");
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: effectiveName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 1800);
      }
    } catch {}
  };

  return (
    <main className="min-h-screen pt-28 md:pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-10 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-audiowide text-foreground/40"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Anasayfa
          </Link>
          <ChevronRight size={12} />
          <Link href="/shop" className="hover:text-foreground transition-colors">
            Alışveriş
          </Link>
          <ChevronRight size={12} />
          {cat ? (
            <>
              <Link
                href={`/shop/${cat.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {cat.label}
              </Link>
              <ChevronRight size={12} />
            </>
          ) : null}
          <span className="text-foreground/70 truncate max-w-[180px] md:max-w-none">{effectiveName}</span>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="relative aspect-square overflow-hidden bg-secondary/30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mainImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={mainImage || product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </motion.div>
              </AnimatePresence>
              {/* Badge stack */}
              <div className="absolute top-5 left-5 flex flex-col gap-2 items-start z-10">
                {product.discountPercent ? (
                  <span className="bg-foreground text-background font-audiowide text-[10px] tracking-[0.2em] uppercase px-3 py-1.5">
                    -%{product.discountPercent}
                  </span>
                ) : null}
                {product.isNew ? (
                  <span className="bg-background text-foreground font-audiowide text-[9px] tracking-[0.25em] uppercase px-3 py-1.5 border border-foreground/10">
                    Yeni
                  </span>
                ) : null}
                {product.isBestSeller ? (
                  <span className="bg-background text-foreground font-audiowide text-[9px] tracking-[0.25em] uppercase px-3 py-1.5 border border-foreground/10">
                    Çok Satan
                  </span>
                ) : null}
              </div>
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-5">
                {productImages.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setMainImage(img)}
                    className={`aspect-square overflow-hidden cursor-pointer border transition-all ${
                      mainImage === img
                        ? "border-foreground"
                        : "border-foreground/10 opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Görsel ${i + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} görsel ${i + 1}`}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
                {product.categoryLabel}
                {product.subcategoryLabel ? ` · ${product.subcategoryLabel}` : ""}
              </span>
              <div className="flex gap-2 -mt-1">
                <button
                  onClick={handleShare}
                  className="p-2 text-foreground/40 hover:text-foreground transition-colors"
                  aria-label="Paylaş"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-2 transition-colors ${
                    wishlisted ? "text-foreground" : "text-foreground/40 hover:text-foreground"
                  }`}
                  aria-label={wishlisted ? "Favorilerden çıkar" : "Favorilere ekle"}
                >
                  <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <h1 className="font-audiowide text-3xl md:text-5xl text-foreground mb-4 uppercase tracking-tight leading-tight">
              {effectiveName}
            </h1>

            <div className="flex items-center gap-3 mb-6 text-xs">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < Math.round(product.rating)
                        ? "fill-foreground text-foreground"
                        : "text-foreground/20"
                    }
                  />
                ))}
              </div>
              <span className="text-foreground/40 font-body">
                {product.rating.toFixed(1)} · {product.reviewCount} değerlendirme
              </span>
            </div>

            <p className="text-foreground/60 text-base leading-relaxed mb-8">
              {effectiveShortDescription}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-3">
              <p className="font-audiowide text-3xl md:text-4xl text-foreground tracking-tight">
                {formatPrice(effectivePrice)}
              </p>
              {product.originalPrice ? (
                <>
                  <p className="text-foreground/30 line-through text-lg">
                    {formatPrice(product.originalPrice)}
                  </p>
                  {product.discountPercent ? (
                    <span className="bg-foreground text-background font-audiowide text-[9px] tracking-[0.2em] uppercase px-2 py-1">
                      %{product.discountPercent} indirim
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
            <p className="text-foreground/40 text-xs font-body mb-8">
              KDV dahil · {product.sku}
            </p>

            {/* Color picker — only for variant products */}
            {hasVariants ? (
              <div className="mb-8 pb-8 border-b border-foreground/5">
                <p className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50 mb-3">
                  Renk: <span className="text-foreground/80">{selectedVariant?.colorLabel}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.colorKey === v.colorKey;
                    const isOut = v.stock <= 0;
                    return (
                      <button
                        key={v.colorKey}
                        type="button"
                        onClick={() => setSelectedColorKey(v.colorKey)}
                        title={`${v.colorLabel}${isOut ? " · Tükendi" : ""}`}
                        aria-label={v.colorLabel}
                        aria-pressed={isSelected}
                        className={`relative w-10 h-10 rounded-full transition-all ${
                          isSelected
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "ring-1 ring-foreground/15 hover:ring-foreground/40"
                        } ${isOut ? "opacity-40" : ""}`}
                      >
                        <span
                          className="block w-full h-full rounded-full border border-black/10"
                          style={{ backgroundColor: v.colorHex }}
                        />
                        {isOut ? (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="block w-8 h-px bg-foreground/60 rotate-45" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Stock */}
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-foreground/5">
              <span
                className={`w-2 h-2 rounded-full ${
                  outOfStock
                    ? "bg-foreground/30"
                    : lowStock
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              />
              <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/70">
                {outOfStock
                  ? "Stokta Yok"
                  : lowStock
                  ? `Son ${effectiveStock} adet · Hızla tükenebilir`
                  : `Stokta · ${effectiveStock} adet hazır`}
              </span>
            </div>

            {/* Shipping note */}
            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-3 text-sm text-foreground/60">
                <Truck size={16} className="text-foreground/40" />
                <span>
                  {effectivePrice >= FREE_SHIPPING_THRESHOLD ? (
                    <>
                      <strong className="text-foreground">Ücretsiz kargo</strong> · Bu üründe geçerli
                    </>
                  ) : (
                    <>
                      {formatPrice(FREE_SHIPPING_THRESHOLD - effectivePrice)} daha eklerseniz kargo
                      ücretsiz olur
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/60">
                <Package size={16} className="text-foreground/40" />
                <span>
                  Tahmini teslimat:{" "}
                  <strong className="text-foreground">{estimatedDelivery()}</strong>
                </span>
              </div>
            </div>

            {/* Quantity + CTAs */}
            <div className="flex flex-col gap-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-foreground/15">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-foreground/5 transition-colors"
                    disabled={outOfStock}
                    aria-label="Azalt"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-audiowide text-sm">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(effectiveStock || 1, quantity + 1))
                    }
                    className="p-3 hover:bg-foreground/5 transition-colors"
                    disabled={outOfStock || quantity >= effectiveStock}
                    aria-label="Arttır"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-[10px] font-audiowide uppercase tracking-[0.3em] text-foreground/40">
                  Ara toplam: {formatPrice(effectivePrice * quantity)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="w-full py-5 bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {justAdded ? (
                  <>
                    <Check size={16} /> Sepete Eklendi
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} /> Sepete Ekle
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="w-full py-5 bg-transparent border border-foreground/20 text-foreground font-audiowide text-[11px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Hemen Satın Al
              </button>
            </div>

            {/* Info tabs */}
            <div className="flex gap-8 border-b border-foreground/10 mb-6">
              {(
                [
                  ["ozellikler", "Özellikler"],
                  ["materyal", "Materyal"],
                  ["bakim", "Bakım"],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-audiowide text-[10px] uppercase tracking-[0.3em] transition-colors relative ${
                    activeTab === tab ? "text-foreground" : "text-foreground/40 hover:text-foreground"
                  }`}
                >
                  {label}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tabLine"
                      className="absolute -bottom-px left-0 right-0 h-px bg-foreground"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="mb-10 min-h-[120px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-foreground/60 leading-relaxed text-sm"
                >
                  {activeTab === "ozellikler" ? (
                    <ul className="space-y-2">
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-2 w-1 h-1 rounded-full bg-foreground/60 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {activeTab === "materyal" ? (
                    <div className="space-y-3">
                      <p>{product.materials}</p>
                      {product.dimensions ? (
                        <p className="text-foreground/40">
                          <strong className="text-foreground/70">Boyutlar:</strong>{" "}
                          {product.dimensions}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {activeTab === "bakim" ? <p>{product.care}</p> : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-foreground/5">
              <div className="flex flex-col items-center gap-2 text-center">
                <Truck size={18} className="text-foreground/60" />
                <span className="text-[9px] font-audiowide uppercase tracking-[0.2em] text-foreground/60 leading-tight">
                  750 TL üzeri ücretsiz kargo
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <RefreshCw size={18} className="text-foreground/60" />
                <span className="text-[9px] font-audiowide uppercase tracking-[0.2em] text-foreground/60 leading-tight">
                  14 Gün İade
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detail prose */}
        <section className="mt-32 max-w-3xl">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30">
            Ürün Hakkında
          </span>
          <h2 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight mt-4 mb-6 text-foreground">
            Detaylı Bilgi
          </h2>
          <p className="text-foreground/60 text-base md:text-lg leading-relaxed whitespace-pre-line">
            {effectiveDescription}
          </p>
        </section>
      </div>

      {/* Related */}
      <ProductRow
        eyebrow="Benzer Ürünler"
        title="Bunlar da İlginizi Çekebilir"
        products={related}
        href={cat ? `/shop/${cat.slug}` : "/shop"}
        hrefLabel="Kategoriyi Görüntüle"
      />

      {/* Recently viewed */}
      <RecentlyViewedRow excludeId={product.id} />

      {/* Share toast */}
      <AnimatePresence>
        {showShareToast ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 font-audiowide text-[10px] uppercase tracking-[0.3em] z-50 flex items-center gap-2"
          >
            <Sparkles size={12} /> Bağlantı kopyalandı
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
