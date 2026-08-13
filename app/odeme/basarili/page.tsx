"use client";

import Link from "next/link";
import { Check, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { estimatedDelivery } from "@/lib/utils";

export default function OrderSuccessPage() {
  // Real order number comes from the checkout redirect (?order=…).
  const orderNumber = useMemo(() => {
    if (typeof window !== "undefined") {
      const fromUrl = new URLSearchParams(window.location.search).get("order");
      if (fromUrl) return fromUrl;
    }
    return null;
  }, []);

  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-2xl mx-auto px-5 md:px-16 text-center space-y-10">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="w-20 h-20 mx-auto bg-foreground text-background rounded-full flex items-center justify-center"
        >
          <Check size={28} strokeWidth={2} />
        </motion.div>

        <div className="space-y-4">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
            Siparişiniz Onaylandı
          </span>
          <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight">
            Teşekkür Ederiz
          </h1>
          <p className="text-foreground/50 leading-relaxed">
            Ödemeniz başarıyla alındı ve siparişiniz oluşturuldu.
            Siparişiniz hazırlandığında ve kargoya verildiğinde size
            e-posta ile bilgi vereceğiz.
          </p>
        </div>

        <div className="border border-foreground/10 p-8 space-y-4 text-left">
          <SummaryRow label="Sipariş No" value={orderNumber ?? "—"} />
          <SummaryRow
            label="Ödeme Durumu"
            value={
              <span className="inline-flex items-center gap-2 text-green-700">
                <Check size={12} /> Ödendi
              </span>
            }
          />
          <SummaryRow label="Tahmini Teslimat" value={estimatedDelivery()} />
        </div>

        <p className="text-[12px] text-foreground/50 font-body leading-relaxed">
          Siparişinizin güncel durumunu{" "}
          <Link href="/hesabim" className="underline text-foreground">
            hesabım
          </Link>{" "}
          sayfasından takip edebilirsiniz.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/hesabim"
            className="px-10 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
          >
            <Package size={12} /> Siparişlerim
          </Link>
          <Link
            href="/shop"
            className="px-10 py-4 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors inline-flex items-center justify-center gap-2"
          >
            Alışverişe Devam Et <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40">
        {label}
      </span>
      <span className="font-body text-foreground">{value}</span>
    </div>
  );
}
