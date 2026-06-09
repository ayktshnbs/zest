import Link from "next/link";
import { RefreshCw, ShieldCheck, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "İade & Değişim | Zest Home",
  description: "İade ve değişim koşulları hakkında bilmeniz gerekenler.",
};

const sections = [
  {
    icon: <RefreshCw size={20} />,
    title: "14 Gün Koşulsuz İade",
    body: "Teslim aldığınız tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin iade hakkınız bulunmaktadır. Ürünleri orijinal ambalajıyla göndermeniz yeterlidir.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "2 Yıl Üretici Garantisi",
    body: "Tüm ürünlerimiz üretim hatalarına karşı 2 yıl garantilidir. Garanti kapsamındaki ürünler ücretsiz olarak değiştirilir veya tamir edilir. Yanlış kullanım garanti kapsamı dışındadır.",
  },
  {
    icon: <Clock size={20} />,
    title: "İade Süreci",
    body: "İade talebinizi hesabınızdan veya iade@zeststudio.com adresine e-posta göndererek başlatabilirsiniz. Onay sonrası ücretsiz kargo kodu paylaşılır. Ürün tarafımıza ulaştıktan sonra 5 iş günü içinde ödemeniz iade edilir.",
  },
  {
    icon: <AlertCircle size={20} />,
    title: "Önemli Notlar",
    body: "Kullanılmış, yıkanmış veya orijinal ambalajı bozulmuş ürünler iade kabul edilmez. Kişisel hijyen ürünleri (silikon kalıplar, sünger setleri) açıldığında iade edilemez.",
  },
];

export default function ReturnsHelpPage() {
  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-4xl mx-auto px-5 md:px-16">
        <div className="mb-16 text-center space-y-4">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
            Yardım Merkezi
          </span>
          <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight">
            İade & Değişim
          </h1>
          <p className="text-foreground/50 max-w-xl mx-auto leading-relaxed">
            Memnun kalmadığınız ürünleri sorunsuzca iade edebilir veya değiştirebilirsiniz.
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
            Yardım için bize yazın
          </Link>
        </div>
      </div>
    </main>
  );
}
