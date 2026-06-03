"use client";

import { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ProductRowProps {
  title: string;
  description?: string;
  products: Product[];
  href?: string;
  eyebrow?: string;
  hrefLabel?: string;
}

export const ProductRow = ({
  title,
  description,
  products,
  href,
  hrefLabel = "Tümünü Gör",
  eyebrow,
}: ProductRowProps) => {
  if (products.length === 0) return null;
  return (
    <section className="py-16 md:py-24 px-5 md:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="space-y-3 max-w-xl">
            {eyebrow ? (
              <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40">
                {eyebrow}
              </span>
            ) : null}
            <h2 className="font-audiowide text-3xl md:text-5xl text-foreground uppercase tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="text-foreground/40 text-base leading-relaxed">{description}</p>
            ) : null}
          </div>
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground border-b border-foreground/10 hover:border-foreground pb-1 transition-colors"
            >
              {hrefLabel} <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-16">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
};
