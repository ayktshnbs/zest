import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Navbar } from "@/components/Navbar";

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["700", "800"]
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "Zest | Premium Mutfak Gereçleri",
  description: "Özenle seçilmiş yüksek kaliteli mutfak gereçleri koleksiyonumuzla mutfak deneyiminizi geliştirin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={`${plusJakarta.variable} ${dmSans.variable} font-body bg-[#fdf9e9] text-[#1c1c13] antialiased`}>
        <CartProvider>
          <Navbar />
          {children}
          <footer className="bg-[#1c1c13] text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-5 md:px-16">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-[#b80035] rounded-full flex items-center justify-center text-[#ffc329]">
                      <span className="font-bold text-lg">Z</span>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-white">Zest</span>
                  </div>
                  <p className="text-white/60 max-w-sm mb-8">
                    Yemek pişirmeyi eğlenceli hale getiriyoruz. Toksik olmayan, şık ve en mutlu mutfağınız için tasarlandı.
                  </p>
                </div>
                <div>
                  <h4 className="font-display font-bold mb-6">Alışveriş</h4>
                  <ul className="space-y-4 text-white/60 text-sm">
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Pişirme Gereçleri</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Fırın Gereçleri</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Bıçaklar</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">İndirim</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-display font-bold mb-6">Destek</h4>
                  <ul className="space-y-4 text-white/60 text-sm">
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Hakkımızda</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Kargo</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">İadeler</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">SSS</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-xs">
                <p>© 2026 Zest Mutfak Gereçleri. Tüm hakları saklıdır.</p>
                <div className="flex gap-8">
                  <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
                  <a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
