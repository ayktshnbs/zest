import { Category } from "@/types";

export const categories: Category[] = [
  {
    slug: "saklama-kaplari",
    shortLabel: "Saklama",
    label: "Saklama Kapları",
    description:
      "Vakumlu kapaklı, modüler ve hava geçirmez saklama çözümleriyle mutfağınız her zaman düzenli kalsın.",
    image: "/products/skl-esk1001/0.jpg",
    subcategories: [
      { slug: "vakumlu-kavanozlar", label: "Vakumlu Kavanozlar" },
      { slug: "dikdortgen-kaplar", label: "Dikdörtgen Kaplar" },
      { slug: "cam-gorunumlu", label: "Cam Görünümlü Kaplar" },
      { slug: "ahsap-kapakli", label: "Ahşap Kapaklı Kavanozlar" },
      { slug: "saklama-setleri", label: "Saklama Setleri" },
    ],
  },
  {
    slug: "dograyicilar",
    shortLabel: "Doğrayıcı",
    label: "Doğrayıcılar & Rondolar",
    description:
      "Manuel doğrayıcılar, ipli rondolar ve çok bıçaklı sistemlerle hızlı hazırlık.",
    image: "/products/dor-m1/0.jpg",
    subcategories: [
      { slug: "manuel-dograyicilar", label: "Manuel Doğrayıcılar" },
      { slug: "el-rondolari", label: "El Rondoları" },
      { slug: "ipli-dograyicilar", label: "İpli Doğrayıcılar" },
    ],
  },
  {
    slug: "rendeler-dilimleyiciler",
    shortLabel: "Rende",
    label: "Rendeler & Dilimleyiciler",
    description:
      "Mandolin dilimleyiciler ve çok yönlü rendelerle pratik ön hazırlık.",
    image: "/products/rnd-rev/0.jpg",
    subcategories: [
      { slug: "mandolin-dilimleyiciler", label: "Mandolin Dilimleyiciler" },
      { slug: "cok-yonlu-rendeler", label: "Çok Yönlü Rendeler" },
      { slug: "profesyonel-setler", label: "Profesyonel Setler" },
    ],
  },
  {
    slug: "servis-sofra",
    shortLabel: "Servis",
    label: "Servis & Sofra",
    description:
      "Salata kaseleri, servis tabakları ve sürahilerle sofralarınıza özen.",
    image: "/products/srv-kal1001/0.jpg",
    subcategories: [
      { slug: "salata-kaseleri", label: "Salata & Servis Kaseleri" },
      { slug: "servis-tabaklari", label: "Servis Tabakları" },
      { slug: "surahi-karaf", label: "Sürahi & Karaflar" },
    ],
  },
  {
    slug: "mutfak-aletleri",
    shortLabel: "Aletler",
    label: "Mutfak Aletleri",
    description:
      "Spatula, kepçe, ölçü kabı, salata kurutucu ve soyacaklarla vazgeçilmez mutfak araçları.",
    image: "/products/alt-kmn/0.jpg",
    subcategories: [
      { slug: "spatula-kepce-setleri", label: "Spatula & Kepçe Setleri" },
      { slug: "olcu-kaplari", label: "Ölçü Kapları" },
      { slug: "salata-kurutucular", label: "Salata Kurutucular" },
      { slug: "soyacaklar", label: "Soyacaklar" },
    ],
  },
  {
    slug: "mutfak-aksesuarlari",
    shortLabel: "Aksesuar",
    label: "Mutfak Aksesuarları",
    description:
      "Havluluklar, buz kalıpları ve düzenleyiciler ile mutfak detayları.",
    image: "/products/aks-kag/0.jpg",
    subcategories: [
      { slug: "havluluk-standlar", label: "Havluluk & Standlar" },
      { slug: "buz-kaliplari", label: "Buz Kalıpları" },
    ],
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
