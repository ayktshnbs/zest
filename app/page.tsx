"use client";

import {
  bestSellers,
  featuredProducts,
  newArrivals,
  discountedProducts,
  products,
} from "@/lib/products";
import { categoryMap } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { ProductRow } from "@/components/ProductRow";
import { RecentlyViewedRow } from "@/components/RecentlyViewedRow";
import { ChevronRight, ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

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

  const featured = featuredProducts.slice(0, 4);
  const homeFallback = featured.length > 0 ? featured : products.slice(0, 4);
  const bestSellersRow = bestSellers.length > 0 ? bestSellers : products.slice(4, 8);
  const newArrivalsRow = newArrivals.length > 0 ? newArrivals : products.slice(0, 4);
  const discountedRow =
    discountedProducts.length > 0 ? discountedProducts : products.slice(0, 4);
  const kitchenGroups = categoryMap["mutfak"]?.subcategories ?? [];

  return (
    <main className="min-h-screen bg-background relative">
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-[#f5f5f7]"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.jpg"
            alt="Modern Bright Kitchen Lifestyle Background"
            fill
            className="object-cover opacity-60 md:opacity-80 contrast-[1.05] saturate-[1.05] object-center"
            priority
          />
        </div>

        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="max-w-7xl mx-auto px-5 md:px-16 relative z-10 w-full text-center mt-[15vh] md:mt-[10vh]"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{
              y: [30, 0],
              opacity: 0.85,
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
              <h1 className="font-audiowide text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-5 md:mb-6 tracking-[-0.01em] text-[#1d1d1f] [text-wrap:balance]">
                Profesyonel Gereçler.
                <br />
                <span className="text-[#1d1d1f]/55">Zahmetsiz Yemek.</span>
              </h1>

              <p className="font-body text-base md:text-lg lg:text-xl text-[#1d1d1f]/60 max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed font-medium [text-wrap:pretty]">
                Modern mutfak gereçlerinden oluşan, minimalist lüks bir deneyim için tasarlanmış
                özel koleksiyon.
              </p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-10 py-4 bg-[#1d1d1f] text-white font-audiowide text-[10px] sm:text-[12px] tracking-[0.2em] uppercase rounded-full hover:bg-black transition-all duration-300 shadow-xl shadow-black/10"
              >
                Hemen Al
              </Link>
              <Link
                href="/kategoriler"
                className="w-full sm:w-auto px-10 py-4 bg-white/50 backdrop-blur-md text-[#1d1d1f] font-audiowide text-[10px] sm:text-[12px] tracking-[0.2em] uppercase rounded-full hover:bg-white/80 transition-all duration-300 flex items-center justify-center gap-2 border border-black/5"
              >
                Kategorileri Keşfet <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust strip */}
      <section className="py-10 md:py-14 px-5 md:px-16 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: <Truck size={20} />, title: "Ücretsiz Kargo", note: "750 TL üzeri siparişlerde" },
            { icon: <ShieldCheck size={20} />, title: "2 Yıl Garanti", note: "Tüm ürünler için" },
            { icon: <RefreshCw size={20} />, title: "Kolay İade", note: "14 gün koşulsuz iade" },
            { icon: <Headphones size={20} />, title: "Müşteri Desteği", note: "Hafta içi 09:00 – 18:00" },
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

      {/* Best sellers */}
      <ProductRow
        eyebrow="Çok Satanlar"
        title="Müşterilerimizin Favorileri"
        description="Binlerce mutfakta yerini almış, en çok tercih edilen ürünler."
        products={bestSellersRow}
        href="/shop?badges=bestseller"
        hrefLabel="Tüm Çok Satanlar"
      />

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

      {/* Newsletter */}
      <section className="py-24 md:py-48 px-5 bg-white border-t border-black/5">
        <div className="max-w-4xl mx-auto text-center space-y-12 md:space-y-16">
          <h2 className="font-audiowide text-2xl md:text-5xl text-black tracking-tight uppercase">
            Abone Olun
          </h2>
          <p className="text-black/50 text-base md:text-xl max-w-xl mx-auto font-light">
            Yeni koleksiyonlar ve özel davetlerden haberdar olun. Minimalist yaşam tarzını
            mutfağınıza taşıyın.
          </p>
          <form className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto pt-4 md:pt-8 border-b border-black">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 bg-transparent px-0 py-5 focus:outline-none text-black font-light placeholder:text-black/20 text-base md:text-lg"
            />
            <button className="py-5 text-[10px] font-audiowide tracking-[0.3em] uppercase text-black hover:opacity-50 transition-opacity text-right">
              Gönder
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
