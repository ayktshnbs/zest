"use client";

// Renders an admin-added category page (/shop/<custom-slug>): hero with the
// category's name/image + grid of its custom products. The same look as the
// built-in category page; reuses ProductCard so cards behave identically.

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useLiveCatalog } from "@/lib/useStock";
import { customToProduct } from "@/lib/customProducts";

const FALLBACK_IMAGE = "/hero.jpg";

export const CustomCategoryView = ({ slug }: { slug: string }) => {
  const liveCatalog = useLiveCatalog();

  // Until the live catalog has loaded at least once, we can't tell whether the
  // slug exists. Show a loading state and only call notFound() once we've
  // confirmed nothing matches AND the catalog has loaded.
  const loaded =
    liveCatalog.categories.length > 0 || liveCatalog.customProducts.length > 0;

  const category = liveCatalog.categories.find((c) => c.slug === slug);
  const productsInCat = useMemo(
    () =>
      liveCatalog.customProducts
        .filter((p) => p.isActive && p.categorySlug === slug)
        .map((p) => customToProduct(p, liveCatalog.categories)),
    [liveCatalog.customProducts, liveCatalog.categories, slug],
  );

  // If the catalog has loaded and the slug matches neither a category nor any
  // product, it doesn't exist — fall through to 404.
  if (loaded && !category && productsInCat.length === 0) notFound();

  if (!loaded) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yükleniyor
        </p>
      </main>
    );
  }

  const label = category?.label ?? slug;
  const heroImage =
    category?.imageUrl ||
    productsInCat.find((p) => p.imageUrl)?.imageUrl ||
    FALLBACK_IMAGE;
  const isExternal = /^https?:\/\//.test(heroImage);

  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        <div className="mb-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-audiowide text-foreground/40">
          <Link href="/" className="hover:text-foreground transition-colors">Anasayfa</Link>
          <ChevronRight size={12} />
          <Link href="/kategoriler" className="hover:text-foreground transition-colors">Kategoriler</Link>
          <ChevronRight size={12} />
          <span className="text-foreground/70">{label}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-20 items-end">
          <div className="lg:col-span-7 space-y-6">
            <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30">
              Kategori
            </span>
            <h1 className="font-audiowide text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight text-foreground">
              {label}
            </h1>
            <p className="text-foreground/50 text-base md:text-lg max-w-2xl leading-relaxed">
              {productsInCat.length} ürün
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden bg-secondary/30">
              <Image
                src={heroImage}
                alt={label}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                unoptimized={isExternal}
                priority
              />
            </div>
          </div>
        </div>

        {productsInCat.length === 0 ? (
          <div className="py-24 text-center border-t border-foreground/5">
            <p className="font-audiowide text-[11px] uppercase tracking-[0.4em] text-foreground/60 mb-4">
              Çok Yakında
            </p>
            <p className="text-foreground/40 max-w-md mx-auto leading-relaxed">
              Bu kategoride henüz ürün yok.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-20">
            {productsInCat.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
