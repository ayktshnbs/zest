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
  title: "Zest | Premium Kitchenware",
  description: "Elevate your culinary experience with our curated collection of high-quality kitchenware.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
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
                    Making cooking fun, one colorful pan at a time. Non-toxic, beautiful, and built for your happiest kitchen.
                  </p>
                </div>
                <div>
                  <h4 className="font-display font-bold mb-6">Shop</h4>
                  <ul className="space-y-4 text-white/60 text-sm">
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Cookware</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Bakeware</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Cutlery</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Sale</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-display font-bold mb-6">Support</h4>
                  <ul className="space-y-4 text-white/60 text-sm">
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Shipping</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">Returns</a></li>
                    <li><a href="#" className="hover:text-[#ffc329] transition-colors">FAQ</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-xs">
                <p>© 2026 Zest Kitchenware. All rights reserved.</p>
                <div className="flex gap-8">
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
