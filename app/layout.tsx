import type { Metadata } from "next";
import { Inter, Space_Grotesk, Audiowide } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { RecentlyViewedProvider } from "@/components/RecentlyViewedProvider";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { ChatWidget } from "@/components/ChatWidget";
import { ThemeProvider } from "@/components/ThemeProvider";
import Link from "next/link";

// One column of footer links — kept tiny so each column declaration in the
// footer stays readable. Used three times (Kurumsal, Müşteri Hizmetleri,
// Hukuki); the İletişim column is hand-rendered because it mixes mailto/tel
// links with a plain address line.
function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-display font-bold text-lg mb-8 text-text-primary">{title}</h4>
      <ul className="space-y-4 text-text-secondary font-medium">
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="hover:text-primary transition-colors">
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  title: "Zest Home | Premium Mutfak Gereçleri",
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
          <AuthProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <CartProvider>
                <Navbar />
                <div className="min-h-screen pb-24 lg:pb-0">{children}</div>
                <MobileNav />
                <ChatWidget />
                <footer className="bg-surface text-text-primary pt-20 pb-10 hidden lg:block border-t border-border">
                  <div className="max-w-7xl mx-auto px-5 md:px-16">
                    {/* Brand block — logo + tagline + socials. Spans the full
                        width and sits above the link grid. */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-14 pb-12 border-b border-border">
                      <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <span className="font-bold text-xl">Z</span>
                          </div>
                          <span className="font-display text-3xl font-extrabold tracking-tight">
                            ZestHome
                          </span>
                        </div>
                        <p className="text-text-secondary text-base leading-relaxed">
                          Premium mutfak gereçleri ve yaşam alanı çözümleri.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href="https://www.instagram.com/zesthomekitchen/"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                        >
                          {/* Instagram glyph */}
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        </a>
                        <a
                          href="https://wa.me/905322809206"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="WhatsApp"
                          className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border text-text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                        >
                          {/* WhatsApp glyph (lucide doesn't ship one) */}
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="M19.05 4.91A9.82 9.82 0 0 0 12 2a9.94 9.94 0 0 0-8.6 14.91L2 22l5.25-1.37A9.94 9.94 0 0 0 12 22a9.93 9.93 0 0 0 9.95-9.95 9.86 9.86 0 0 0-2.9-7.14zM12 20.16a8.2 8.2 0 0 1-4.21-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.27 8.27 0 1 1 14.99-4.65A8.27 8.27 0 0 1 12 20.16zm4.53-6.16c-.25-.12-1.47-.72-1.7-.81s-.39-.12-.55.12-.64.81-.78.97-.29.18-.54.06a6.74 6.74 0 0 1-2-1.23 7.51 7.51 0 0 1-1.38-1.72c-.14-.25 0-.38.11-.5s.25-.29.37-.43.16-.25.25-.42.04-.32-.02-.44-.55-1.32-.75-1.81-.4-.41-.55-.42h-.47a.9.9 0 0 0-.66.31 2.78 2.78 0 0 0-.87 2.06 4.84 4.84 0 0 0 1 2.56 11.05 11.05 0 0 0 4.24 3.74c.6.25 1.07.4 1.43.51a3.47 3.47 0 0 0 1.58.1 2.57 2.57 0 0 0 1.7-1.2 2.13 2.13 0 0 0 .15-1.2c-.06-.1-.23-.16-.48-.28z" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {/* 4-column link grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                      <FooterCol
                        title="Kurumsal"
                        items={[
                          { label: "Hakkımızda", href: "/about" },
                          { label: "Blog", href: "/blog" },
                          { label: "İletişim", href: "/contact" },
                        ]}
                      />
                      <FooterCol
                        title="Müşteri Hizmetleri"
                        items={[
                          { label: "Sipariş Takibi", href: "/siparislerim" },
                          { label: "Teslimat", href: "/yardim/kargo" },
                          { label: "İade & Değişim", href: "/yardim/iade" },
                        ]}
                      />
                      <FooterCol
                        title="Hukuki"
                        items={[
                          { label: "Kullanım Koşulları", href: "/hukuki/kullanim-kosullari" },
                          { label: "Mesafeli Satış Sözleşmesi", href: "/hukuki/mesafeli-satis" },
                          { label: "Ön Bilgilendirme Formu", href: "/hukuki/on-bilgilendirme" },
                          { label: "Gizlilik Politikası", href: "/hukuki/gizlilik" },
                          { label: "KVKK", href: "/hukuki/kvkk" },
                          { label: "Çerez Politikası", href: "/hukuki/cerez" },
                        ]}
                      />
                      <div>
                        <h4 className="font-display font-bold text-lg mb-8 text-text-primary">
                          İletişim
                        </h4>
                        <ul className="space-y-4 text-text-secondary font-medium">
                          <li>
                            <a
                              href="mailto:info@zest-home.net"
                              className="hover:text-primary transition-colors break-all"
                            >
                              info@zest-home.net
                            </a>
                          </li>
                          <li>
                            <a
                              href="tel:+905322809206"
                              className="hover:text-primary transition-colors"
                            >
                              +90 532 280 92 06
                            </a>
                          </li>
                          <li className="text-text-secondary leading-relaxed">
                            Küçükçekmece
                            <br />
                            İstanbul, Türkiye
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-border pt-8 flex justify-between items-center text-text-secondary text-sm">
                      <p>© 2026 ZestHome. Tüm hakları saklıdır.</p>
                    </div>
                  </div>
                </footer>
                </CartProvider>
              </RecentlyViewedProvider>
            </WishlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
