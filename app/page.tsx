"use client";

import { products } from "@/lib/mockData";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, ChevronRight, Sparkles, ShieldCheck, Zap, MousePointer2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
    <main className="min-h-screen bg-background relative">
      {/* Apple-Style Light Hero Section with Background Image */}
      <section ref={heroRef} className="relative min-h-dvh flex items-start md:items-center justify-center overflow-hidden bg-[#f5f5f7] pt-24 md:pt-0">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80&w=2000" 
            alt="Modern Kitchen Essentials Background" 
            fill
            className="object-cover opacity-60 md:opacity-80 contrast-[1.05] saturate-[1.05]"
            priority
          />
        </div>

        <motion.div 
          style={{ y: textY, opacity: textOpacity }}
          className="max-w-7xl mx-auto px-5 md:px-16 relative z-10 w-full text-center"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ 
              y: [30, 0],
              opacity: 0.85,
            }}
            transition={{ 
              duration: 1, 
              ease: [0.16, 1, 0.3, 1],
            }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <h1 className="font-audiowide text-3xl sm:text-4xl md:text-7xl lg:text-8xl leading-[1.1] mb-6 tracking-tight text-[#1d1d1f]">
                Pro-Level Tools.<br />
                <span className="text-[#1d1d1f]/60">Effortless Cooking.</span>
              </h1>

              <p className="font-body text-base sm:text-xl md:text-2xl text-[#1d1d1f]/60 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
                Collection of modern kitchen essentials beautifully arranged for a minimalist luxury experience.
              </p>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/shop"
                className="w-full sm:w-auto px-10 py-4 bg-[#1d1d1f] text-white font-audiowide text-[10px] sm:text-[12px] tracking-[0.2em] uppercase rounded-full hover:bg-black transition-all duration-300 shadow-xl shadow-black/10"
              >
                Buy Now
              </Link>
              <Link 
                href="/shop"
                className="w-full sm:w-auto px-10 py-4 bg-white/50 backdrop-blur-md text-[#1d1d1f] font-audiowide text-[10px] sm:text-[12px] tracking-[0.2em] uppercase rounded-full hover:bg-white/80 transition-all duration-300 flex items-center justify-center gap-2 border border-black/5"
              >
                Learn more <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Grid - Scandinavian Minimal */}
      <section className="py-20 md:py-48 px-5 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 md:mb-24 gap-8 text-center md:text-left">
            <div className="space-y-6 w-full md:w-auto">
              <span className="text-black/30 font-audiowide text-[9px] uppercase tracking-[0.4em] block">Küratörlük</span>
              <h2 className="text-4xl md:text-6xl font-audiowide text-black tracking-tighter leading-[1.1]">Üstün Performans <br className="hidden md:block"/>Ve Minimalizm.</h2>
            </div>
            <Link 
              href="/shop"
              className="mx-auto md:mx-0 font-audiowide text-[10px] uppercase tracking-[0.3em] text-black border-b border-black/10 pb-2 hover:border-black transition-all"
            >
              Tümünü Gör
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-20">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Quote / Philosophy Section */}
      <section className="py-32 md:py-48 px-5 bg-[#f9fafb]">
        <div className="max-w-3xl mx-auto text-center px-4">
          <p className="font-body text-xl md:text-3xl text-black leading-relaxed font-light italic">
            "Mükemmellik, eklenecek bir şey kalmadığında değil, çıkarılacak bir şey kalmadığında elde edilir."
          </p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="w-12 h-px bg-black/10" />
            <span className="font-audiowide text-[9px] uppercase tracking-[0.5em] text-black/30">Zest Philosophy</span>
          </div>
        </div>
      </section>

      {/* Newsletter - Centered Minimal */}
      <section className="py-24 md:py-48 px-5 bg-white border-t border-black/5">
        <div className="max-w-4xl mx-auto text-center space-y-12 md:space-y-16">
          <h2 className="font-audiowide text-2xl md:text-5xl text-black tracking-tight uppercase">Abone Olun</h2>
          <p className="text-black/50 text-base md:text-xl max-w-xl mx-auto font-light">
            Yeni koleksiyonlar ve özel davetlerden haberdar olun. Minimalist yaşam tarzını mutfağınıza taşıyın.
          </p>
          <form className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto pt-4 md:pt-8 border-b border-black">
            <input 
              type="email" 
              placeholder="E-posta adresiniz" 
              className="flex-1 bg-transparent px-0 py-5 focus:outline-none text-black font-light placeholder:text-black/20 text-base md:text-lg"
            />
            <button className="py-5 text-[10px] font-audiowide tracking-[0.3em] uppercase text-black hover:opacity-50 transition-opacity text-right">
              Gönder
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
