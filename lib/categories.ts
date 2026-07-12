import { Category } from "@/types";

export const categories: Category[] = [
  {
    slug: "mutfak",
    shortLabel: "Mutfak",
    label: "Mutfak",
    description:
      "Doğrayıcılardan saklama kaplarına, servis gereçlerinden mutfak aletlerine kadar mutfağınızın her köşesi için özenle seçilmiş ürünler.",
    image: "/products/alt-kmn/0.jpg",
    subcategories: [
      {
        slug: "saklama-kaplari",
        label: "Saklama Kapları",
        image: "/products/c-bonny-3lu/siyah/0.jpg",
      },
      {
        slug: "dograyicilar-rendeler",
        label: "Doğrayıcılar & Rendeler",
        image: "/products/dor-m1/0.jpg",
      },
      {
        slug: "servis-sofra",
        label: "Servis & Sofra",
        image: "/products/srv-kal1001/0.jpg",
      },
      {
        slug: "mutfak-yardimcilari",
        label: "Mutfak Yardımcıları",
        image: "/products/alt-m3/0.jpg",
      },
    ],
  },
  {
    slug: "genel-ev-urunleri",
    shortLabel: "Ev",
    label: "Ev Gereçleri",
    description:
      "Evinizin her alanına değer katan pratik ve şık ürünler. Yeni koleksiyon çok yakında sizlerle.",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200",
    subcategories: [],
  },
];

export const categoryMap: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.slug, c]),
);

export const subcategoryMap: Record<string, { category: Category; subcategory: { slug: string; label: string } }> =
  Object.fromEntries(
    categories.flatMap((c) =>
      c.subcategories.map((s) => [s.slug, { category: c, subcategory: s }]),
    ),
  );

export const getCategoryLabel = (slug: string) => categoryMap[slug]?.label ?? slug;
export const getSubcategoryLabel = (slug?: string) =>
  slug ? subcategoryMap[slug]?.subcategory.label ?? slug : undefined;
