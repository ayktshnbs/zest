import { Product } from "@/types";
import { categoryMap } from "./categories";
import { slugify } from "./utils";

interface ProductSeed {
  id: string;
  imageCount: number;
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

const woodCare =
  "Ahşap kapakları suya batırmayın; nemli bezle silin. Gövde elde yıkanır. Ahşap zaman zaman doğal yağ ile beslenmelidir.";

const seeds: ProductSeed[] = [
  // ── Doğrayıcılar & Rondolar ────────────────────────────────────────
  {
    id: "dor-m1",
    imageCount: 5,
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
    id: "dor-m2",
    imageCount: 5,
    name: "3 Bıçaklı Manuel Doğrayıcı",
    category: "dograyicilar",
    subcategory: "manuel-dograyicilar",
    price: 459,
    stock: 18,
    rating: 4.6,
    reviewCount: 187,
    shortDescription:
      "Sebzelerden cevize, üç farklı bıçakla çok amaçlı doğrayıcı.",
    description:
      "3 Bıçaklı Manuel Doğrayıcı, değiştirilebilir bıçak setiyle ince doğrama, jülyen ve püre haline getirme işlerini tek üründe sunar. Şeffaf haznesi ve dökme kapağıyla mutfakta ekstra alan kaplamaz.",
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
    id: "dor-m11",
    imageCount: 5,
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

  // ── Rendeler & Dilimleyiciler ─────────────────────────────────────
  {
    id: "rnd-m9",
    imageCount: 5,
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
    id: "rnd-m12",
    imageCount: 5,
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
    id: "rnd-m10",
    imageCount: 5,
    name: "Çok Yönlü Rende Seti",
    category: "rendeler-dilimleyiciler",
    subcategory: "cok-yonlu-rendeler",
    price: 559,
    originalPrice: 649,
    stock: 33,
    rating: 4.6,
    reviewCount: 203,
    shortDescription: "Dört farklı rende yüzeyi tek üründe.",
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
    id: "rnd-rev",
    imageCount: 5,
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
    isBestSeller: true,
  },

  // ── Saklama Kapları ──────────────────────────────────────────────
  {
    id: "skl-esk0001",
    imageCount: 5,
    name: "Uzun Boy Vakumlu Saklama Kavanozu",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 345,
    stock: 47,
    rating: 4.7,
    reviewCount: 198,
    shortDescription: "Spagetti, makarna ve uzun gıdalarınız için yüksek boy kavanoz.",
    description:
      "Uzun Boy Vakumlu Saklama Kavanozu, dar tabanlı uzun gövdesiyle makarna, spagetti ve uzun gıdaları eksiksiz saklamanıza imkân verir. Vakum kilidi tazeliği korur.",
    features: [
      "Uzun ince gövde",
      "Vakum kilitli kapak",
      "BPA içermez",
      "Şeffaf gövde içerik kontrolü",
    ],
    materials: "BPA içermeyen kompozit gövde, silikon conta.",
    care: containerCare,
    dimensions: "10 × 10 × 28 cm · 1.5 L",
    tags: ["uzun", "vakumlu", "kavanoz"],
  },
  {
    id: "skl-esk0002",
    imageCount: 5,
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
      "Bonny serisinin küçük boyu, baharat dolaplarınızda tasarrufla yer tutar. Vakum mekanizması ve istiflenebilir yapı küçük gıdalarınızı korur.",
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
    id: "skl-esk0003",
    imageCount: 5,
    name: "Bonny Vakumlu Saklama Kavanozu 0.9L",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 199,
    originalPrice: 249,
    stock: 86,
    rating: 4.7,
    reviewCount: 512,
    shortDescription:
      "Orta boy vakumlu saklama kavanozu kuru gıdalarınızı uzun süre taze tutar.",
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
    dimensions: "10 × 10 × 16 cm · 0.9 L",
    tags: ["vakumlu", "kavanoz", "saklama"],
    isBestSeller: true,
  },
  {
    id: "skl-esk0101",
    imageCount: 3,
    name: "Luxe Premium Vakumlu Kavanoz – Gold",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 279,
    originalPrice: 329,
    stock: 64,
    rating: 4.8,
    reviewCount: 428,
    shortDescription: "Saten dokulu premium gövde, mat altın detaylı kapak.",
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
    tags: ["premium", "vakumlu", "gold"],
    isNew: true,
    isFeatured: true,
  },
  {
    id: "skl-esk0102",
    imageCount: 3,
    name: "Luxe Premium Vakumlu Kavanoz – Gümüş",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 279,
    stock: 49,
    rating: 4.8,
    reviewCount: 263,
    shortDescription: "Saten dokulu gövde, mat gümüş tonlu kapak.",
    description:
      "Luxe Premium serisinin gümüş versiyonu, mutfağınıza dengeli bir nötr ton katar. Vakum sistemi sayesinde içeriği korur.",
    features: [
      "Saten dokulu gövde",
      "Mat gümüş vakum kapağı",
      "İstiflenebilir tasarım",
    ],
    materials: "BPA içermeyen kompozit gövde.",
    care: containerCare,
    dimensions: "10 × 10 × 16 cm · 1 L",
    tags: ["premium", "vakumlu", "gumus"],
    isNew: true,
  },
  {
    id: "skl-esk0103",
    imageCount: 3,
    name: "Luxe Premium Vakumlu Kavanoz – Roze",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 279,
    stock: 38,
    rating: 4.7,
    reviewCount: 184,
    shortDescription: "Saten dokulu gövde, modern roze altın kapak.",
    description:
      "Luxe Premium serisinin roze versiyonu, sıcak ve modern bir doku katar. Tezgâhlarda dekoratif şıklık sağlar.",
    features: [
      "Saten dokulu gövde",
      "Roze altın metalik vakum kapağı",
      "İstiflenebilir tasarım",
    ],
    materials: "BPA içermeyen kompozit gövde.",
    care: containerCare,
    dimensions: "10 × 10 × 16 cm · 1 L",
    tags: ["premium", "vakumlu", "roze"],
    isNew: true,
  },
  {
    id: "skl-esk0211",
    imageCount: 4,
    name: "Woody Ahşap Kapaklı Kavanoz 0.9L",
    category: "saklama-kaplari",
    subcategory: "ahsap-kapakli",
    price: 199,
    stock: 92,
    rating: 4.7,
    reviewCount: 198,
    shortDescription: "Doğal ahşap kapaklı kavanoz, sıcak Scandi dokunuşu.",
    description:
      "Woody Ahşap Kapaklı Kavanoz, doğal kayın ağacı kapağı ve silikon contası sayesinde hem dekoratif hem de işlevseldir. Açık raflarda sergilemek için idealdir.",
    features: [
      "Doğal kayın ağacı kapak",
      "Silikon hava sızdırmaz conta",
      "Cam görünümlü şeffaf gövde",
      "Açık rafta sergi uyumu",
    ],
    materials: "Cam görünümlü kompozit, kayın ağacı kapak.",
    care: woodCare,
    dimensions: "10 × 10 × 14 cm · 0.9 L",
    tags: ["ahsap", "scandi", "kavanoz"],
  },
  {
    id: "skl-esk0212",
    imageCount: 5,
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
    care: woodCare,
    dimensions: "12 × 12 × 20 cm · 1.4 L",
    tags: ["ahsap", "scandi", "kavanoz"],
  },
  {
    id: "skl-esk0213",
    imageCount: 4,
    name: "Woody Ahşap Kapaklı Kavanoz Mini",
    category: "saklama-kaplari",
    subcategory: "ahsap-kapakli",
    price: 159,
    stock: 108,
    rating: 4.6,
    reviewCount: 121,
    shortDescription:
      "Küçük boy ahşap kapaklı kavanoz; baharat ve atıştırmalık için.",
    description:
      "Woody serisinin küçük boyu, baharatlık olarak ya da atıştırmalıkları sergilemek için ideal şıklıkta bir tercihtir.",
    features: [
      "Doğal kayın ağacı kapak",
      "Silikon conta",
      "Küçük boy zarif gövde",
    ],
    materials: "Cam görünümlü kompozit, ahşap kapak.",
    care: woodCare,
    dimensions: "9 × 9 × 11 cm · 0.5 L",
    tags: ["ahsap", "mini", "kavanoz"],
  },
  {
    id: "skl-esk1001",
    imageCount: 5,
    name: "Kare Vakumlu Saklama Seti 3'lü",
    category: "saklama-kaplari",
    subcategory: "saklama-setleri",
    price: 749,
    originalPrice: 899,
    stock: 22,
    rating: 4.9,
    reviewCount: 318,
    shortDescription: "Üç farklı boyda hava sızdırmaz kare set.",
    description:
      "Kare Saklama Seti, üç farklı boyutu sayesinde mutfak dolabınızda eksiksiz bir saklama çözümü sunar. Aynı tabana sahip kapları üst üste istiflemek mümkün.",
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
    id: "skl-esk1101",
    imageCount: 3,
    name: "Crystal Şeffaf Hava Sızdırmaz Kap",
    category: "saklama-kaplari",
    subcategory: "cam-gorunumlu",
    price: 189,
    stock: 58,
    rating: 4.5,
    reviewCount: 142,
    shortDescription: "Cam görünümlü, kelebek kilitli pratik saklama kabı.",
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
    id: "skl-esk1211",
    imageCount: 5,
    name: "Tall Cam Görünümlü Vakumlu Kavanoz",
    category: "saklama-kaplari",
    subcategory: "vakumlu-kavanozlar",
    price: 269,
    stock: 47,
    rating: 4.7,
    reviewCount: 138,
    shortDescription: "Uzun boylu, dar tabanlı kavanoz; uzun gıdalar için.",
    description:
      "Tall serisinin uzun gövdesi, spagetti, makarna ve uzun ürünleri eksiksiz saklamanıza imkân verir. Vakum kilidi tazeliği korur.",
    features: ["Uzun gövde", "Vakum kapağı", "Şeffaf görünüm"],
    materials: "BPA içermeyen plastik, silikon conta.",
    care: containerCare,
    dimensions: "10 × 10 × 28 cm · 1.5 L",
    tags: ["uzun", "vakumlu"],
  },
  {
    id: "skl-m5",
    imageCount: 5,
    name: "Modüler Kapaklı Saklama Kabı 0.9L",
    category: "saklama-kaplari",
    subcategory: "dikdortgen-kaplar",
    price: 119,
    stock: 134,
    rating: 4.6,
    reviewCount: 221,
    shortDescription: "Siyah kapaklı, buzdolabına ergonomik sığan dikdörtgen kap.",
    description:
      "Modüler Saklama Kabı, dolap ölçülerine göre tasarlanmış formuyla yerden kazandırır. Şık siyah kapak detayı ve hava sızdırmaz contası ile yemekleri taze tutar.",
    features: [
      "Hava sızdırmaz kapak",
      "Buzdolabı dostu form",
      "Mikrodalga uyumlu",
      "İstiflenebilir",
    ],
    materials: "BPA içermeyen PP, silikon conta.",
    care: containerCare,
    dimensions: "18 × 14 × 7 cm · 0.9 L",
    tags: ["dikdortgen", "siyah-kapak"],
  },
  {
    id: "skl-m6",
    imageCount: 5,
    name: "Dikdörtgen Saklama Kabı Orta",
    category: "saklama-kaplari",
    subcategory: "dikdortgen-kaplar",
    price: 149,
    stock: 102,
    rating: 4.6,
    reviewCount: 174,
    shortDescription: "Orta boy dikdörtgen kap; günlük yemekler için.",
    description:
      "Aynı seriyle istiflenebilen orta boy dikdörtgen kap, günlük yemeklerinizi taze tutarken buzdolabınızda düzen sağlar.",
    features: [
      "1.2 L hacim",
      "Hava sızdırmaz kilit",
      "Mikrodalga uyumlu",
    ],
    materials: "PP gövde, silikon conta.",
    care: containerCare,
    dimensions: "20 × 14 × 8 cm · 1.2 L",
    tags: ["dikdortgen", "orta"],
  },
  {
    id: "skl-m7",
    imageCount: 5,
    name: "Dikdörtgen Saklama Kabı Büyük",
    category: "saklama-kaplari",
    subcategory: "dikdortgen-kaplar",
    price: 189,
    stock: 89,
    rating: 4.6,
    reviewCount: 152,
    shortDescription: "Geniş hacimli dikdörtgen kap; sebzeler ve hazır yemekler için.",
    description:
      "Geniş hacmiyle önceden hazırlanan yemekler ve sebzeler için ideal. Aynı seri tasarım bütünlüğü sunar.",
    features: ["1.8 L geniş hacim", "Hava sızdırmaz kilit", "Mikrodalga uyumlu"],
    materials: "PP gövde, silikon conta.",
    care: containerCare,
    dimensions: "24 × 16 × 8 cm · 1.8 L",
    tags: ["dikdortgen", "geniş"],
  },
  {
    id: "skl-m8",
    imageCount: 3,
    name: "3'lü Saklama Kabı Seti",
    category: "saklama-kaplari",
    subcategory: "saklama-setleri",
    price: 459,
    originalPrice: 549,
    stock: 35,
    rating: 4.8,
    reviewCount: 247,
    shortDescription:
      "Aynı seriyle uyumlu üç boy saklama kabı seti.",
    description:
      "3'lü Saklama Kabı Seti, küçük, orta ve büyük boyutuyla buzdolabı için eksiksiz çözüm sunar. Modüler istif tasarımı yer kazandırır.",
    features: ["0.9 L + 1.2 L + 1.8 L", "Modüler istif", "Hava sızdırmaz kilit"],
    materials: "PP gövde, silikon conta.",
    care: containerCare,
    dimensions: "Set: 24 × 16 × 20 cm",
    tags: ["set", "saklama"],
    isFeatured: true,
  },

  // ── Servis & Sofra ────────────────────────────────────────────────
  {
    id: "srv-kal0001",
    imageCount: 5,
    name: "Klasik Salata Kasesi Büyük",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 339,
    stock: 38,
    rating: 4.7,
    reviewCount: 156,
    shortDescription: "Geniş ağız ve derin formuyla servis dostu salata kasesi.",
    description:
      "Klasik Salata Kasesi, geniş ağız ve derin formuyla salata, makarna ve meyveleri sergilemek için tasarlandı. Mat parlak yüzeyi sofraya zarif bir hat katar.",
    features: ["3 L geniş hacim", "Mat parlak yüzey", "Bulaşık makinesi uyumlu"],
    materials: "Yüksek dirençli stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 28 × 12 cm",
    tags: ["salata", "kase", "buyuk"],
    isFeatured: true,
  },
  {
    id: "srv-kal0002",
    imageCount: 5,
    name: "Klasik Salata Kasesi Orta",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 259,
    stock: 64,
    rating: 4.6,
    reviewCount: 121,
    shortDescription: "Orta boy klasik kase; günlük servisler için ideal.",
    description:
      "Klasik kasenin orta boyu, günlük servislerinizi şıklaştırır. Set olarak diğer boylarla uyumlu kullanılabilir.",
    features: ["2 L hacim", "Aynı seri tasarım uyumu", "Mat parlak yüzey"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 24 × 10 cm",
    tags: ["salata", "kase"],
  },
  {
    id: "srv-kal0003",
    imageCount: 5,
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
    features: ["0.6 L hacim", "Aynı seri uyumu", "Mat parlak yüzey"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 14 × 7 cm",
    tags: ["cerez", "kase", "kucuk"],
  },
  {
    id: "srv-kal1001",
    imageCount: 5,
    name: "Dokulu Servis Kasesi Büyük",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 379,
    originalPrice: 449,
    stock: 26,
    rating: 4.8,
    reviewCount: 193,
    shortDescription: "El yapımı dokulu yüzey, doğal mat zemin.",
    description:
      "Dokulu Servis Kasesi, el yapımı izlenimi veren dokulu yüzeyi ve doğal mat zemin tonuyla minimalist sofralarda öne çıkar.",
    features: ["El yapımı doku", "Mat doğal ton", "3 L hacim", "Bulaşık makinesi uyumlu"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 28 × 12 cm",
    tags: ["dokulu", "kase", "buyuk"],
    isBestSeller: true,
  },
  {
    id: "srv-kal1002",
    imageCount: 5,
    name: "Dokulu Servis Kasesi Orta",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 309,
    stock: 51,
    rating: 4.7,
    reviewCount: 162,
    shortDescription: "Aynı seriden orta boy dokulu kase.",
    description:
      "Dokulu serinin orta boyu, salatalar ve sıcak yemekler için uyumlu sunum sunar.",
    features: ["El yapımı doku", "2 L hacim", "Mat doğal ton"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 24 × 10 cm",
    tags: ["dokulu", "kase"],
  },
  {
    id: "srv-kal1003",
    imageCount: 5,
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
    id: "srv-kas0001",
    imageCount: 5,
    name: "Klasik XXL Salata Kasesi",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 429,
    stock: 22,
    rating: 4.8,
    reviewCount: 142,
    shortDescription: "Davet sofraları için ekstra büyük klasik kase.",
    description:
      "Klasik serinin XXL boyu, kalabalık sofralar için tasarlandı. Geniş ağzı ile sunum dostudur.",
    features: ["4.5 L hacim", "Mat parlak yüzey", "Bulaşık makinesi uyumlu"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 32 × 14 cm",
    tags: ["xxl", "davet", "kase"],
  },
  {
    id: "srv-kas1001",
    imageCount: 5,
    name: "Dokulu XXL Servis Kasesi",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 489,
    stock: 16,
    rating: 4.9,
    reviewCount: 211,
    shortDescription: "Davet sofralarına özel ekstra büyük dokulu kase.",
    description:
      "Dokulu seriden XXL kase, kalabalık davet sofraları için tasarlandı. Geniş ağzı ile sunum dostudur.",
    features: ["4.5 L hacim", "Dokulu zarif yüzey", "Bulaşık makinesi uyumlu"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "Ø 32 × 14 cm",
    tags: ["xxl", "davet", "dokulu"],
    isFeatured: true,
  },
  {
    id: "srv-kau0001",
    imageCount: 5,
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
    id: "srv-kau1001",
    imageCount: 5,
    name: "Dokulu Dikdörtgen Servis Tabağı",
    category: "servis-sofra",
    subcategory: "servis-tabaklari",
    price: 309,
    stock: 42,
    rating: 4.7,
    reviewCount: 128,
    shortDescription: "Dokulu yüzeyli geniş servis tabağı.",
    description:
      "Dokulu Servis Tabağı; mezeler, peynir tabakları ve sıcak yemekler için zarif bir alternatif.",
    features: ["El yapımı doku", "Bulaşık makinesi uyumlu"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "34 × 18 × 3 cm",
    tags: ["dokulu", "servis"],
  },
  {
    id: "srv-kav0001",
    imageCount: 5,
    name: "Klasik Oval Servis Kasesi",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 329,
    stock: 31,
    rating: 4.6,
    reviewCount: 105,
    shortDescription: "Salata ve sıcak servisler için oval form.",
    description:
      "Klasik Oval Servis Kasesi, dengeli oval formuyla salatalar ve sıcak servisler için zarif görünüm sunar.",
    features: ["2.4 L hacim", "Oval form"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "30 × 20 × 9 cm",
    tags: ["oval", "kase"],
  },
  {
    id: "srv-kav1001",
    imageCount: 5,
    name: "Dokulu Oval Servis Kasesi",
    category: "servis-sofra",
    subcategory: "salata-kaseleri",
    price: 369,
    originalPrice: 429,
    stock: 19,
    rating: 4.8,
    reviewCount: 154,
    shortDescription: "Dokulu yüzeyli oval servis kasesi.",
    description:
      "Dokulu Oval Kase, salataları ve ana yemekleri zarif bir oval form ile servis etmenizi sağlar.",
    features: ["El yapımı doku", "2.4 L hacim", "Mat doğal ton"],
    materials: "Stoneware seramik.",
    care: standardCare,
    dimensions: "30 × 20 × 9 cm",
    tags: ["dokulu", "oval"],
  },
  {
    id: "srv-sua",
    imageCount: 5,
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
    features: ["Hava sızdırmaz kapak", "Akmaz dökme ağzı", "Buzdolabı dostu narin form"],
    materials: "BPA içermeyen Tritan™ benzeri plastik.",
    care: containerCare,
    dimensions: "12 × 12 × 28 cm · 2 L",
    tags: ["surahi", "su", "sut"],
    isBestSeller: true,
  },
  {
    id: "srv-suh",
    imageCount: 5,
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
    features: ["Ergonomik kulp", "2.2 L hacim", "Cam görünümlü gövde"],
    materials: "Saydam kompozit plastik.",
    care: containerCare,
    dimensions: "14 × 12 × 26 cm · 2.2 L",
    tags: ["surahi", "ergonomik"],
  },

  // ── Mutfak Aletleri ──────────────────────────────────────────────
  {
    id: "alt-kmn",
    imageCount: 5,
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
    care:
      "Silikon kısımlar bulaşık makinesi uyumlu, ahşap saplar elde yıkanmalı ve doğal yağ ile beslenmelidir.",
    dimensions: "Stand: Ø 14 × 30 cm",
    tags: ["set", "spatula", "stand"],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    id: "alt-kpg",
    imageCount: 5,
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
    id: "alt-m3",
    imageCount: 5,
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
    id: "soy-sol1",
    imageCount: 5,
    name: "Klasik Sebze Soyacağı",
    category: "mutfak-aletleri",
    subcategory: "soyacaklar",
    price: 89,
    stock: 142,
    rating: 4.6,
    reviewCount: 218,
    shortDescription:
      "Keskin paslanmaz çelik bıçaklı, ergonomik kavramalı sebze soyacağı.",
    description:
      "Klasik Sebze Soyacağı, dayanıklı paslanmaz çelik bıçağı ve kaymaz tutamağıyla günlük kullanım için pratik bir tercih. Patates, havuç ve elma için ideal.",
    features: [
      "Y formlu klasik tasarım",
      "Paslanmaz çelik bıçak",
      "Kaymaz silikon tutamak",
      "Bulaşık makinesinde yıkanabilir",
    ],
    materials: "Paslanmaz çelik bıçak, TPR tutamak.",
    care: metalCare,
    dimensions: "14 × 7 × 2 cm",
    tags: ["soyacak", "sebze", "klasik"],
  },
  {
    id: "soy-sol2",
    imageCount: 5,
    name: "Premium Çok Yönlü Soyacak",
    category: "mutfak-aletleri",
    subcategory: "soyacaklar",
    price: 129,
    originalPrice: 159,
    stock: 96,
    rating: 4.7,
    reviewCount: 184,
    shortDescription:
      "Çift bıçaklı, jülyen kesim özellikli premium soyacak.",
    description:
      "Premium Çok Yönlü Soyacak, klasik soyma ve jülyen kesim bıçaklarını tek üründe sunar. Patates gözü çıkartma aparatı ile çok amaçlıdır.",
    features: [
      "Çift fonksiyonlu bıçak",
      "Jülyen kesim seçeneği",
      "Patates gözü temizleme aparatı",
      "Ergonomik premium tutamak",
    ],
    materials: "Paslanmaz çelik bıçak, ABS tutamak.",
    care: metalCare,
    dimensions: "14 × 7 × 2 cm",
    tags: ["soyacak", "premium", "julyen"],
    isNew: true,
  },

  // ── Mutfak Aksesuarları ─────────────────────────────────────────
  {
    id: "aks-m4",
    imageCount: 5,
    name: "Silikon Buz Kalıbı Kapaklı",
    category: "mutfak-aksesuarlari",
    subcategory: "buz-kaliplari",
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
  {
    id: "aks-kag",
    imageCount: 5,
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

const buildImages = (id: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/products/${id}/${i}.jpg`);

const ensureSlug = (s: string) => slugify(s);

export const products: Product[] = seeds.map((seed) => {
  const cat = categoryMap[seed.category];
  if (!cat) throw new Error(`Unknown category: ${seed.category}`);
  const sub = seed.subcategory
    ? cat.subcategories.find((x) => x.slug === seed.subcategory)
    : undefined;

  const images = buildImages(seed.id, seed.imageCount);
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
    brand: "Zest Kitchene",
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
