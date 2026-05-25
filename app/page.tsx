"use client";

import { products } from "@/lib/mockData";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, ChevronRight, PlayCircle, Sparkles, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

export default function Home() {
  const categories = [
    { name: "Profesyonel Bıçaklar", img: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800", count: "12 Ürün" },
    { name: "Döküm Tencereler", img: "https://images.unsplash.com/photo-1584947848229-45a44c00abf1?auto=format&fit=crop&q=80&w=800", count: "8 Ürün" },
    { name: "Artizan Sofra", img: "https://images.unsplash.com/photo-1591192801546-7037583ee3e8?auto=format&fit=crop&q=80&w=800", count: "15 Ürün" },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-5 md:px-16 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="z-10 py-12 lg:py-0"
          >
            <div className="flex items-center gap-2 mb-6 inline-flex bg-primary/5 px-4 py-2 rounded-full">
              <Sparkles size={16} className="text-primary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Yeni Koleksiyon 2026</span>
            </div>
            
            <h1 className="font-display text-6xl md:text-8xl font-black text-foreground leading-[0.95] mb-8 tracking-tighter">
              Mutfakta <br />
              <span className="text-primary italic relative">
                Kusursuzluk.
                <motion.span 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute bottom-2 left-0 h-2 bg-secondary/30 -z-10"
                />
              </span>
            </h1>
            
            <p className="font-body text-xl text-foreground/60 max-w-lg mb-12 leading-relaxed font-medium">
              Profesyonel şeflerin tercihi, ömür boyu dayanıklılık sunan ve mutfağınıza estetik katan yüksek performanslı gereçler.
            </p>
            
            <div className="flex flex-wrap gap-5">
              <Link 
                href="/shop"
                className="btn-primary px-12 py-6 text-lg group"
              >
                Koleksiyonu Keşfet
                <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link 
                href="/about"
                className="btn-secondary px-10 py-6 text-lg"
              >
                Hikayemiz
              </Link>
            </div>

            <div className="mt-16 flex items-center gap-8 border-t border-border pt-10">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-foreground tracking-tight">50k+</span>
                <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Mutlu Müşteri</span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-foreground tracking-tight">4.9/5</span>
                <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Müşteri Puanı</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative h-[500px] lg:h-[800px] w-full rounded-[4rem] overflow-hidden shadow-2xl bg-accent"
          >
            <Image 
              src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200" 
              alt="Premium Modern Kitchen" 
              fill
              className="object-cover transform hover:scale-105 transition-transform duration-[3s] ease-linear"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
            
            {/* Floating Card */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute bottom-12 left-12 glass p-6 rounded-[2rem] shadow-2xl flex items-center gap-5 z-20 max-w-xs border border-white/30"
            >
              <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-secondary-foreground shadow-lg">
                <Zap size={28} />
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider mb-0.5">En Hızlı Teslimat</p>
                <p className="text-xs text-foreground/60 font-medium italic">İstanbul içi aynı gün teslimat seçeneğiyle.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/2 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-secondary/5 rounded-full blur-[150px] -z-10" />
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-white dark:bg-neutral-950 border-y border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            {/* Placeholder for partner logos */}
            <div className="text-center font-display text-2xl font-black italic tracking-tighter">CULINARY PRO</div>
            <div className="text-center font-display text-2xl font-black italic tracking-tighter">KITCHEN AI</div>
            <div className="text-center font-display text-2xl font-black italic tracking-tighter">DESIGN WEEK</div>
            <div className="text-center font-display text-2xl font-black italic tracking-tighter">GASTRO MAG</div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-primary font-black tracking-[0.3em] text-xs uppercase mb-4 block">Koleksiyonlar</span>
              <h2 className="font-display text-5xl md:text-6xl font-black text-foreground tracking-tighter">Yaşam Tarzınıza <br/>Uygun Seçimler</h2>
            </div>
            <p className="text-foreground/50 font-medium max-w-sm italic">
              Her biri özel olarak tasarlanmış koleksiyonlarımızla mutfak deneyiminizi kişiselleştirin.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-10"
          >
            {categories.map((cat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Link
                  href="/shop"
                  className="group relative block aspect-[4/5] rounded-[3rem] overflow-hidden cursor-pointer shadow-premium hover:shadow-premium-hover transition-all duration-700 border border-transparent hover:border-primary/20"
                >
                  <Image 
                    src={cat.img} 
                    alt={cat.name} 
                    fill
                    className="object-cover transition-transform duration-[2s] group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-all duration-700" />
                  
                  <div className="absolute bottom-10 left-10 text-white z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-3 block">{cat.count}</span>
                    <h3 className="font-display text-3xl font-black mb-6 tracking-tight">{cat.name}</h3>
                    <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      Keşfet <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-32 bg-accent/30 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-primary font-black tracking-[0.3em] text-xs uppercase mb-4 block">Popüler Ürünler</span>
              <h2 className="font-display text-5xl md:text-6xl font-black text-foreground tracking-tighter">Modern Ev Şefi <br/>İçin Temel Parçalar</h2>
            </div>
            <Link 
              href="/shop"
              className="group flex items-center gap-3 text-foreground font-black text-xs uppercase tracking-[0.2em] border-b-2 border-primary/20 pb-2 hover:border-primary transition-all duration-500"
            >
              Tüm Ürünleri Gör
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-16 grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-premium">
            <Image 
              src="https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=1000" 
              alt="Kitchen Philosophy" 
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-primary font-black tracking-[0.3em] text-xs uppercase mb-4 block">Vizyonumuz</span>
            <h2 className="font-display text-5xl font-black text-foreground tracking-tighter mb-8 leading-[1.1]">
              Sadece Yemek Değil, <br/>
              <span className="text-primary italic underline decoration-secondary/30 underline-offset-8">Deneyim</span> Sunuyoruz.
            </h2>
            <p className="font-body text-xl text-foreground/60 mb-10 leading-relaxed font-medium italic">
              "İyi bir yemeğin sırrı, sadece kullanılan malzemelerde değil, onu hazırlarken hissedilen tutku ve kullanılan araçların kalitesindedir."
            </p>
            <div className="space-y-6">
              {[
                { icon: <ShieldCheck className="text-primary" />, title: "Sınırsız Garanti", desc: "Tüm döküm ve çelik ürünlerimizde ömür boyu garanti." },
                { icon: <Zap className="text-secondary" />, title: "Ergonomik Tasarım", desc: "Elinize tam oturan, yormayan profesyonel dizayn." }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="p-4 bg-accent rounded-3xl h-fit">{item.icon}</div>
                  <div>
                    <h4 className="font-display font-bold text-lg text-foreground mb-1">{item.title}</h4>
                    <p className="text-foreground/50 text-sm font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 px-5 md:px-16">
        <div className="max-w-7xl mx-auto bg-neutral-950 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-6xl font-black mb-8 text-white tracking-tighter">Ayrıcalıklardan <br/>Haberdar Olun</h2>
            <p className="text-neutral-400 font-body text-xl mb-12 max-w-xl mx-auto font-medium">
              Yeni ürünler, sınırlı sayıda üretilen renkler ve özel etkinliklerden ilk siz haberdar olun.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <input 
                type="email" 
                placeholder="E-posta adresiniz" 
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-10 py-6 focus:outline-none focus:ring-2 focus:ring-primary text-white font-medium placeholder:text-neutral-600 transition-all text-lg"
              />
              <button className="bg-primary text-white font-black px-12 py-6 rounded-full hover:bg-primary-600 transition-all text-lg uppercase tracking-widest active:scale-95 shadow-xl shadow-primary/20">
                Abone Ol
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}


