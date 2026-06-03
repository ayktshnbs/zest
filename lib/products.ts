import { Product } from "@/types";
import { categoryMap } from "./categories";
import { pickImages } from "./images";
import { slugify } from "./utils";

interface ProductSeed {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: string;
  features: string[];
  materials: string;
  care: string;
  dimensions?: string;
  tags?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

const standardCare =
  "Sıcak suda yumuşak deterjanla elde yıkayın. Aşındırıcı süngerlerden ve bulaşık makinesinden uzak tutun. Tamamen kuruladıktan sonra kaldırın.";

const containerCare =
  "Sıcak sabunlu suda elde yıkayın, kapakları ayrı kurulayın. Bulaşık makinesinde üst raf önerilir; mikrodalga için lastik conta çıkarılmalıdır.";

const metalCare =
  "Kullanım sonrası nemli bezle silin. Paslanma riskine karşı her seferinde kurulayın. Klorlu temizleyicilerden kaçının.";

const seeds: ProductSeed[] = [
  // ── Doğrayıcılar & Rondolar ──────────────────────────────────────────
  {
    id: "dor-101",
    name: "Dora Manuel El Rondosu",
    category: "dograyicilar",
    subcategory: "el-rondolari",
    price: 549,
    originalPrice: 699,
    stock: 24,
    rating: 4.8,
    reviewCount: 312,
    shortDescription:
      "Üç bıçaklı sistemiyle saniyeler içinde sebze ve baharatlarınızı doğrar.",
    description:
      "Dora El Rondosu, ergonomik tutamağı ve paslanmaz çelik üçlü bıçak sistemiyle ön hazırlık sürenizi yarıya indirir. Tek elle çalıştırma kolaylığı, geniş hazne ve kaymaz tabanı sayesinde profesyonel sonuçlar sunar.",
    features: [
      "3'lü paslanmaz çelik bıçak sistemi",
      "500 ml şeffaf hazne",
      "Kaymaz silikon taban",
      "Tek elle pratik çalıştırma",
      "Bulaşık makinesinde yıkanabilir parçalar",
    ],
    materials: "Gıdayla temasa uygun ABS gövde, paslanmaz çelik bıçak, silikon taban.",
    care: standardCare,
    dimensions: "12 × 12 × 22 cm",
    tags: ["dograyici", "rondo", "el-aleti"],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: "dor-102",
    name: "Vera İpli Manuel Doğrayıcı",
    category: "dograyicilar",
    subcategory: "ipli-dograyicilar",
    price: 379,
    originalPrice: 459,
    stock: 41,
    rating: 4.7,
    reviewCount: 268,
    shortDescription:
      "İpli mekanizma sayesinde elektriksiz hızlı doğrama deneyimi.",
    description:
      "Vera ipli doğrayıcı, ipini çekerek bıçakları döndüren akıllı mekanizmasıyla soğan, sarımsak ve maydanozu birkaç hareketle inceltir. Şeffaf hazne kontrolü kolaylaştırır, kaymaz halka tezgâhta sabit kalmasını sağlar.",
    features: [
      "Çekme ipli bıçak mekanizması",
      "650 ml geniş hazne",
      "Kapak üzerinde bıçak güvenlik kilidi",
      "Sebze, meyve ve sert baharatlara uygun",
      "Şarja ihtiyaç duymaz",
    ],
    materials: "BPA içermeyen plastik gövde, paslanmaz çelik bıçak.",
    care: standardCare,
    dimensions: "15 × 15 × 14 cm",
    tags: ["ipli", "manuel", "dograyici"],
    isFeatured: true,
  },
  {
    id: "dor-103",
    name: "Maxi 3 Bıçaklı Manuel Doğrayıcı",
    category: "dograyicilar",
    subcategory: "manuel-dograyicilar",
    price: 459,
    stock: 18,
    rating: 4.6,
    reviewCount: 187,
    shortDescription:
      "Sebzelerden cevize, üç farklı bıçakla çok amaçlı doğrayıcı.",
    description:
      "Maxi 3 Bıçaklı Doğrayıcı, değiştirilebilir bıçak setiyle ince doğrama, jülyen ve püre haline getirme işlerini tek üründe sunar. Şeffaf haznesi ve dökme kapağıyla mutfakta ekstra alan kaplamaz.",
    features: [
      "3 farklı doğrama bıçağı",
      "Şeffaf 800 ml hazne",
      "Geniş dökme ağızlı kapak",
      "Bulaşık makinesinde yıkanabilir",
      "Kompakt saklama tasarımı",
    ],
    materials: "Yüksek darbeye dayanıklı kompozit plastik, 304 paslanmaz çelik bıçak.",
    care: standardCare,
    dimensions: "16 × 16 × 18 cm",
    tags: ["3-bicak", "manuel", "dograyici"],
  },
  {
    id: "dor-104",
    name: "Pro Salata Kurutucu & Doğrayıcı",
    category: "dograyicilar",
    subcategory: "el-rondolari",
    price: 689,
    originalPrice: 829,
    stock: 12,
    rating: 4.9,
    reviewCount: 421,
    shortDescription:
      "Hem salata kurutur hem de küçük doğramalar için kullanılır.",
    description:
      "Pro Salata Kurutucu & Doğrayıcı, çift fonksiyonlu yapısıyla mutfakta yer kazandırır. Kuvvetli santrifüj sistemi salatalarınızı saniyeler içinde kurutur; ek bıçak başlığıyla küçük doğrama işlerini de halleder.",
    features: [
      "Santrifüjlü hızlı kurutma sistemi",
      "Ekstra mini doğrama bıçağı",
      "2,5 L kapasite",
      "Tek elle çevirme tutamağı",
      "Kaymaz taban ve şeffaf gövde",
    ],
    materials: "Gıda sınıfı ABS, paslanmaz çelik aksam.",
    care: standardCare,
    dimensions: "24 × 24 × 18 cm",
    tags: ["salata", "kurutucu", "dograyici"],
    isBestSeller: true,
  },

  // ── Rendeler & Dilimleyiciler ────────────────────────────────────────
  {
    id: "rnd-201",
    name: "Profesyonel Mandolin Dilimleyici",
    category: "rendeler-dilimleyiciler",
    subcategory: "mandolin-dilimleyiciler",
    price: 899,
    originalPrice: 1149,
    stock: 9,
    rating: 4.8,
    reviewCount: 372,
    shortDescription:
      "Ayarlanabilir kalınlık ve toplama haznesiyle restoran kalitesinde dilimler.",
    description:
      "Profesyonel Mandolin Dilimleyici, 1–7 mm arasında kalınlık ayarı, dört farklı bıçak başlığı ve güvenli el koruyucusuyla sebzelerinizi eşit dilimler. Şeffaf toplama haznesi mutfak tezgâhınızı temiz tutar.",
    features: [
      "Ayarlanabilir 1–7 mm kalınlık",
      "4 farklı paslanmaz çelik bıçak",
      "Kayma önleyici taban",
      "Şeffaf 1,5 L toplama haznesi",
      "Güvenli el koruyucu aparat",
    ],
    materials: "Paslanmaz çelik bıçaklar, ABS gövde, silikon kaymaz taban.",
    care: metalCare,
    dimensions: "38 × 14 × 12 cm",
    tags: ["mandolin", "dilimleyici", "profesyonel"],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: "rnd-202",
    name: "Flat Ayarlanabilir Mandolin",
    category: "rendeler-dilimleyiciler",
    subcategory: "mandolin-dilimleyiciler",
    price: 469,
    stock: 27,
    rating: 4.5,
    reviewCount: 154,
    shortDescription:
      "Düz tasarımı sayesinde çekmecede minimum yer kaplar.",
    description:
      "Flat Ayarlanabilir Mandolin, kompakt yapısı ve hızlı kalınlık değiştirme düğmesiyle günlük kullanım için idealdir. Üç bıçak modu sayesinde dilim, çubuk ve jülyen kesimleri yapabilirsiniz.",
    features: [
      "Üç farklı kesim modu",
      "Tek dokunuşla kalınlık ayarı",
      "Kompakt, ince gövde",
      "Bulaşık makinesinde yıkanabilir",
    ],
    materials: "Paslanmaz çelik bıçak, ABS gövde.",
    care: standardCare,
    dimensions: "36 × 12 × 4 cm",
    tags: ["mandolin", "ince-tasarim"],
  },
  {
    id: "rnd-203",
    name: "Çok Yönlü Rende Seti",
    category: "rendeler-dilimleyiciler",
    subcategory: "cok-yonlu-rendeler",
    price: 559,
    originalPrice: 649,
    stock: 33,
    rating: 4.6,
    reviewCount: 203,
    shortDescription:
      "Dört farklı rende yüzeyi tek üründe.",
    description:
      "Çok Yönlü Rende Seti; ince, kalın, çubuk ve dilim olmak üzere dört farklı yüzey sunar. Ergonomik tutamağı ve kaymaz tabanıyla güvenli kullanım sağlar.",
    features: [
      "4 farklı paslanmaz çelik yüzey",
      "Ergonomik kavrama",
      "Kaymaz silikon taban",
      "Asma deliği ile pratik saklama",
    ],
    materials: "Paslanmaz çelik gövde, TPR tutamak.",
    care: metalCare,
    dimensions: "28 × 12 × 8 cm",
    tags: ["rende", "set", "cok-yonlu"],
  },
  {
    id: "rnd-204",
    name: "Profesyonel Multi Rende & Dilimleyici",
    category: "rendeler-dilimleyiciler",
    subcategory: "profesyonel-setler",
    price: 1149,
    originalPrice: 1399,
    stock: 7,
    rating: 4.9,
    reviewCount: 289,
    shortDescription:
      "Beş bıçaklı profesyonel set, restoran kalitesinde sonuç.",
    description:
      "Profesyonel Multi Rende & Dilimleyici, beş değiştirilebilir bıçak başlığıyla restoran kalitesinde kesim sunar. Saklama haznesi, el koruyucu ve kaymaz taban dahildir.",
    features: [
      "5 değiştirilebilir bıçak",
      "Geniş 2 L toplama haznesi",
      "Güvenlik el koruyucu",
      "Bıçak saklama kutusu",
      "Tek tuşla kalınlık ayarı",
    ],
    materials: "Paslanmaz çelik, ABS, silikon.",
    care: metalCare,
    dimensions: "42 × 18 × 18 cm",
    tags: ["profesyonel", "set", "mandolin"],
    isFeatured: true,
  },

  // ── Saklama Kapları ─────────────────────────────────────────────────
  {
    id: "skl-301",
    name: "Bonny Vakumlu Saklama Kavanozu 1.2L",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 229,
    originalPrice: 279,
    stock: 86,
    rating: 4.7,
    reviewCount: 512,
    shortDescription:
      "Vakum kapaklı saklama kavanozu kuru gıdalarınızı uzun süre taze tutar.",
    description:
      "Bonny Vakumlu Saklama Kavanozu, tek dokunuşla kapanan vakum kilidiyle baharat, çay, kahve ve kuru gıdaları aylarca taze tutar. Modüler tasarımı kavanozları üst üste istiflemenize olanak verir.",
    features: [
      "Tek dokunuş vakum kilidi",
      "Modüler istiflenebilir gövde",
      "BPA içermez",
      "Bulaşık makinesinde yıkanabilir gövde",
      "Şeffaf gövde ile içerik kontrolü",
    ],
    materials: "Tritan™ benzeri saydam plastik, silikon conta.",
    care: containerCare,
    dimensions: "10 × 10 × 18 cm · 1.2 L",
    tags: ["vakumlu", "kavanoz", "saklama"],
    isBestSeller: true,
  },
  {
    id: "skl-302",
    name: "Bonny Vakumlu Saklama Kavanozu 0.6L",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 159,
    stock: 124,
    rating: 4.6,
    reviewCount: 384,
    shortDescription:
      "Küçük boy vakumlu kavanoz; baharat ve kuruyemiş için ideal.",
    description:
      "Bonny serisinin küçük boyu, baharat dolaplarınızda tasarrufla yer tutar. Aynı vakum mekanizması ve istiflenebilir yapı küçük gıdalarınızı korur.",
    features: [
      "Tek dokunuş vakum kapağı",
      "Modüler istiflenebilir tasarım",
      "BPA içermez",
      "Şeffaf gövde",
    ],
    materials: "Saydam plastik, silikon conta.",
    care: containerCare,
    dimensions: "10 × 10 × 12 cm · 0.6 L",
    tags: ["vakumlu", "kavanoz"],
  },
  {
    id: "skl-303",
    name: "Luxe Premium Vakumlu Kavanoz 1L",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 279,
    originalPrice: 329,
    stock: 64,
    rating: 4.8,
    reviewCount: 428,
    shortDescription:
      "Saten dokulu premium gövde, modern mutfaklara uyum.",
    description:
      "Luxe Premium serisi, saten dokulu gövdesi ve mat metalik kapağıyla mutfak tezgâhlarında dekoratif duruşa sahip. Vakum sistemi sayesinde içerikleri uzun süre korur.",
    features: [
      "Saten dokulu cam görünümlü gövde",
      "Metalik mat vakum kapağı",
      "İstiflenebilir tasarım",
      "Şeffaf gövde içerik kontrolü",
    ],
    materials: "BPA içermeyen kompozit, mat metalik kaplama.",
    care: containerCare,
    dimensions: "10 × 10 × 16 cm · 1 L",
    tags: ["premium", "vakumlu", "kavanoz"],
    isNew: true,
    isFeatured: true,
  },
  {
    id: "skl-304",
    name: "Luxe Premium Vakumlu Kavanoz 1.8L",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 339,
    stock: 49,
    rating: 4.8,
    reviewCount: 263,
    shortDescription:
      "Geniş hacimli premium kavanoz; un ve şeker için ideal.",
    description:
      "Luxe Premium serisinin 1.8 litrelik geniş boyu, un, şeker, makarna gibi temel kuru gıdalarınız için pratik saklama sunar.",
    features: [
      "Geniş ağız ölçü kabı uyumu",
      "Saten dokulu gövde",
      "Vakum kilitli kapak",
    ],
    materials: "BPA içermeyen kompozit gövde.",
    care: containerCare,
    dimensions: "12 × 12 × 22 cm · 1.8 L",
    tags: ["premium", "vakumlu"],
    isNew: true,
  },
  {
    id: "skl-305",
    name: "Woody Ahşap Kapaklı Kavanoz 0.9L",
    category: "saklama-kaplari",
    subcategory: "ahsap-kapakli",
    price: 199,
    stock: 92,
    rating: 4.7,
    reviewCount: 198,
    shortDescription:
      "Doğal ahşap kapaklı kavanoz, sıcak Scandi dokunuşu.",
    description:
      "Woody Ahşap Kapaklı Kavanoz, doğal kayın ağacı kapağı ve silikon contası sayesinde hem dekoratif hem de işlevseldir. Açık raflarda sergilemek için idealdir.",
    features: [
      "Doğal kayın ağacı kapak",
      "Silikon hava sızdırmaz conta",
      "Cam görünümlü şeffaf gövde",
      "Açık rafta sergi uyumu",
    ],
    materials: "Cam görünümlü kompozit, kayın ağacı kapak.",
    care: "Ahşap kapakları suya batırmayın; nemli bezle silin. Gövde elde yıkanır.",
    dimensions: "10 × 10 × 14 cm · 0.9 L",
    tags: ["ahsap", "scandi", "kavanoz"],
  },
  {
    id: "skl-306",
    name: "Woody Ahşap Kapaklı Kavanoz 1.4L",
    category: "saklama-kaplari",
    subcategory: "ahsap-kapakli",
    price: 249,
    originalPrice: 299,
    stock: 71,
    rating: 4.7,
    reviewCount: 165,
    shortDescription:
      "Geniş hacimli ahşap kapaklı kavanoz; tahıllar için ideal.",
    description:
      "Woody serisinin geniş hacimli boyu, kahvaltılık gevrek ve tahıllarınız için modern bir görünüm sunar.",
    features: [
      "Doğal ahşap kapak",
      "Geniş ağız",
      "Şeffaf cam görünüm",
    ],
    materials: "Cam görünümlü kompozit, ahşap kapak.",
    care: "Ahşap kapakları suya batırmayın.",
    dimensions: "12 × 12 × 20 cm · 1.4 L",
    tags: ["ahsap", "scandi", "kavanoz"],
  },
  {
    id: "skl-307",
    name: "Crystal Şeffaf Hava Sızdırmaz Kap 1L",
    category: "saklama-kaplari",
    subcategory: "cam-gorunumlu",
    price: 189,
    stock: 58,
    rating: 4.5,
    reviewCount: 142,
    shortDescription:
      "Cam görünümlü, kelebek kilitli pratik saklama kabı.",
    description:
      "Crystal serisi, cam görünümlü gövdesi ve dört taraftan kilitli kapağıyla hava sızdırmaz saklama sunar. Hafiftir, kırılmaz ve buzdolabında yer kazandırır.",
    features: [
      "Dört kelebek kilit",
      "Hava sızdırmaz silikon conta",
      "Buzdolabında istiflenebilir",
      "Mikrodalga uyumlu (kapak hariç)",
    ],
    materials: "BPA içermeyen PP, silikon conta.",
    care: containerCare,
    dimensions: "18 × 13 × 8 cm · 1 L",
    tags: ["cam-gorunum", "hava-sizdirmaz"],
  },
  {
    id: "skl-308",
    name: "Crystal Şeffaf Saklama Kabı 0.5L",
    category: "saklama-kaplari",
    subcategory: "cam-gorunumlu",
    price: 129,
    stock: 76,
    rating: 4.4,
    reviewCount: 92,
    shortDescription:
      "Küçük boy şeffaf saklama kabı; soslar ve kahvaltılıklar için.",
    description:
      "Crystal serisinin küçük boyu, sos, çerez ve kahvaltılıkları taze tutmak için tasarlandı.",
    features: [
      "Kelebek kilitli kapak",
      "Şeffaf gövde",
      "İstiflenebilir tasarım",
    ],
    materials: "PP gövde, silikon conta.",
    care: containerCare,
    dimensions: "14 × 11 × 6 cm · 0.5 L",
    tags: ["cam-gorunum", "kucuk-boy"],
  },
  {
    id: "skl-309",
    name: "Square 3'lü Saklama Kabı Seti",
    category: "saklama-kaplari",
    subcategory: "saklama-setleri",
    price: 749,
    originalPrice: 899,
    stock: 22,
    rating: 4.9,
    reviewCount: 318,
    shortDescription:
      "Üç farklı boyda hava sızdırmaz kare set.",
    description:
      "Square Saklama Seti, üç farklı boyutu sayesinde mutfak dolabınızda eksiksiz bir saklama çözümü sunar. Aynı tabana sahip kapları üst üste istiflemek mümkün.",
    features: [
      "0.6 L + 1.2 L + 2.0 L",
      "Dört kelebek kilit",
      "İstiflenebilir kare gövde",
      "BPA içermez",
    ],
    materials: "Gıda sınıfı PP, silikon.",
    care: containerCare,
    dimensions: "Set kutusu: 22 × 22 × 20 cm",
    tags: ["set", "saklama", "kare"],
    isBestSeller: true,
  },
  {
    id: "skl-310",
    name: "Modüler Dikdörtgen Saklama Kabı 1.2L",
    category: "saklama-kaplari",
    subcategory: "dikdortgen-kaplar",
    price: 149,
    stock: 134,
    rating: 4.6,
    reviewCount: 221,
    shortDescription:
      "Buzdolabına ergonomik sığan dikdörtgen kap.",
    description:
      "Modüler Dikdörtgen Saklama Kabı, dolap ölçülerine göre tasarlanmış formuyla yerden kazandırır. Mikrodalga ve dondurucuda kullanıma uygundur.",
    features: [
      "Buzdolabı dostu form",
      "Hava sızdırmaz kilit",
      "Mikrodalga uyumlu",
      "İstiflenebilir tasarım",
    ],
    materials: "BPA içermeyen PP, silikon conta.",
    care: containerCare,
    dimensions: "20 × 14 × 7 cm · 1.2 L",
    tags: ["dikdortgen", "hava-sizdirmaz"],
  },
  {
    id: "skl-311",
    name: "Modüler Dikdörtgen Saklama Kabı 1.8L",
    category: "saklama-kaplari",
    subcategory: "dikdortgen-kaplar",
    price: 189,
    stock: 102,
    rating: 4.6,
    reviewCount: 174,
    shortDescription:
      "Geniş hacimli dikdörtgen kap; sebzeler ve hazırlanmış yemekler için.",
    description:
      "Geniş hacmiyle önceden hazırlanan yemekler ve sebzeler için ideal. Aynı seriyle istiflenebilir tasarım sayesinde buzdolabınızda düzen sağlar.",
    features: [
      "1.8 L geniş hacim",
      "Hava sızdırmaz kilit",
      "Mikrodalga uyumlu",
      "Şeffaf gövde",
    ],
    materials: "PP gövde, silikon conta.",
    care: containerCare,
    dimensions: "24 × 16 × 8 cm · 1.8 L",
    tags: ["dikdortgen", "geniş"],
  },
  {
    id: "skl-312",
    name: "Tall Cam Görünümlü Vakumlu Kavanoz",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 269,
    stock: 47,
    rating: 4.7,
    reviewCount: 138,
    shortDescription:
      "Uzun boylu, dar tabanlı kavanoz; makarna ve spagetti için.",
    description:
      "Tall serisinin uzun gövdesi, spagetti ve makarna gibi uzun ürünleri eksiksiz saklamanıza imkân verir. Vakum kilidi tazeliği korur.",
    features: [
      "Uzun gövde",
      "Vakum kapağı",
      "Şeffaf görünüm",
    ],
    materials: "BPA içermeyen plastik, silikon conta.",
    care: containerCare,
    dimensions: "10 × 10 × 28 cm · 1.5 L",
    tags: ["uzun", "vakumlu"],
  },
  {
    id: "skl-313",
    name: "Tall Storage Kavanoz Üçlü Set",
    category: "saklama-kaplari",
    subcategory: "saklama-setleri",
    price: 849,
    originalPrice: 999,
    stock: 19,
    rating: 4.8,
    reviewCount: 247,
    shortDescription:
      "Aynı tasarımda üç uzun kavanoz; mutfak rafı için bütünlüklü görünüm.",
    description:
      "Tall Kavanoz Üçlü Set, aynı yüksekliğe sahip kavanozlarıyla raflarınızda dingin bir bütünlük yaratır. Vakum sistemi sayesinde gıdalarınız korunur.",
    features: [
      "3 × 1.5 L kavanoz",
      "Aynı boy bütünlüklü görünüm",
      "Vakum kapak",
      "Modüler istif",
    ],
    materials: "BPA içermez plastik, silikon.",
    care: containerCare,
    dimensions: "Set: 32 × 12 × 28 cm",
    tags: ["set", "uzun", "vakumlu"],
    isFeatured: true,
  },
  {
    id: "skl-314",
    name: "Hava Sızdırmaz Saklama Seti 7'li",
    category: "saklama-kaplari",
    subcategory: "saklama-setleri",
    price: 1299,
    originalPrice: 1599,
    stock: 14,
    rating: 4.9,
    reviewCount: 412,
    shortDescription:
      "Mutfak dolabınızı tamamen düzenleyecek 7 parça profesyonel set.",
    description:
      "7 farklı boyda hava sızdırmaz kaptan oluşan bu set, mutfak dolabınız için tam bir düzen çözümüdür. Etiket kartları ile gıda takibi kolaylaşır.",
    features: [
      "7 farklı boy hava sızdırmaz kap",
      "Etiket kartı seti hediye",
      "Bulaşık makinesi uyumlu",
      "Modüler istif tasarımı",
    ],
    materials: "PP gövde, silikon conta.",
    care: containerCare,
    dimensions: "Set kutusu: 38 × 28 × 26 cm",
    tags: ["set", "7li", "hava-sizdirmaz"],
    isBestSeller: true,
    isFeatured: true,
  },

  // ── Servis & Sofra ──────────────────────────────────────────────────
  {
    id: "srv-401",
    name: "Klasik Salata Kasesi Büyük",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 339,
    stock: 38,
    rating: 4.7,
    reviewCount: 156,
    shortDescription:
      "Geniş ağız ve derin formuyla servis dostu salata kasesi.",
    description:
      "Klasik Salata Kasesi, geniş ağız ve derin formuyla salata, makarna ve meyveleri sergilemek için tasarlandı. Mat parlak yüzeyi sofraya zarif bir hat katar.",
    features: [
      "3 L geniş hacim",
      "Mat parlak yüzey",
      "Bulaşık makinesi uyumlu",
      "Mikrodalga uyumlu",
    ],
    materials: "Yüksek dirençli stoneware seramik.",
    care: "Yumuşak süngerle yıkayın. Aşındırıcı temizleyici kullanmayın.",
    dimensions: "Ø 28 × 12 cm",
    tags: ["salata", "kase", "buyuk"],
    isFeatured: true,
  },
  {
    id: "srv-402",
    name: "Klasik Salata Kasesi Orta",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 259,
    stock: 64,
    rating: 4.6,
    reviewCount: 121,
    shortDescription:
      "Orta boy klasik kase; günlük servisler için ideal.",
    description:
      "Klasik kasenin orta boyu, günlük servislerinizi şıklaştırır. Set olarak diğer boylarla uyumlu kullanılabilir.",
    features: [
      "2 L hacim",
      "Aynı seri tasarım uyumu",
      "Mat parlak yüzey",
    ],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 24 × 10 cm",
    tags: ["salata", "kase"],
  },
  {
    id: "srv-403",
    name: "Klasik Çerez Kasesi",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 139,
    stock: 132,
    rating: 4.5,
    reviewCount: 78,
    shortDescription:
      "Küçük boy çerez kasesi; mezeler ve atıştırmalıklar için.",
    description:
      "Küçük boy klasik kase, mezeler ve atıştırmalıklar için zarif bir sunum sunar. Aynı seri ile kombinlenebilir.",
    features: [
      "0.6 L hacim",
      "Aynı seri uyumu",
      "Mat parlak yüzey",
    ],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 14 × 7 cm",
    tags: ["cerez", "kase", "kucuk"],
  },
  {
    id: "srv-404",
    name: "Dokulu Servis Kasesi Büyük",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 379,
    originalPrice: 449,
    stock: 26,
    rating: 4.8,
    reviewCount: 193,
    shortDescription:
      "El yapımı dokulu yüzey, doğal mat zemin.",
    description:
      "Dokulu Servis Kasesi, el yapımı izlenimi veren dokulu yüzeyi ve doğal mat zemin tonuyla minimalist sofralarda öne çıkar.",
    features: [
      "El yapımı doku",
      "Mat doğal ton",
      "3 L hacim",
      "Bulaşık makinesi uyumlu",
    ],
    materials: "Stoneware seramik.",
    care: "Yumuşak süngerle yıkayın.",
    dimensions: "Ø 28 × 12 cm",
    tags: ["dokulu", "kase", "buyuk"],
    isBestSeller: true,
  },
  {
    id: "srv-405",
    name: "Dokulu Servis Kasesi Orta",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 309,
    stock: 51,
    rating: 4.7,
    reviewCount: 162,
    shortDescription:
      "Aynı seriden orta boy dokulu kase.",
    description:
      "Dokulu serinin orta boyu, salatalar ve sıcak yemekler için uyumlu sunum sunar.",
    features: [
      "El yapımı doku",
      "2 L hacim",
      "Mat doğal ton",
    ],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 24 × 10 cm",
    tags: ["dokulu", "kase"],
  },
  {
    id: "srv-406",
    name: "Dokulu Servis Kasesi Küçük",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 209,
    stock: 89,
    rating: 4.6,
    reviewCount: 84,
    shortDescription:
      "Aperatif ve sos için tasarlanan küçük dokulu kase.",
    description:
      "Küçük boy dokulu kase, aperatif ve sos servisleri için zarif bir tercih.",
    features: ["El yapımı doku", "Mat ton", "0.6 L hacim"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 14 × 7 cm",
    tags: ["dokulu", "kucuk"],
  },
  {
    id: "srv-407",
    name: "Dokulu XXL Servis Kasesi",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 489,
    stock: 16,
    rating: 4.9,
    reviewCount: 211,
    shortDescription:
      "Davet sofralarına özel ekstra büyük kase.",
    description:
      "Dokulu seriden XXL kase, kalabalık davet sofraları için tasarlandı. Geniş ağzı ile sunum dostudur.",
    features: ["4.5 L hacim", "Dokulu zarif yüzey", "Bulaşık makinesi uyumlu"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 32 × 14 cm",
    tags: ["xxl", "davet", "kase"],
    isFeatured: true,
  },
  {
    id: "srv-408",
    name: "Klasik Dikdörtgen Servis Tabağı",
    category: "servis-sofra",
    subcategory: "servis-tabaklari",
    price: 219,
    stock: 73,
    rating: 4.5,
    reviewCount: 96,
    shortDescription:
      "Dikdörtgen servis tabağı; mezeler ve kahvaltılar için.",
    description:
      "Klasik Dikdörtgen Servis Tabağı, geniş kullanım yüzeyiyle kahvaltı ve meze servisleri için pratik bir çözümdür.",
    features: ["Geniş 32 × 18 cm yüzey", "Mat parlak ton"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "32 × 18 × 3 cm",
    tags: ["dikdortgen", "servis"],
  },
  {
    id: "srv-409",
    name: "Dokulu Dikdörtgen Servis Tabağı",
    category: "servis-sofra",
    subcategory: "servis-tabaklari",
    price: 309,
    stock: 42,
    rating: 4.7,
    reviewCount: 128,
    shortDescription:
      "Dokulu yüzeyli geniş servis tabağı.",
    description:
      "Dokulu Servis Tabağı; mezeler, peynir tabakları ve sıcak yemekler için zarif bir alternatif.",
    features: ["El yapımı doku", "Bulaşık makinesi uyumlu"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "34 × 18 × 3 cm",
    tags: ["dokulu", "servis"],
  },
  {
    id: "srv-410",
    name: "Oval Servis Kasesi",
    category: "servis-sofra",
    subcategory: "servis-tabaklari",
    price: 329,
    stock: 31,
    rating: 4.6,
    reviewCount: 105,
    shortDescription:
      "Salata ve sıcak servisler için oval form.",
    description:
      "Oval Servis Kasesi, dengeli oval formuyla salatalar ve sıcak servisler için zarif görünüm sunar.",
    features: ["2.4 L hacim", "Oval form"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "30 × 20 × 9 cm",
    tags: ["oval", "kase"],
  },
  {
    id: "srv-411",
    name: "Hava Sızdırmaz Su & Süt Sürahisi",
    category: "servis-sofra",
    subcategory: "surahi-karaf",
    price: 269,
    stock: 88,
    rating: 4.7,
    reviewCount: 219,
    shortDescription:
      "Akmaz hava sızdırmaz kapaklı buzdolabı dostu sürahi.",
    description:
      "Hava Sızdırmaz Sürahi, kapağı sayesinde buzdolabında diğer kokuları emmez. 2 litrelik hacmi ile günlük su, süt veya hazırlanmış içecekler için idealdir.",
    features: [
      "Hava sızdırmaz kapak",
      "Akmaz dökme ağzı",
      "Buzdolabı dostu narin form",
    ],
    materials: "BPA içermeyen Tritan™ benzeri plastik.",
    care: containerCare,
    dimensions: "12 × 12 × 28 cm · 2 L",
    tags: ["surahi", "su", "sut"],
    isBestSeller: true,
  },
  {
    id: "srv-412",
    name: "Ergonomik İçecek Sürahisi",
    category: "servis-sofra",
    subcategory: "surahi-karaf",
    price: 229,
    stock: 67,
    rating: 4.5,
    reviewCount: 137,
    shortDescription:
      "Tek elle kullanım için ergonomik kulplu sürahi.",
    description:
      "Ergonomik İçecek Sürahisi, kulp tasarımı ve dengeli ağırlığıyla kalabalık davetlerde rahat servis sunar.",
    features: [
      "Ergonomik kulp",
      "2.2 L hacim",
      "Cam görünümlü gövde",
    ],
    materials: "Saydam kompozit plastik.",
    care: containerCare,
    dimensions: "14 × 12 × 26 cm · 2.2 L",
    tags: ["surahi", "ergonomik"],
  },

  // ── Mutfak Aletleri ─────────────────────────────────────────────────
  {
    id: "alt-501",
    name: "Standlı Komple Mutfak Alet Seti",
    category: "mutfak-aletleri",
    subcategory: "spatula-kepce-setleri",
    price: 1199,
    originalPrice: 1499,
    stock: 21,
    rating: 4.9,
    reviewCount: 487,
    shortDescription:
      "7 parça silikon mutfak aleti ve stand; tek noktada düzen.",
    description:
      "Standlı Komple Mutfak Alet Seti; spatula, kepçe, kevgir, kaşık ve servis araçlarıyla mutfağınızda eksiksiz bir set sunar. Isıya dayanıklı silikon başlıklar tencerelerinizi çizmez.",
    features: [
      "7 parça komple alet",
      "Ahşap stand ile birlikte",
      "Isıya dayanıklı silikon başlık",
      "Bulaşık makinesi uyumlu",
    ],
    materials: "Silikon başlık, bambu sap, ahşap stand.",
    care: "Silikon kısımlar bulaşık makinesi uyumlu, ahşap saplar elde yıkanmalı.",
    dimensions: "Stand: Ø 14 × 30 cm",
    tags: ["set", "spatula", "stand"],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: "alt-502",
    name: "3'lü Ölçü Kabı Seti",
    category: "mutfak-aletleri",
    subcategory: "olcu-kaplari",
    price: 379,
    stock: 55,
    rating: 4.7,
    reviewCount: 198,
    shortDescription:
      "Geniş kulp, akmaz dökme ağzı ve net ölçü baskısı.",
    description:
      "3'lü Ölçü Kabı Seti; 250 ml, 500 ml ve 1 L hacimleriyle pişirme tariflerini hassas takip etmenizi sağlar. Net baskı ölçüleri yıkamayla silinmez.",
    features: [
      "0.25 / 0.5 / 1 L ölçüler",
      "Akmaz dökme ağız",
      "Ergonomik kulp",
      "Bulaşık makinesi uyumlu",
    ],
    materials: "BPA içermeyen şeffaf plastik.",
    care: standardCare,
    dimensions: "Set: 18 × 12 × 12 cm",
    tags: ["olcu", "set", "kase"],
  },
  {
    id: "alt-503",
    name: "Geniş Manuel Salata Kurutucu",
    category: "mutfak-aletleri",
    subcategory: "salata-kurutucular",
    price: 489,
    originalPrice: 569,
    stock: 28,
    rating: 4.8,
    reviewCount: 271,
    shortDescription:
      "Geniş hazneli salata kurutucu; tek hareketle sebzelerinizi kurutur.",
    description:
      "Geniş Manuel Salata Kurutucu, 5 litrelik kapasitesi ve sağlam ip mekanizmasıyla kalabalık sofralarda hız sağlar. Santrifüj iç haznesi servis kasesi olarak da kullanılabilir.",
    features: [
      "5 L hazne",
      "İpli santrifüj mekanizma",
      "Servis kasesi uyumu",
      "Kaymaz taban",
    ],
    materials: "BPA içermeyen kompozit.",
    care: standardCare,
    dimensions: "Ø 26 × 18 cm",
    tags: ["salata", "kurutucu"],
    isFeatured: true,
  },
  {
    id: "alt-504",
    name: "Silikon Buz Kalıbı Kapaklı",
    category: "mutfak-aletleri",
    subcategory: "olcu-kaplari",
    price: 169,
    stock: 198,
    rating: 4.6,
    reviewCount: 312,
    shortDescription:
      "Dökülmez kapaklı silikon buz kalıbı; eşit ve şeffaf buzlar.",
    description:
      "Silikon Buz Kalıbı, esnek silikon yapısı sayesinde buzları tek dokunuşla çıkarmanızı sağlar. Kapağı sayesinde diğer kokuları emmez ve istiflenebilir.",
    features: [
      "Esnek silikon yapı",
      "Hava sızdırmaz kapak",
      "Üst üste istiflenebilir",
      "21 buz kapasitesi",
    ],
    materials: "Gıda sınıfı silikon, BPA içermez kapak.",
    care: standardCare,
    dimensions: "22 × 12 × 4 cm",
    tags: ["buz", "silikon"],
  },

  // ── Mutfak Aksesuarları ─────────────────────────────────────────────
  {
    id: "aks-601",
    name: "Krom Kağıt Havluluk",
    category: "mutfak-aksesuarlari",
    subcategory: "havluluk-standlar",
    price: 199,
    originalPrice: 239,
    stock: 64,
    rating: 4.5,
    reviewCount: 154,
    shortDescription:
      "Tek elle kullanım için ağırlıklı tabanlı krom havluluk.",
    description:
      "Krom Kağıt Havluluk, ağırlıklı tabanı sayesinde tek elle havlu kopartmayı kolaylaştırır. Yatay kollu standı tezgâhınızda zarif duruş sergiler.",
    features: [
      "Ağırlıklı kaymaz taban",
      "Tek elle kopartma",
      "Krom kaplama görünüm",
    ],
    materials: "Metal gövde, krom kaplama.",
    care: metalCare,
    dimensions: "Ø 16 × 34 cm",
    tags: ["havluluk", "krom"],
  },
];

const ensureSlug = (s: string) => slugify(s);

export const products: Product[] = seeds.map((seed) => {
  const cat = categoryMap[seed.category];
  if (!cat) throw new Error(`Unknown category: ${seed.category}`);
  const sub = seed.subcategory
    ? cat.subcategories.find((x) => x.slug === seed.subcategory)
    : undefined;

  const images = pickImages(seed.category, seed.id + seed.name);
  const cover = images[0];
  const discountPercent = seed.originalPrice
    ? Math.round(
        ((seed.originalPrice - seed.price) / seed.originalPrice) * 100,
      )
    : undefined;

  return {
    id: seed.id,
    slug: ensureSlug(seed.name),
    name: seed.name,
    shortDescription: seed.shortDescription,
    description: seed.description,
    price: seed.price,
    originalPrice: seed.originalPrice,
    discountPercent,
    category: seed.category,
    categoryLabel: cat.label,
    subcategory: seed.subcategory,
    subcategoryLabel: sub?.label,
    brand: "Zest",
    sku: `ZST-${seed.id.toUpperCase()}`,
    stock: seed.stock,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    imageUrl: cover,
    images,
    tags: seed.tags ?? [],
    features: seed.features,
    materials: seed.materials,
    care: seed.care,
    dimensions: seed.dimensions,
    isNew: seed.isNew,
    isBestSeller: seed.isBestSeller,
    isFeatured: seed.isFeatured,
  } satisfies Product;
});

export const getProductById = (id: string) =>
  products.find((p) => p.id === id);

export const getProductsByCategory = (slug: string) =>
  products.filter((p) => p.category === slug);

export const getRelatedProducts = (product: Product, max = 4): Product[] => {
  const sameSub = products.filter(
    (p) =>
      p.id !== product.id &&
      p.subcategory &&
      p.subcategory === product.subcategory,
  );
  const sameCat = products.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const list of [sameSub, sameCat]) {
    for (const p of list) {
      if (out.length >= max) break;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
};

export const featuredProducts = products.filter((p) => p.isFeatured);
export const bestSellers = products.filter((p) => p.isBestSeller);
export const newArrivals = products.filter((p) => p.isNew);
export const discountedProducts = products.filter(
  (p) => (p.discountPercent ?? 0) > 0,
);
