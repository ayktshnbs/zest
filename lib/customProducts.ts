"use client";

// Helpers that turn admin-added products (DB rows) into the storefront's
// Product shape so the same UI components can render them. The merged product
// list = static `products` (lib/products.ts) + active custom products.

import { Product } from "@/types";
import { categoryMap, subcategoryMap } from "./categories";
import { slugify } from "./utils";
import type { CustomProductData, PublicCategory } from "./api";

/** Convert one DB custom product into a storefront Product. */
export const customToProduct = (p: CustomProductData, extraCategories: PublicCategory[]): Product => {
  // Resolve category label. The categorySlug may be a built-in top-level slug,
  // a built-in subcategory slug, or an admin-added category slug.
  const builtinSub = subcategoryMap[p.categorySlug];
  const builtinCat = categoryMap[p.categorySlug];
  const admin = extraCategories.find((c) => c.slug === p.categorySlug);

  const topCategorySlug = builtinSub ? builtinSub.category.slug
    : builtinCat ? builtinCat.slug
    : "mutfak"; // fallback so the product still appears in the main category

  const categoryLabel = builtinSub ? builtinSub.category.label
    : builtinCat ? builtinCat.label
    : admin?.label ?? topCategorySlug;

  const subcategorySlug = builtinSub ? builtinSub.subcategory.slug
    : admin ? p.categorySlug
    : undefined;

  const subcategoryLabel = builtinSub ? builtinSub.subcategory.label
    : admin ? admin.label
    : undefined;

  const images = p.imageUrls.length > 0 ? p.imageUrls : ["/hero.jpg"];
  const cover = images[0];

  return {
    id: p.id,
    slug: slugify(p.name),
    name: p.name,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    price: p.priceCents / 100,
    category: topCategorySlug,
    categoryLabel,
    subcategory: subcategorySlug,
    subcategoryLabel,
    brand: "Zest Home",
    sku: `ZST-${p.id.toUpperCase()}`,
    stock: 0, // live stock comes from useLiveProduct
    rating: 0,
    reviewCount: 0,
    imageUrl: cover,
    images,
    tags: ["custom", p.categorySlug],
    features: [],
    materials: "",
    care: "",
    isNew: p.badges?.isNew,
    isBestSeller: p.badges?.isBestSeller,
    isFeatured: p.badges?.isFeatured,
  };
};

/** Merge admin-added active products into a static list of Products. */
export const mergeProducts = (
  base: Product[],
  customs: CustomProductData[],
  extraCategories: PublicCategory[],
): Product[] => {
  if (customs.length === 0) return base;
  const customAsProducts = customs
    .filter((c) => c.isActive)
    .map((c) => customToProduct(c, extraCategories));
  // Custom products first so newly added items surface; then base catalog.
  return [...customAsProducts, ...base];
};
