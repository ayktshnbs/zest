import { Category } from "@/types";

export const categories: Category[] = [
  {
    slug: "saklama-kaplari",
    shortLabel: "Saklama",
    label: "Saklama Kapları",
    description:
      "Vakumlu kapaklı, modüler ve hava geçirmez saklama çözümleriyle mutfağınız her zaman düzenli kalsın.",
    image:
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=1200",
    subcategories: [
      { slug: "vakumlu-kavanozlar", label: "Vakumlu Kavanozlar" },
      { slug: "dikdortgen-kaplar", label: "Dikdörtgen Kaplar" },
      { slug: "kare-kaplar", label: "Kare Kaplar" },
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
    image:
      "https://images.unsplash.com/photo-1604908176997-431b88e1be43?auto=format&fit=crop&q=80&w=1200",
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
    image:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=1200",
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
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200",
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
      "Spatula, kepçe, ölçü kabı ve salata kurutucu gibi vazgeçilmez mutfak araçları.",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1200",
    subcategories: [
      { slug: "spatula-kepce-setleri", label: "Spatula & Kepçe Setleri" },
      { slug: "olcu-kaplari", label: "Ölçü Kapları" },
      { slug: "salata-kurutucular", label: "Salata Kurutucular" },
    ],
  },
  {
    slug: "mutfak-aksesuarlari",
    shortLabel: "Aksesuar",
    label: "Mutfak Aksesuarları",
    description:
      "Havluluklar, buz kalıpları ve düzenleyiciler ile mutfak detayları.",
    image:
      "https://images.unsplash.com/photo-1610137255937-8eb421b9cd0c?auto=format&fit=crop&q=80&w=1200",
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
