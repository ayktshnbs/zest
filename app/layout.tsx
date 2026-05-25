import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="tr" suppressHydrationWarning className="scroll-smooth">
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <CartProvider>
            <Navbar />
            <div className="min-h-screen pb-24 md:pb-0">
              {children}
            </div>
            <MobileNav />
            <footer className="bg-neutral-950 text-white pt-24 pb-12 hidden md:block">
              <div className="max-w-7xl mx-auto px-5 md:px-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-secondary shadow-lg shadow-primary/20">
                        <span className="font-bold text-xl">Z</span>
                      </div>
                      <span className="font-display text-3xl font-extrabold tracking-tight">Zest</span>
                    </div>
                    <p className="text-neutral-400 max-w-sm mb-10 text-lg leading-relaxed">
                      Yemek pişirmeyi sanata dönüştürüyoruz. Toksik olmayan, profesyonel kalitede ve estetik mutfak gereçleri.
                    </p>
                    <div className="flex gap-4">
                      {/* Social icons could go here */}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg mb-8">Mağaza</h4>
                    <ul className="space-y-4 text-neutral-400 font-medium">
                      <li><a href="/shop" className="hover:text-primary transition-colors">Tüm Ürünler</a></li>
                      <li><a href="/shop?cat=Bıçaklar" className="hover:text-primary transition-colors">Bıçaklar</a></li>
                      <li><a href="/shop?cat=Pişirme" className="hover:text-primary transition-colors">Pişirme</a></li>
                      <li><a href="#" className="hover:text-primary transition-colors">İndirimli Ürünler</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg mb-8">Kurumsal</h4>
                    <ul className="space-y-4 text-neutral-400 font-medium">
                      <li><a href="/about" className="hover:text-primary transition-colors">Hakkımızda</a></li>
                      <li><a href="/contact" className="hover:text-primary transition-colors">İletişim</a></li>
                      <li><a href="#" className="hover:text-primary transition-colors">Kargo Takibi</a></li>
                      <li><a href="#" className="hover:text-primary transition-colors">Destek Merkezi</a></li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-neutral-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-neutral-500 text-sm">
                  <p>© 2026 Zest Studio. Modern mutfaklar için tasarlandı.</p>
                  <div className="flex gap-10">
                    <a href="#" className="hover:text-white transition-colors">Gizlilik</a>
                    <a href="#" className="hover:text-white transition-colors">Şartlar</a>
                    <a href="#" className="hover:text-white transition-colors">Çerezler</a>
                  </div>
                </div>
              </div>
            </footer>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

