import Link from "next/link";
import { Truck, Package, Clock, MapPin } from "lucide-react";

export const metadata = {
  title: "Kargo & Teslimat | Zest",
  description: "Kargo ve teslimat süreçleri hakkında bilmeniz gerekenler.",
};

const sections = [
  {
    icon: <Truck size={20} />,
    title: "Kargo Ücretleri",
    body: "750 TL ve üzeri tüm siparişlerde standart kargo ücretsizdir. Bu tutarın altındaki siparişlerde sabit 49,90 TL standart kargo ücreti uygulanır. Ekspres kargo seçeneği için 89,90 TL eklenir.",
  },
  {
    icon: <Clock size={20} />,
    title: "Teslimat Süreleri",
    body: "Standart kargoda siparişler hafta içi her gün saat 15:00'e kadar hazırlanır ve 2-4 iş günü içinde teslim edilir. Ekspres kargo seçtiyseniz aynı gün hazırlanır ve ertesi iş günü kapınızda olur.",
  },
  {
    icon: <Package size={20} />,
    title: "Sipariş Takibi",
    body: "Siparişiniz kargoya verildiğinde size e-posta ve SMS ile takip kodu gönderilir. Bu kod ile MNG veya Yurtiçi Kargo web sitelerinden kolaylıkla siparişinizi takip edebilirsiniz.",
  },
  {
    icon: <MapPin size={20} />,
    title: "Mağazadan Teslim Alma",
    body: "İstanbul Beşiktaş Mutfak Sokak No: 34 adresindeki mağazamızdan ücretsiz teslim alma seçeneğimiz mevcuttur. Siparişiniz hazırlandığında SMS ile bilgilendirme yapılır.",
  },
];

export default function ShippingHelpPage() {
  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-4xl mx-auto px-5 md:px-16">
        <div className="mb-16 text-center space-y-4">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
            Yardım Merkezi
          </span>
          <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight">
            Kargo & Teslimat
          </h1>
          <p className="text-foreground/50 max-w-xl mx-auto leading-relaxed">
            Siparişinizin size güvenle ve hızla ulaşması için tüm süreç hakkında bilmeniz gerekenler.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((s) => (
            <article
              key={s.title}
              className="border border-foreground/10 p-8 md:p-10 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="text-foreground/60">{s.icon}</div>
                <h2 className="font-audiowide text-base uppercase tracking-[0.3em] text-foreground">
                  {s.title}
                </h2>
              </div>
              <p className="text-foreground/60 leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/contact"
            className="inline-block px-10 py-4 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors"
          >
            Soru sormak ister misiniz?
          </Link>
        </div>
      </div>
    </main>
  );
}
