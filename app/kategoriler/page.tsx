import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/categories";
import { products } from "@/lib/products";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Kategoriler | Zest",
  description: "Mutfak gereçleri kategorilerimizi keşfedin.",
};

export default function CategoriesPage() {
  const productCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.slug] = products.filter((p) => p.category === cat.slug).length;
    return acc;
  }, {});

  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        <div className="text-center mb-16 md:mb-24 space-y-6">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30">
            Kategoriler
          </span>
          <h1 className="font-audiowide text-4xl md:text-7xl text-foreground tracking-tight uppercase">
            Mutfağın Her Detayı
          </h1>
          <p className="text-foreground/40 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Saklamadan servise, dilimlemeden doğramaya — özenle organize edilmiş koleksiyonlarımız.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-secondary/30 mb-6">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] opacity-70">
                    {productCounts[cat.slug] ?? 0} ürün
                  </span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-audiowide text-lg uppercase tracking-wider text-foreground mb-2">
                    {cat.label}
                  </h3>
                  <p className="text-foreground/40 text-sm leading-relaxed">{cat.description}</p>
                </div>
                <ArrowRight
                  size={20}
                  className="text-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all mt-1 flex-shrink-0"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {cat.subcategories.slice(0, 3).map((s) => (
                  <span
                    key={s.slug}
                    className="text-[10px] font-body uppercase tracking-[0.2em] text-foreground/40 border border-foreground/10 px-2.5 py-1"
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
