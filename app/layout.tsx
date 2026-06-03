import type { Metadata } from "next";
import { Inter, Space_Grotesk, Audiowide } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { RecentlyViewedProvider } from "@/components/RecentlyViewedProvider";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import Link from "next/link";
import { categories } from "@/lib/categories";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide",
});

export const metadata: Metadata = {
  title: "Zest Kitchene | Premium Mutfak Gereçleri",
  description:
    "Modern ve pratik mutfak gereçleri koleksiyonumuzla mutfak deneyiminizi geliştirin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`scroll-smooth ${inter.variable} ${spaceGrotesk.variable} ${audiowide.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="font-body bg-background text-text-primary antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <CartProvider>
                <Navbar />
                <div className="min-h-screen pb-24 md:pb-0">{children}</div>
                <MobileNav />
                <footer className="bg-surface text-text-primary pt-24 pb-12 hidden md:block border-t border-border">
                  <div className="max-w-7xl mx-auto px-5 md:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                      <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <span className="font-bold text-xl">Z</span>
                          </div>
                          <span className="font-display text-3xl font-extrabold tracking-tight">
                            Zest Kitchene
                          </span>
                        </div>
                        <p className="text-text-secondary max-w-sm mb-10 text-lg leading-relaxed italic">
                          Mutfakta mükemmelliği arayanlar için tasarlanan, zamansız ve fonksiyonel
                          mutfak gereçleri.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-lg mb-8 text-text-primary">
                          Mağaza
                        </h4>
                        <ul className="space-y-4 text-text-secondary font-medium">
                          <li>
                            <Link href="/shop" className="hover:text-primary transition-colors">
                              Tüm Ürünler
                            </Link>
                          </li>
                          {categories.slice(0, 4).map((c) => (
                            <li key={c.slug}>
                              <Link
                                href={`/shop/${c.slug}`}
                                className="hover:text-primary transition-colors"
                              >
                                {c.label}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href="/kategoriler"
                              className="hover:text-primary transition-colors"
                            >
                              Tüm Kategoriler
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-lg mb-8 text-text-primary">
                          Yardım
                        </h4>
                        <ul className="space-y-4 text-text-secondary font-medium">
                          <li>
                            <Link href="/about" className="hover:text-primary transition-colors">
                              Hikayemiz
                            </Link>
                          </li>
                          <li>
                            <Link href="/contact" className="hover:text-primary transition-colors">
                              İletişim
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/yardim/kargo"
                              className="hover:text-primary transition-colors"
                            >
                              Kargo & Teslimat
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/yardim/iade"
                              className="hover:text-primary transition-colors"
                            >
                              İade & Değişim
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/favoriler"
                              className="hover:text-primary transition-colors"
                            >
                              Favorilerim
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="border-t border-border pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-text-secondary text-sm">
                      <p>© 2026 Zest Kitchene. Modern mutfaklar için tasarlandı.</p>
                      <div className="flex gap-10">
                        <a href="#" className="hover:text-text-primary transition-colors">
                          Gizlilik
                        </a>
                        <a href="#" className="hover:text-text-primary transition-colors">
                          Şartlar
                        </a>
                      </div>
                    </div>
                  </div>
                </footer>
              </CartProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
