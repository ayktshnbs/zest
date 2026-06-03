import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { categories, categoryMap } from "@/lib/categories";
import { getProductsByCategory } from "@/lib/products";
import { ChevronRight } from "lucide-react";
import { CategoryShop } from "./CategoryShop";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const cat = categoryMap[params.category];
  if (!cat) return { title: "Kategori | Zest Kitchene" };
  return {
    title: `${cat.label} | Zest Kitchene`,
    description: cat.description,
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const cat = categoryMap[params.category];
  if (!cat) notFound();
  const list = getProductsByCategory(cat.slug);

  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Breadcrumb */}
        <div className="mb-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-audiowide text-foreground/40">
          <Link href="/" className="hover:text-foreground transition-colors">
            Anasayfa
          </Link>
          <ChevronRight size={12} />
          <Link href="/kategoriler" className="hover:text-foreground transition-colors">
            Kategoriler
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground/70">{cat.label}</span>
        </div>

        {/* Hero */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-20 items-end">
          <div className="lg:col-span-7 space-y-6">
            <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30">
              Kategori
            </span>
            <h1 className="font-audiowide text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight text-foreground">
              {cat.label}
            </h1>
            <p className="text-foreground/50 text-base md:text-lg max-w-2xl leading-relaxed">
              {cat.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {cat.subcategories.map((s) => (
                <span
                  key={s.slug}
                  className="text-[10px] font-body uppercase tracking-[0.2em] text-foreground/50 border border-foreground/10 px-3 py-1.5"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden bg-secondary/30">
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
          </div>
        </div>

        <CategoryShop category={cat} products={list} />
      </div>
    </main>
  );
}
