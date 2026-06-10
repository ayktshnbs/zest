"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Factory,
  Sparkles,
  Hammer,
  PackageCheck,
  Truck,
} from "lucide-react";

const productionSteps = [
  {
    n: "01",
    title: "Tasarım",
    en: "Design",
    icon: Sparkles,
    body: "Her ürün; günlük mutfak ritüellerini gözleyen tasarım ekibimizin eskizleriyle hayata başlar.",
  },
  {
    n: "02",
    title: "Kalıp",
    en: "Mould",
    icon: Hammer,
    body: "Kendi kalıphanemizde, mikron hassasiyetinde işlenen çelik kalıplar, seri üretime hazırlanır.",
  },
  {
    n: "03",
    title: "Enjeksiyon",
    en: "Injection",
    icon: Factory,
    body: "Gıdayla temasa uygun granüller, modern enjeksiyon hattımızda gövdeye dönüşür.",
  },
  {
    n: "04",
    title: "Montaj",
    en: "Assembly",
    icon: PackageCheck,
    body: "Bıçaklar, contalar, kapaklar; el işçiliğiyle birleşip kalite kontrolünden geçer.",
  },
  {
    n: "05",
    title: "Sevkiyat",
    en: "Shipping",
    icon: Truck,
    body: "Ürünler depodan çıkmadan önce son bir denetimle paketlenir ve yola çıkar.",
  },
];

