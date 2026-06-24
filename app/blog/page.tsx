import Link from "next/link";

export const metadata = {
  title: "Blog · ZestHome",
  description: "ZestHome blogu yakında yayında.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
          ZestHome · Blog
        </p>
        <h1 className="font-audiowide text-4xl md:text-6xl tracking-tight text-foreground uppercase mb-6">
          Yakında
        </h1>
        <p className="text-foreground/60 text-lg leading-relaxed mb-10">
          Mutfak ipuçları, ürün rehberleri ve yeni koleksiyon haberleri için
          blog sayfamızı yakında açıyoruz.
        </p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
        >
          Mağazaya Dön
        </Link>
      </div>
    </main>
  );
}
