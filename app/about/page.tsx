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
              Ev için
              <br />
              daha iyisi.
            </h1>
            <p lang="en" className="font-audiowide text-sm md:text-base uppercase tracking-[0.35em] text-foreground/40">
              Better for the home.
            </p>
            <div className="space-y-5 text-foreground/70 text-base md:text-lg leading-relaxed font-body max-w-xl pt-4">
              <p>
                Evde geçirilen zamanı daha iyi hale getirmek için.
                Zest Home, günlük yaşamı kolaylaştıran, düzeni destekleyen ve yaşam alanlarına değer katan ürünler sunma fikriyle doğdu.
              </p>
              <p>
                Ev, yalnızca yaşadığımız bir yer değil; günün başladığı, dinlendiğimiz, sevdiklerimizle vakit geçirdiğimiz ve anılar biriktirdiğimiz alandır.
                Bu yüzden ürünlerimizin yalnızca işlevsel değil, aynı zamanda yaşam alanlarının doğal bir parçası olmasına önem veriyoruz.
                Her koleksiyonumuzda sadelik, kalite ve kullanım kolaylığını bir araya getirerek evin farklı köşelerinde ihtiyaç duyulan çözümler geliştirmeyi hedefliyoruz.
              </p>
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
                src="/products/rnd-m1/7.jpg"
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
              01
            </p>
            <h2 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight text-foreground leading-tight">
              Yaklaşımımız
            </h2>
            <p lang="en" className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30 mt-3">
              Tasarımın amacı hayatı kolaylaştırmaktır.
            </p>
          </div>
          <div className="lg:col-span-8 space-y-6 text-foreground/70 text-base md:text-lg leading-relaxed font-body">
            <p>
              Bizim için iyi bir ürün yalnızca güzel görünmekten ibaret değildir.
              İyi bir ürün, yaşam alanına değer katar ve günlük yaşamı kolaylaştırır.
              Bu nedenle ürünlerimizi geliştirirken aşağıdaki kriterleri göz önünde bulunduruyoruz:
            </p>
            <ul className="space-y-3 pt-2 border-l border-foreground/15 pl-6">
              <li className="flex items-start gap-3">
                <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 mt-1.5 shrink-0">01</span>
                <span>Günlük kullanımı kolaylaştırmalıdır.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 mt-1.5 shrink-0">02</span>
                <span>Uzun süre güvenle kullanılmalıdır.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 mt-1.5 shrink-0">03</span>
                <span>Yaşam alanına uyum sağlamalıdır.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 mt-1.5 shrink-0">04</span>
                <span>Hem işlevsel hem estetik bir deneyim sunmalıdır.</span>
              </li>
            </ul>
            <p className="pt-2">
              Bu anlayışla geliştirdiğimiz her ürün, estetik ve işlevsellik arasında dengeli bir deneyim sunmak üzere seçilir.
            </p>
          </div>
        </section>

        {/* Production journey */}
        <section className="mb-20 md:mb-40">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-12 md:mb-16">
            <div className="lg:col-span-4">
              <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
                02
              </p>
              <h2 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight text-foreground leading-tight">
                Ne İçin Çalışıyoruz?
              </h2>
              <p lang="en" className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/30 mt-3">
                Daha düzenli, daha konforlu yaşam alanları.
              </p>
            </div>
            <p className="lg:col-span-8 text-foreground/70 text-base md:text-lg leading-relaxed font-body">
              Zest Home olarak amacımız yalnızca ürün sunmak değil,
              insanların evlerinde geçirdiği zamanı daha keyifli hale getirmektir.
              Mutfaktan yemek masasına,
              saklama çözümlerinden günlük yaşam ürünlerine kadar uzanan koleksiyonlarımızla evin her alanında yer almayı hedefliyoruz.
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

        {/* Vizyonumuz */}
        <section className="mb-28 md:mb-40 grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
              03 · Vizyonumuz
            </p>
            <h2 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight text-foreground leading-tight">
              Modern yaşam için tasarlanmış ürünler.
            </h2>
          </div>

          <div className="lg:col-span-8 relative">
            <div className="absolute -left-3 top-0 hidden md:block h-full w-px bg-foreground/15" />
            <p className="text-foreground/70 text-base md:text-lg leading-relaxed font-body max-w-2xl md:pl-6">
              Günümüz yaşamının değişen ihtiyaçlarını takip ediyor,
              işlevsellik ve estetiği bir araya getiren ürünlerle koleksiyonumuzu sürekli geliştiriyoruz.
              Hedefimiz, kaliteli tasarım anlayışını erişilebilir hale getirerek Zest Home&apos;u ev yaşamı kategorisinde
              güven duyulan ve tercih edilen bir marka haline getirmektir.
            </p>
          </div>
        </section>

        {/* Closing band */}
        <section className="relative overflow-hidden border border-foreground/10">
          <div className="absolute inset-0 bg-foreground" />
          <div className="relative z-10 py-16 md:py-24 px-6 md:px-16 text-center">
            <p
              lang="en"
              className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-background/50"
            >
              Better for the home
            </p>
            <h2 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight text-background mt-4 mb-8 leading-[1.05]">
              Ev için
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
