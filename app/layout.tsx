import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Zest | Premium Mutfak Gereçleri",
  description: "Modern ve pratik mutfak gereçleri koleksiyonumuzla mutfak deneyiminizi geliştirin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className={`scroll-smooth ${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="font-body bg-background text-text-primary antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          <CartProvider>
            <Navbar />
            <div className="min-h-screen pb-24 md:pb-0">
              {children}
            </div>
            <MobileNav />
            <footer className="bg-surface text-text-primary pt-24 pb-12 hidden md:block border-t border-border">
              <div className="max-w-7xl mx-auto px-5 md:px-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <span className="font-bold text-xl">Z</span>
                      </div>
                      <span className="font-display text-3xl font-extrabold tracking-tight">Zest</span>
                    </div>
                    <p className="text-text-secondary max-w-sm mb-10 text-lg leading-relaxed italic">
                      Mutfakta mükemmelliği arayanlar için tasarlanan, zamansız ve fonksiyonel mutfak gereçleri.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg mb-8 text-text-primary">Mağaza</h4>
                    <ul className="space-y-4 text-text-secondary font-medium">
                      <li><a href="/shop" className="hover:text-primary transition-colors">Tüm Ürünler</a></li>
                      <li><a href="/shop?cat=Doğrayıcı & Rondo" className="hover:text-primary transition-colors">Doğrayıcılar</a></li>
                      <li><a href="/shop?cat=Saklama Kabı" className="hover:text-primary transition-colors">Saklama Kapları</a></li>
                      <li><a href="#" className="hover:text-primary transition-colors">Koleksiyonlar</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg mb-8 text-text-primary">Kurumsal</h4>
                    <ul className="space-y-4 text-text-secondary font-medium">
                      <li><a href="/about" className="hover:text-primary transition-colors">Hikayemiz</a></li>
                      <li><a href="/contact" className="hover:text-primary transition-colors">İletişim</a></li>
                      <li><a href="#" className="hover:text-primary transition-colors">Kargo Takibi</a></li>
                      <li><a href="#" className="hover:text-primary transition-colors">Destek</a></li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-border pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-text-secondary text-sm">
                  <p>© 2026 Zest Studio. Modern mutfaklar için tasarlandı.</p>
                  <div className="flex gap-10">
                    <a href="#" className="hover:text-text-primary transition-colors">Gizlilik</a>
                    <a href="#" className="hover:text-text-primary transition-colors">Şartlar</a>
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
