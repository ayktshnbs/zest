"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderFailedPage() {
  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-2xl mx-auto px-5 md:px-16 text-center space-y-10">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="w-20 h-20 mx-auto bg-red-600 text-background rounded-full flex items-center justify-center"
        >
          <XCircle size={32} strokeWidth={2} />
        </motion.div>

        <div className="space-y-4">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-red-600/80">
            İşlem Başarısız
          </span>
          <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight">
            Ödeme Alınamadı
          </h1>
          <p className="text-foreground/60 leading-relaxed max-w-md mx-auto">
            Kredi veya banka kartınızdan ödeme çekilemedi. Lütfen kart bilgilerinizi,
            limitinizi kontrol edin veya farklı bir kart ile tekrar deneyin.
          </p>
        </div>

        <div className="border border-foreground/10 p-8 space-y-4 text-left bg-foreground/[0.02]">
          <p className="text-[13px] text-foreground/70 font-body leading-relaxed text-center">
            Siparişiniz sepetinizde korunmaktadır. Tekrar ödeme yapmayı deneyebilir
            veya alışverişe kaldığınız yerden devam edebilirsiniz.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/odeme"
            className="px-10 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
          >
            <RefreshCcw size={12} /> Tekrar Dene
          </Link>
          <Link
            href="/sepet"
            className="px-10 py-4 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors inline-flex items-center justify-center gap-2"
          >
            Sepete Dön <ArrowLeft size={12} />
          </Link>
        </div>
      </div>
    </main>
  );
}
