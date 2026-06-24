// Shared layout for legal/info pages (Kullanım Koşulları, KVKK, etc.).
// Keeps all of them visually consistent and the page files thin.

import Link from "next/link";

type Section = {
  title: string;
  body: React.ReactNode;
};

export interface LegalPageProps {
  title: string;
  intro?: React.ReactNode;
  updatedAt?: string; // ISO yyyy-mm-dd; rendered as "Son güncelleme: …"
  sections: Section[];
}

export function LegalPage({ title, intro, updatedAt, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            ZestHome
          </Link>{" "}
          · Hukuki
        </p>
        <h1 className="font-audiowide text-3xl md:text-5xl tracking-tight text-foreground uppercase mb-6 [text-wrap:balance]">
          {title}
        </h1>
        {updatedAt ? (
          <p className="font-body text-[12px] text-foreground/40 mb-10">
            Son güncelleme: {new Date(updatedAt).toLocaleDateString("tr-TR")}
          </p>
        ) : null}
        {intro ? (
          <div className="text-foreground/70 text-base leading-relaxed mb-12 whitespace-pre-line">
            {intro}
          </div>
        ) : null}
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/80 mb-3 border-b border-foreground/10 pb-2">
                {s.title}
              </h2>
              <div className="text-foreground/70 text-[15px] leading-relaxed whitespace-pre-line">
                {s.body}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-foreground/10 text-[12px] text-foreground/40 font-body">
          Sorularınız için{" "}
          <a href="mailto:info@zest-home.net" className="text-foreground/70 hover:text-foreground underline">
            info@zest-home.net
          </a>{" "}
          adresinden bize ulaşabilirsiniz.
        </div>
      </div>
    </main>
  );
}
