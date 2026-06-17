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
  // Variant choice for set-style products. Required for any product that has
  // variants — the cart key (line identity) becomes `id + colorKey` so two
  // colors of the same set sit on separate lines.
  color?: {
    key: string;
    label: string;
    hex: string;
  };
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
