import { products } from "@/lib/mockData";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, PlayCircle } from "lucide-react";

export default function Home() {
  const categories = [
    { name: "Profesyonel Bıçaklar", img: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800", color: "bg-primary/5" },
    { name: "Yapışmaz Tavalar", img: "https://images.unsplash.com/photo-1584947848229-45a44c00abf1?auto=format&fit=crop&q=80&w=800", color: "bg-secondary/5" },
    { name: "Seramik Tabaklar", img: "https://images.unsplash.com/photo-1591192801546-7037583ee3e8?auto=format&fit=crop&q=80&w=800", color: "bg-stone-dark/5" },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#fdf9e9]">
        <div className="max-w-7xl mx-auto px-5 md:px-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 py-12 lg:py-0">
            <h1 className="font-display text-5xl md:text-7xl font-extrabold text-[#1c1c13] leading-[1.1] mb-6">
              Modern Mutfak için <br />
              <span className="text-[#b80035] italic">Hassas Araçlar.</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-[#5c3f40] max-w-lg mb-10 leading-relaxed">
              Dayanıklılık ve stil için tasarlanmış, özenle seçilmiş, yüksek performanslı mutfak gereçleri. Evinizi güzelleştiren, toksik olmayan, profesyonel kalitedeki temel parçalarımızı keşfedin.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#products"
                className="bg-[#b80035] hover:bg-[#e11d48] text-white font-body font-bold px-10 py-5 rounded-full shadow-lg shadow-[#b80035]/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
              >
                Mağazayı Keşfet
                <ArrowRight size={20} />
              </a>
              <button className="flex items-center gap-2 border-2 border-[#1c1c13]/10 hover:bg-white text-[#1c1c13] font-body font-bold px-8 py-5 rounded-full transition-all active:scale-95">
                Koleksiyonları Gör
              </button>
            </div>
          </div>

          <div className="relative h-[400px] lg:h-[700px] w-full rounded-2xl md:rounded-[4rem] overflow-hidden shadow-2xl bg-[#f2eede]">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpba4E8ONEz0YC0RiMcJuYKqomh30K4Uq2gYMMaXMHLgj6r98lJllBZIjQsMUT8xMqDIt8xGZuumHEiWHdmorLBab16nls80B6WRWHjc99-_gMc6vP1CBlexP6i_HbQy51I8iXNvcQF-rJ1K_lGvo3D0a7ZwOYKhl4lWYx9g7hXX5ePNIJodE87XDfCdVSz8iVKA8wU68eKfxV1kW4_zW3kTK1-LHM-hhY_h-IZw2f2P7AdcDfj2wOGuWo5-q31OT26B7tctIoUQg" 
              alt="Beautiful Modern Kitchen" 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1c1c13]/20 to-transparent pointer-events-none" />
          </div>
        </div>
        
        {/* Decorative Blur */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#ffdf9f]/30 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-12 right-12 w-96 h-96 bg-[#ffdada]/20 rounded-full blur-[120px] -z-10" />
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-[#1c1c13]">Kategoriye Göre Alışveriş</h2>
            <div className="w-20 h-1.5 bg-[#ffc329] mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <div 
                key={i}
                className="group relative h-[450px] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c13]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="font-display text-2xl font-bold mb-2">{cat.name}</h3>
                  <div className="flex items-center gap-2 font-bold text-sm text-[#ffc329] group-hover:gap-4 transition-all">
                    Koleksiyonu Gör <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-24 bg-[#f2eede]">
        <div className="max-w-7xl mx-auto px-5 md:px-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <span className="text-[#b80035] font-bold tracking-widest text-sm uppercase mb-3 block">En Çok Satanlar</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-[#1c1c13]">Modern Ev Şefi İçin Temel Parçalar</h2>
            </div>
            <button className="text-[#1c1c13] font-bold border-b-2 border-[#ffc329] pb-1 hover:text-[#b80035] hover:border-[#b80035] transition-all">
              Tüm Ürünleri Gör
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-[#b80035] text-white">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="font-display text-4xl font-bold mb-6">Ayrıcalıklardan Haberdar Olun</h2>
          <p className="text-white/80 font-body text-lg mb-10 max-w-xl mx-auto">
            Yeni ürünler, sınırlı sayıda üretilen renkler ve özel mevsimlik indirimlerden ilk siz haberdar olun.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="E-posta adresi" 
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-8 py-4 focus:outline-none focus:ring-2 focus:ring-[#ffc329] text-white placeholder:text-white/40"
            />
            <button className="bg-[#ffc329] text-[#795900] font-bold px-10 py-4 rounded-full hover:bg-white transition-colors">
              Abone Ol
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
