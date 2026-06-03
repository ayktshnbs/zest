"use client";

import { CheckCircle2, Award, Users, Heart, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutPage() {
  const stats = [
    { label: "Yıllık Deneyim", value: "10+", icon: <Award size={28} /> },
    { label: "Mutlu Müşteri", value: "50k+", icon: <Users size={28} /> },
    { label: "Ürün Çeşidi", value: "200+", icon: <Heart size={28} /> },
    { label: "Hızlı Teslimat", value: "24 Saat", icon: <CheckCircle2 size={28} /> },
  ];

  return (
    <main className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-6 inline-flex bg-primary/5 px-4 py-2 rounded-full">
              <Sparkles size={16} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Hikayemiz</span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl font-black text-foreground mb-10 leading-[0.95] tracking-tighter">
              Mutfak Tutkusunu <br/>
              <span className="text-primary italic underline decoration-secondary/30 underline-offset-8">Sanata</span> Dönüştürüyoruz.
            </h1>
            <p className="font-body text-xl text-foreground/60 mb-8 leading-relaxed font-medium">
              Zest Kitchene olarak yolculuğumuz, modern mutfakların vazgeçilmezi olan pratik ve estetik gereçleri en yüksek kalite standartlarıyla buluşturma vizyonuyla başladı.
            </p>
            <p className="font-body text-lg text-foreground/50 mb-12 leading-relaxed italic">
              Koleksiyonumuzdaki her bir ürün, mutfaktaki işlerinizi kolaylaştırırken yaşam alanınıza değer katmak için özenle seçilmiştir.
            </p>
            
            <div className="grid grid-cols-2 gap-8">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-6 bg-white dark:bg-neutral-900 rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="text-primary mb-4">{stat.icon}</div>
                  <div className="text-3xl font-black text-foreground tracking-tighter mb-1">{stat.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl"
          >
            <Image 
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1200" 
              alt="Zest Kitchene Mutfak"
              fill
              className="object-cover transition-transform duration-[3s] hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none" />
          </motion.div>
        </div>

        {/* Mission & Vision */}
        <section className="bg-neutral-950 text-white rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-0" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex p-4 bg-white/10 rounded-3xl mb-8">
              <Target size={32} className="text-secondary" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-10 tracking-tighter">Misyonumuz & Vizyonumuz</h2>
            <div className="w-20 h-1.5 bg-secondary mx-auto mb-12 rounded-full" />
            <p className="font-body text-2xl text-neutral-300 mb-16 italic leading-relaxed">
              "Amacımız, her evin kalbi olan mutfakları, hem profesyonel hem de hobi şefleri için ilham verici alanlara dönüştürmek."
            </p>
            
            <div className="grid md:grid-cols-2 gap-16 text-left">
              <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="font-display font-black text-xl mb-6 text-secondary uppercase tracking-widest">Kalite Standartımız</h4>
                <p className="text-neutral-400 font-medium leading-relaxed">Ürünlerimizde dayanıklılık ve estetiği ön planda tutuyoruz. Fonksiyonel tasarımları, en iyi kullanıcı deneyimi için modernize ediyoruz.</p>
              </div>
              <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="font-display font-black text-xl mb-6 text-secondary uppercase tracking-widest">Müşteri Memnuniyeti</h4>
                <p className="text-neutral-400 font-medium leading-relaxed">Zest Kitchene ailesi olarak, alışveriş öncesi ve sonrası süreçlerde her zaman yanınızdayız. Sorunsuz teslimat ve hızlı destek temel önceliğimizdir.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
