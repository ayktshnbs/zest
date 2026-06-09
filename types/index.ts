export type BadgeVariant = "new" | "bestseller" | "sale" | "featured";

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  category: string;
  categoryLabel: string;
  subcategory?: string;
  subcategoryLabel?: string;
  brand: string;
  sku: string;
  stock: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  images: string[];
  tags: string[];
  features: string[];
  materials: string;
  care: string;
  dimensions?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Subcategory {
  slug: string;
  label: string;
  description?: string;
  image?: string;
}

export interface Category {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  image: string;
  subcategories: Subcategory[];
}

export type SortKey =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "popular";
