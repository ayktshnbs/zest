"use client";

import { products } from "@/lib/mockData";
import { useCart } from "@/components/CartProvider";
import { Star, Shield, Truck, RefreshCw, Minus, Plus, ShoppingCart, ArrowLeft, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState("ozellikler");

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Breadcrumbs / Back */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12 flex items-center justify-between"
        >
          <Link 
            href="/shop" 
            className="inline-flex items-center gap-3 text-foreground/40 hover:text-primary font-bold text-xs uppercase tracking-[0.2em] transition-all group"
          >
            <div className="p-3 bg-white dark:bg-neutral-900 rounded-full shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all">
              <ArrowLeft size={18} />
            </div>
            Alışverişe Dön
          </Link>
          <div className="flex gap-3">
            <button className="p-3 bg-white dark:bg-neutral-900 rounded-full shadow-sm hover:text-primary transition-all">
              <Share2 size={18} />
            </button>
            <button 
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`p-3 rounded-full shadow-sm transition-all ${isWishlisted ? "bg-primary text-white" : "bg-white dark:bg-neutral-900 hover:text-primary"}`}
            >
              <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl bg-white dark:bg-neutral-900 group">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill
                className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                priority
              />
              <div className="absolute top-10 left-10">
                <span className="bg-secondary text-secondary-foreground px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                  {product.category}
                </span>
              </div>
            </div>
            
            {/* Thumbnails Placeholder */}
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`aspect-square rounded-3xl overflow-hidden cursor-pointer border-2 transition-all ${i === 1 ? "border-primary shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <Image src={product.imageUrl} alt={product.name} width={200} height={200} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 bg-secondary/10 px-3 py-1 rounded-full">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    className={i < product.rating ? "fill-secondary text-secondary" : "text-gray-300 dark:text-gray-700"} 
                  />
                ))}
              </div>
              <span className="text-foreground/40 font-bold text-xs uppercase tracking-widest">48 Değerlendirme</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-black text-foreground mb-4 tracking-tighter leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-10">
              <p className="font-display text-4xl font-black text-primary">
                {product.price} TL
              </p>
              <p className="text-foreground/30 line-through font-bold">{(product.price * 1.2).toFixed(0)} TL</p>
            </div>

            <p className="font-body text-xl text-foreground/60 mb-12 leading-relaxed font-medium italic">
              "{product.description}"
            </p>

            {/* Selection Tabs */}
            <div className="flex gap-8 border-b border-border mb-8">
              {["ozellikler", "materyal", "bakim"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? "text-primary" : "text-foreground/40 hover:text-foreground"}`}
                >
                  {tab === "ozellikler" ? "Özellikler" : tab === "materyal" ? "Materyal" : "Bakım"}
                  {activeTab === tab && (
                    <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="mb-12 min-h-[100px]">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-foreground/50 font-medium leading-relaxed"
                >
                  {activeTab === "ozellikler" && "Profesyonel mutfak gereçleri koleksiyonumuzun bu nadide parçası, hem estetik hem de fonksiyonellik arayanlar için tasarlandı. Uzun ömürlü kullanım ve üstün performans vaat eder."}
                  {activeTab === "materyal" && "En yüksek kalitede dövme çelik ve sürdürülebilir ceviz ağacı kullanılarak elde üretilmiştir. Paslanmaya karşı dirençli ve gıda ile temasa %100 uygundur."}
                  {activeTab === "bakim" && "Elde yıkanması tavsiye edilir. Her kullanımdan sonra kurulayarak ömrünü uzatabilirsiniz. Ahşap kısımları belirli aralıklarla doğal yağlar ile yağlamanız önerilir."}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-6 mb-16">
              <div className="flex items-center justify-between bg-accent rounded-3xl px-4 py-2 border-2 border-transparent focus-within:border-primary/20 transition-all sm:w-40">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-4 hover:text-primary transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-black">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-4 hover:text-primary transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              <button 
                onClick={handleAddToCart}
                className="flex-1 btn-primary py-6 text-lg tracking-widest uppercase"
              >
                <ShoppingCart size={24} />
                Sepete Ekle
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary-foreground">
                  <Truck size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Ücretsiz <br/>Kargo</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Shield size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Ömür Boyu <br/>Garanti</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-foreground/5 rounded-2xl text-foreground/60">
                  <RefreshCw size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Kolay <br/>İade</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

