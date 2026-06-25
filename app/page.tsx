"use client";

import {
  featuredProducts,
  newArrivals,
  discountedProducts,
  products,
  getProductById,
} from "@/lib/products";
import { categoryMap } from "@/lib/categories";
import { useLiveCatalog } from "@/lib/useStock";
import { customToProduct } from "@/lib/customProducts";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductRow } from "@/components/ProductRow";
import { RecentlyViewedRow } from "@/components/RecentlyViewedRow";
import { ChevronRight, ArrowRight, Truck, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const rawTextY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const textY = useSpring(rawTextY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  // Ambient hero video, gently slowed for a premium slow-motion feel.
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // iOS/Android only autoplay when `muted` is set as a PROPERTY (React's
    // `muted` attribute alone isn't reliable) — otherwise they block playback
    // and show a tap-to-play button. Set it on the element and kick off play().
    v.muted = true;
    v.defaultMuted = true;

    // The slow-mo is a nice-to-have layered ON TOP of a playing video. Setting
    // playbackRate *before* play() can stall or block autoplay on iOS Safari,
    // so only apply it once playback has actually started.
    const applySlowMo = () => {
      try {
        v.playbackRate = 0.6; // tune 0.5–1.0; lower = slower
      } catch {
        /* ignore — rate is cosmetic, never let it break playback */
      }
    };
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.then === "function") p.then(applySlowMo).catch(() => {});
      else applySlowMo();
    };

    // Defer kicking off the 2 MB video until the browser is idle so it doesn't
    // compete with the LCP image/text for bandwidth on first paint. The poster
    // (`/hero.jpg`) fills the frame in the meantime, so the hero never breaks.
    const idle = (cb: () => void) => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (typeof ric === "function") ric(cb);
      else setTimeout(cb, 400);
    };
    idle(() => {
      // preload="none" means the source isn't fetched until we ask. Calling
      // load() then play() triggers download and starts playback in one go.
      try { v.load(); } catch {}
      tryPlay();
    });
    v.addEventListener("loadedmetadata", tryPlay);
    v.addEventListener("canplay", tryPlay);

    // Fallback for when autoplay is blocked outright (iOS Low Power Mode,
    // Android Data Saver, reduced-motion): start on the first user interaction
    // so the hero comes alive on tap/scroll instead of being stuck on /hero.jpg.
    const kick = () => {
      if (v.paused) tryPlay();
    };
    const gestureOpts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("touchstart", kick, gestureOpts);
    window.addEventListener("pointerdown", kick, gestureOpts);
    window.addEventListener("scroll", kick, gestureOpts);

    return () => {
      v.removeEventListener("loadedmetadata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("scroll", kick);
    };
  }, []);

  // Real catalog products featured under the hero ("shop the look").
  const heroProducts = ["dor-m1", "rnd-rev", "alt-kmn"]
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));

  // Hide retired built-ins (their photos were deleted in the Saklama Kapları
  // cleanup) from every homepage shelf — they were leaving broken thumbnails.
  const liveCatalog = useLiveCatalog();
  const retiredSet = new Set(liveCatalog.retiredIds);
  const live = (list: Product[]) => list.filter((p) => !retiredSet.has(p.id));

  const featured = live(featuredProducts).slice(0, 4);
  const homeFallback = featured.length > 0 ? featured : live(products).slice(0, 4);

  // Set ürünleri vitrini — Bonny ailesi + 4'lü Dikdörtgen. Read live so admin
  // edits flow through. Order is hand-picked: 3'lü first (cheapest entry),
  // then dikdörtgen, then bigger Bonny sets.
  const SET_PRODUCT_IDS = ["c-bonny-3lu", "c-dikdortgen-4lu", "c-bonny-6li", "c-bonny-12li"];
  const setsRow = SET_PRODUCT_IDS
    .map((id) => liveCatalog.customProducts.find((p) => p.id === id && p.isActive))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((cp) => customToProduct(cp, liveCatalog.categories));
  const newArrivalsRow =
    live(newArrivals).length > 0 ? live(newArrivals) : live(products).slice(0, 4);
  const discountedRow =
    live(discountedProducts).length > 0
      ? live(discountedProducts)
      : live(products).slice(0, 4);
  const kitchenGroups = categoryMap["mutfak"]?.subcategories ?? [];

  return (
    <main className="min-h-screen bg-background relative">
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-neutral-900"
      >
        {/* Ambient background video — full opacity for a vivid, cinematic look.
            Falls back to the poster image until it loads / if autoplay is
            blocked, so the hero never breaks. */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            className="w-full h-full object-cover object-center brightness-[1.18] contrast-[1.05] saturate-[1.08]"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero.jpg"
            preload="none"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          {/* Scrim: light at top so the video reads through, noticeably darker
              toward the bottom so SAHNEDEKİ ÜRÜNLER + pills + buttons stay
              legible on bright frames. */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/50" />
          {/* Dedicated top scrim behind the floating navbar so menu text stays
              legible on bright video frames, without changing the navbar's
              transparent look. Only affects the top ~140px of the hero. */}
          <div className="absolute inset-x-0 top-0 h-32 md:h-36 bg-gradient-to-b from-black/35 via-black/15 to-transparent pointer-events-none" />
        </div>

        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="max-w-7xl mx-auto px-5 md:px-16 relative z-10 w-full text-center mt-[6vh] md:mt-[10vh]"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{
              y: [30, 0],
              opacity: 1,
            }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <h1 className="font-audiowide text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6 md:mb-10 tracking-[-0.01em] text-white [text-wrap:balance] [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
                Seçkin Ev Gereçleri
                <br />
                <span className="text-white/70">Zahmetsiz Yaşam</span>
              </h1>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-10 py-4 bg-white text-[#1d1d1f] font-audiowide text-[10px] sm:text-[12px] tracking-[0.2em] uppercase rounded-full hover:bg-white/90 transition-all duration-300 shadow-xl shadow-black/20"
              >
                Hemen Al
              </Link>
              {/* Secondary CTA: minimal text + arrow so the primary HEMEN AL
                  button stands alone, instead of two heavy floating pills. */}
              <Link
                href="/kategoriler"
                className="group inline-flex items-center justify-center gap-2 px-2 py-3 font-audiowide text-[10px] sm:text-[12px] tracking-[0.25em] uppercase text-white/85 hover:text-white transition-colors [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]"
              >
                Kategorileri Keşfet
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Shop the look — real catalog products featured in the scene */}
        {heroProducts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-24 lg:bottom-10 inset-x-0 z-20 px-5 md:px-16"
          >
            <div className="max-w-7xl mx-auto">
              <span className="block font-audiowide text-[9px] uppercase tracking-[0.4em] text-white/60 mb-3">
                Sahnedeki Ürünler
              </span>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {heroProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="group shrink-0 flex items-center gap-3 bg-white/90 backdrop-blur-md border border-black/10 rounded-3xl pl-2 pr-5 py-2 shadow-lg shadow-black/10 hover:bg-white transition-colors"
                  >
                    <span className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden bg-secondary/30">
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="48px" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-body text-[13px] font-medium text-[#1d1d1f] leading-tight line-clamp-2 max-w-[170px] md:max-w-[200px]">
                        {p.name}
                      </span>
                      <span className="block font-audiowide text-[11px] tracking-wide text-[#1d1d1f]/70 mt-0.5">
                        {formatPrice(p.price)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </section>

      {/* Trust strip */}
      <section className="py-10 md:py-14 px-5 md:px-16 bg-white border-b border-black/5">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-8">
          {[
            { icon: <Truck size={20} />, title: "Ücretsiz Kargo", note: "750 TL üzeri siparişlerde" },
            { icon: <RefreshCw size={20} />, title: "Kolay İade", note: "14 gün koşulsuz iade" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <div className="text-black/60">{item.icon}</div>
              <div>
                <p className="font-audiowide text-[10px] uppercase tracking-[0.25em] text-black">
                  {item.title}
                </p>
                <p className="text-[11px] text-black/40 mt-1 font-body">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 md:py-28 px-5 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div className="space-y-3 max-w-xl">
              <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-black/40">
                Kategoriler
              </span>
              <h2 className="font-audiowide text-3xl md:text-5xl text-black uppercase tracking-tight">
                Koleksiyona Göz Atın
              </h2>
              <p className="text-black/40 text-base leading-relaxed">
                Saklamadan servise her ihtiyacınız için özenle organize edilmiş bölümler.
              </p>
            </div>
            <Link
              href="/kategoriler"
              className="inline-flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-black border-b border-black/10 hover:border-black pb-1 transition-colors"
            >
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {kitchenGroups.map((sub) => (
              <Link
                key={sub.slug}
                href={`/shop/mutfak?sub=${sub.slug}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden bg-[#f5f5f7]">
                  <Image
                    src={sub.image ?? categoryMap["mutfak"].image}
                    alt={sub.label}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <p className="font-audiowide text-[10px] uppercase tracking-[0.25em] text-black mt-3 group-hover:opacity-60 transition-opacity">
                  {sub.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-20 md:py-32 px-5 md:px-16 bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 md:mb-24 gap-8 text-center md:text-left">
            <div className="space-y-6 w-full md:w-auto">
              <span className="text-black/30 font-audiowide text-[9px] uppercase tracking-[0.4em] block">
                Küratörlük
              </span>
              <h2 className="text-4xl md:text-6xl font-audiowide text-black tracking-tighter leading-[1.1]">
                Üstün Performans <br className="hidden md:block" />
                Ve Minimalizm.
              </h2>
            </div>
            <Link
              href="/shop"
              className="mx-auto md:mx-0 font-audiowide text-[10px] uppercase tracking-[0.3em] text-black border-b border-black/10 pb-2 hover:border-black transition-all"
            >
              Tümünü Gör
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-20">
            {homeFallback.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Set ürünleri */}
      {setsRow.length > 0 ? (
        <ProductRow
          eyebrow="Setler"
          title="Setlerimize Göz Atın"
          description="Bonny ailesi ve 4'lü Dikdörtgen — kapağı ile birlikte üst üste düzgün yerleşen saklama setleri."
          products={setsRow}
          href="/shop/saklama-kaplari"
          hrefLabel="Tüm Setler"
        />
      ) : null}

      {/* New arrivals */}
      <ProductRow
        eyebrow="Yeni Gelenler"
        title="Koleksiyona Eklenen Son Ürünler"
        description="Yeni nesil mutfak gereçleri; modern tasarım ve fonksiyonel detaylar."
        products={newArrivalsRow}
        href="/shop?badges=new"
        hrefLabel="Tüm Yeni Ürünler"
      />

      {/* Discounted */}
      <section className="py-20 md:py-28 px-5 md:px-16 bg-[#f9fafb] border-y border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div className="space-y-3 max-w-xl">
              <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-black/40">
                Fırsatlar
              </span>
              <h2 className="font-audiowide text-3xl md:text-5xl text-black uppercase tracking-tight">
                Sınırlı Süreli İndirimler
              </h2>
              <p className="text-black/40 text-base leading-relaxed">
                Seçili ürünlerde sezona özel avantajlı fiyatlar.
              </p>
            </div>
            <Link
              href="/shop?badges=sale"
              className="inline-flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-black border-b border-black/10 hover:border-black pb-1 transition-colors"
            >
              Tüm İndirimler <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-16">
            {discountedRow.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Recently viewed */}
      <RecentlyViewedRow />

      {/* Quote */}
      <section className="py-32 md:py-48 px-5 bg-[#f9fafb]">
        <div className="max-w-3xl mx-auto text-center px-4">
          <p className="font-body text-xl md:text-3xl text-black leading-relaxed font-light italic">
            &ldquo;Mükemmellik, eklenecek bir şey kalmadığında değil, çıkarılacak bir şey
            kalmadığında elde edilir.&rdquo;
          </p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="w-12 h-px bg-black/10" />
            <span lang="en" className="font-audiowide text-[9px] uppercase tracking-[0.5em] text-black/30">
              Zest Home Philosophy
            </span>
          </div>
        </div>
      </section>

    </main>
  );
}
