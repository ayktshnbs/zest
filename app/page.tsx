"use client";

import { products } from "@/lib/mockData";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, ChevronRight, Sparkles, ShieldCheck, Zap, MousePointer2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

export default function Home() {
  const categories = [
    { name: "Doğrayıcılar & Rondolar", img: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800", count: "4 Ürün" },
    { name: "Saklama Kapları", img: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=800", count: "5 Ürün" },
    { name: "Rende Setleri", img: "https://images.unsplash.com/photo-1594833233514-469036980597?auto=format&fit=crop&q=80&w=800", count: "3 Ürün" },
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
    <main className="min-h-screen bg-background">
      {/* Hero Section - Cinematic Full Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Full Background Image with Cinematic Lighting */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Modern Kitchen" 
            fill
            className="object-cover opacity-60 md:mix-blend-luminosity scale-105"
            priority
            sizes="100vw"
          />
          {/* Multi-layered Cinematic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background z-10" />
          <div className="absolute inset-0 bg-black/40 z-10" />
          
          {/* Animated "Light Leak" Blobs - Reduced for Mobile Performance */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blob-gradient mix-blend-screen opacity-30 md:opacity-40 animate-blob" />
            <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] md:w-[700px] md:h-[700px] bg-blob-gradient mix-blend-screen opacity-20 md:opacity-30 animate-blob" style={{ animationDelay: '3s' }} />
          </div>
        </div>

        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] z-20 opacity-30" />
        
        <div className="max-w-7xl mx-auto px-5 md:px-16 relative z-30 w-full text-center">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 mb-10 inline-flex glass px-6 py-2.5 rounded-full border-white/10 shadow-glow mx-auto">
              <Sparkles size={14} className="text-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/80">Küratörlü Koleksiyon 2026</span>
            </div>
            
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-black leading-[0.95] mb-12 tracking-tighter text-text-primary drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
              Mutfakta <br />
              <span className="text-primary italic">Zest</span> <br />
              Dokunuşu.
            </h1>
            
            <p className="font-body text-lg md:text-2xl text-white/70 max-w-2xl mx-auto mb-16 leading-relaxed font-medium drop-shadow-lg">
              Mutfak gereçlerini sanat eserine dönüştüren, geleceğin tasarım diliyle harmanlanmış zamansız bir deneyim.
            </p>
            
            <div className="flex flex-wrap gap-6 justify-center">
              <Link 
                href="/shop"
                className="btn-primary min-w-[220px]"
              >
                Koleksiyonu Keşfet
                <ArrowRight size={20} className="transition-transform duration-400 group-hover:translate-x-2" />
              </Link>
              <Link 
                href="/about"
                className="btn-secondary min-w-[200px]"
              >
                Tasarım Vizyonu
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Cinematic Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 z-30"
        >
          <div className="w-[1px] h-20 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30 rotate-180 [writing-mode:vertical-lr]">Aşağı</span>
        </motion.div>
      </section>

      {/* Featured Grid - Large Whitespace */}
      <section className="py-32 md:py-48 px-5 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-32 items-center mb-48">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[4/5] rounded-[3rem] overflow-hidden group metallic-card border-none"
            >
              <Image 
                src="https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=1200" 
                alt="Premium Design" 
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-[2s] ease-luxury"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12 right-12">
                <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4 block">Tasarım Felsefesi</span>
                <h3 className="text-3xl font-black text-text-primary tracking-tighter mb-6">Minimalizm ve Güç.</h3>
                <Link href="/about" className="inline-flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest group/link">
                  Daha Fazla <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
            
            <div className="space-y-12">
              <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase block">Küratörlük</span>
              <h2 className="font-display text-5xl md:text-7xl font-black text-text-primary tracking-tighter leading-[1.05]">
                Her Detayda <br/>
                <span className="text-primary italic">Kusursuzluk.</span>
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed font-medium italic">
                "Mükemmellik detaylarda gizlidir. Biz bu detayları en yüksek kalite standartlarıyla birleştirerek size sunuyoruz."
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="space-y-4 p-8 bg-surface rounded-[2rem] border border-border">
                  <ShieldCheck size={24} className="text-primary" />
                  <h4 className="font-bold text-sm uppercase tracking-widest">Dayanıklılık</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">Nesiller boyu kullanım için tasarlanan materyaller.</p>
                </div>
                <div className="space-y-4 p-8 bg-surface rounded-[2rem] border border-border">
                  <Zap size={24} className="text-primary" />
                  <h4 className="font-bold text-sm uppercase tracking-widest">Ergonomi</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">Maksimum konfor ve verimlilik sunan tasarım dili.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Showcase - Clean Grid */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase mb-4 block">Seçkiler</span>
              <h2 className="font-display text-5xl md:text-6xl font-black text-text-primary tracking-tighter">Popüler <br/>Gereçler</h2>
            </div>
            <Link 
              href="/shop"
              className="group flex items-center gap-3 text-text-secondary font-black text-[10px] uppercase tracking-[0.3em] border-b border-primary/20 pb-2 hover:border-primary transition-all duration-400"
            >
              Tümünü Keşfet
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter - Centered Minimal */}
      <section className="py-32 md:py-48 px-5">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="w-16 h-px bg-primary mx-auto" />
          <h2 className="font-display text-4xl md:text-6xl font-black text-text-primary tracking-tighter">Ayrıcalıklı Deneyim İçin <br />Abone Olun</h2>
          <p className="text-text-secondary text-lg md:text-xl font-medium max-w-xl mx-auto">
            Yeni koleksiyonlar ve özel davetlerden haberdar olun.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto pt-8">
            <input 
              type="email" 
              placeholder="E-posta adresiniz" 
              className="flex-1 bg-surface border border-border rounded-full px-8 py-5 focus:outline-none focus:border-primary text-white font-medium placeholder:text-text-secondary/30 transition-all text-sm"
            />
            <button className="btn-primary px-10 py-5 text-xs tracking-widest uppercase">
              Abone Ol
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