const timeline = [
  {
    year: "2009",
    title: "Mühendislik Mirası",
    en: "Engineering heritage",
    body: "Plastik enjeksiyon kalıpçılığı ve hassas parça üretimiyle yola çıktık. Mutfağı şekillendiren teknik birikim burada toplandı.",
  },
  {
    year: "2022",
    title: "Zest Home Doğuyor",
    en: "Birth of Zest Home",
    body: "Atölyenin bilgi birikimini modern mutfak sahnesine taşıdık. Pratik, estetik ve dayanıklı gereçler bir markada birleşti.",
  },
  {
    year: "Bugün",
    title: "Genişleyen Sofra",
    en: "Today",
    body: "40'tan fazla ürün ailesi, 20'yi aşkın ülkede sofralarda. Her sezon yeni tasarımlarla portföyümüzü büyütüyoruz.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-28 md:pt-40 pb-24 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Breadcrumb */}
        <div className="mb-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-audiowide text-foreground/40">
          <Link href="/" className="hover:text-foreground transition-colors">
            Anasayfa
          </Link>
          <span>/</span>
          <span className="text-foreground/70">Hikayemiz</span>
        </div>

        {/* Hero */}
        <section className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-28 md:mb-40">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="lg:col-span-7 space-y-8"
          >
            <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40">
              Hikayemiz · <span lang="en">Our Story</span>
            </p>
            <h1 className="font-audiowide text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight text-foreground leading-[1.05]">
              Mutfak için
              <br />
              daha iyisi.
            </h1>
            <p lang="en" className="font-audiowide text-sm md:text-base uppercase tracking-[0.35em] text-foreground/40">
              Better for the kitchen.
            </p>
            <p className="text-foreground/60 text-base md:text-lg max-w-2xl leading-relaxed">
              Zest Home; mühendislik atölyesinden doğan, mutfak sahnesine
              taşınan bir markadır. Bıçağı tutan ele, tezgâhın üzerine, kapağın
              tıkırtısına kadar her detayı tasarlıyor; tasarımdan sevkiyata kadar
              her aşamayı kendi çatımız altında üretiyoruz.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] border border-foreground/15 px-3 py-1.5 text-foreground/60">
                Since 2009
              </span>
              <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] border border-foreground/15 px-3 py-1.5 text-foreground/60">
                In-House Production
              </span>
              <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] border border-foreground/15 px-3 py-1.5 text-foreground/60">
                ISO Certified
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-secondary/30">
              <Image
                src="/products/srv-kal1001/0.jpg"
                alt="Zest Home atölyesinden bir kare"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p
                  lang="en"
                  className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-white/70"
                >
                  Crafted in our own facility
                </p>
                <p className="font-audiowide text-sm uppercase tracking-[0.3em] text-white mt-1">
                  Tek çatı altında üretim
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Narrative */}
        <section className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-28 md:mb-40">
          <div className="lg:col-span-4">
            <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
              01 · Köken
            </p>
            <h2 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight text-foreground leading-tight">
              Atölyeden
              <br />
              sofraya.
            </h2>
            <p lang="en" className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30 mt-3">
              From workshop to table
            </p>
          </div>
          <div className="lg:col-span-8 space-y-6 text-foreground/65 text-base md:text-lg leading-relaxed">
            <p>
              Yolculuğumuz, plastik enjeksiyon kalıpçılığında geçirdiğimiz uzun
              yıllarda yoğrulan teknik birikimle başladı. Sanayi parçası üreten
              bir ekipten, evlerin en samimi alanı olan mutfağa geçmek; tasarım
              disiplinimizi ve ölçüm hassasiyetimizi yeni bir dile çevirmek
              demekti.
            </p>
            <p>
              2022'de bu birikimi Zest Home markasıyla bir araya getirdik.
              Doğrayıcılardan saklama kaplarına, rendelerden servis tabaklarına
              uzanan ürün ailemizi; günlük kullanımda yıpranmayan, tezgâhın
              üzerinde sade durmayı bilen, elinize doğal yerleşen detaylarla
              tasarlıyoruz.
            </p>
            <p>
              Üretimin her adımı — tasarım, kalıp, enjeksiyon, montaj, paketleme —
              kendi tesislerimizde gerçekleşiyor. Bu, hem üzerinde durduğumuz
              kalite standardını korumamızı, hem de yeni bir fikri günler içinde
              denenebilir bir prototipe dönüştürmemizi sağlıyor.
            </p>
          </div>
        </section>

        {/* Production journey */}
        <section className="mb-28 md:mb-40">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <div>
              <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
                02 · Üretim Yolculuğu
              </p>
              <h2 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight text-foreground leading-tight">
                Beş aşama, bir çatı.
              </h2>
              <p lang="en" className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30 mt-3">
                Five stages, one roof
              </p>
            </div>
            <p className="text-foreground/50 text-sm md:text-base max-w-md leading-relaxed">
              Bir Zest Home ürünü, sizin elinize ulaşana kadar bizimle beş
              durakta buluşur. Hepsi de aynı kapının altında.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-foreground/10 border border-foreground/10">
            {productionSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-background p-7 flex flex-col gap-6 min-h-[260px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-audiowide text-xs tracking-[0.3em] text-foreground/30">
                      {step.n}
                    </span>
                    <Icon size={18} strokeWidth={1.5} className="text-foreground/70" />
                  </div>
                  <div>
                    <h3 className="font-audiowide text-base uppercase tracking-[0.25em] text-foreground">
                      {step.title}
                    </h3>
                    <p lang="en" className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/30 mt-1">
                      {step.en}
                    </p>
                  </div>
                  <p className="text-foreground/55 text-sm leading-relaxed">
                    {step.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-28 md:mb-40">
          <div className="mb-10 md:mb-14">
            <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
              03 · Zaman Çizelgesi
            </p>
            <h2 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight text-foreground leading-tight">
              Üç durak, tek çizgi.
            </h2>
          </div>

          <ol className="relative border-l border-foreground/15 pl-8 md:pl-12 space-y-12">
            {timeline.map((t, i) => (
              <motion.li
                key={t.year}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative"
              >
                <span className="absolute -left-[37px] md:-left-[49px] top-1.5 w-2.5 h-2.5 rounded-full bg-foreground" />
                <div className="grid md:grid-cols-12 gap-4 md:gap-10">
                  <div className="md:col-span-3">
                    <div className="font-audiowide text-2xl md:text-3xl tracking-tight text-foreground">
                      {t.year}
                    </div>
                    <p
                      lang="en"
                      className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/30 mt-1"
                    >
                      {t.en}
                    </p>
                  </div>
                  <div className="md:col-span-9">
                    <h3 className="font-audiowide text-sm uppercase tracking-[0.3em] text-foreground mb-3">
                      {t.title}
                    </h3>
                    <p className="text-foreground/60 text-base leading-relaxed">
                      {t.body}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Closing band */}
        <section className="relative overflow-hidden border border-foreground/10">
          <div className="absolute inset-0 bg-foreground" />
          <div className="relative z-10 py-16 md:py-24 px-6 md:px-16 text-center">
            <p
              lang="en"
              className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-background/50"
            >
              Better for the kitchen
            </p>
            <h2 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight text-background mt-4 mb-8 leading-[1.05]">
              Mutfak için
              <br />
              daha iyisi.
            </h2>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 border border-background/30 px-6 py-3 font-audiowide text-[11px] uppercase tracking-[0.3em] text-background hover:bg-background hover:text-foreground transition-colors"
            >
              Koleksiyonu Keşfet
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
