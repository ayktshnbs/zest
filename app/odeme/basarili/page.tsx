"use client";

import Link from "next/link";
import { Check, Package, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { estimatedDelivery } from "@/lib/utils";
import { ordersApi, type OrderSummary } from "@/lib/api";
import { paymentLabel } from "@/lib/orderLabels";

// PayTR redirects here with no parameters, so the order has to be resolved
// from the API. The page used to hard-code "Ödendi" and read a `?order=` param
// nothing ever set — it claimed success even when the payment had failed, and
// always showed "—" for the order number.
//
// The callback is server-to-server and regularly lands AFTER this redirect, so
// a `pending` order is normal for a few seconds: poll a handful of times
// before settling on "being confirmed" rather than crying failure.
const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 5;

type Phase = "loading" | "resolved" | "unavailable";

export default function OrderSuccessPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const pollsRef = useRef(0);
  const cancelledRef = useRef(false);

  const check = useCallback(async () => {
    try {
      // The newest order is the one just paid for.
      const { orders } = await ordersApi.list(1, 1);
      if (cancelledRef.current) return;
      const latest = orders[0] ?? null;
      setOrder(latest);
      setPhase("resolved");

      // Keep polling only while we're waiting on the payment callback.
      if (latest && latest.status === "pending" && pollsRef.current < MAX_POLLS) {
        pollsRef.current += 1;
        setTimeout(() => {
          if (!cancelledRef.current) void check();
        }, POLL_INTERVAL_MS);
      }
    } catch {
      if (cancelledRef.current) return;
      // Not signed in, or the API is unreachable — either way, don't assert
      // anything about the payment.
      setPhase("unavailable");
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void check();
    return () => {
      cancelledRef.current = true;
    };
  }, [check]);

  const status = order?.status ?? null;
  const isPaid = status === "paid";
  const isFailed = status === "failed" || status === "cancelled";

  const heading = isPaid
    ? "Teşekkür Ederiz"
    : isFailed
      ? "Ödeme Tamamlanamadı"
      : "Siparişiniz Alındı";

  const eyebrow = isPaid
    ? "Siparişiniz Onaylandı"
    : isFailed
      ? "Ödeme Alınamadı"
      : "Ödemeniz Doğrulanıyor";

  return (
    <main className="min-h-screen pt-32 md:pt-40 pb-24 bg-background">
      <div className="max-w-2xl mx-auto px-5 md:px-16 text-center space-y-10">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            isFailed
              ? "bg-red-600 text-white"
              : isPaid
                ? "bg-foreground text-background"
                : "bg-foreground/10 text-foreground"
          }`}
        >
          {isFailed ? (
            <AlertTriangle size={28} strokeWidth={2} />
          ) : isPaid ? (
            <Check size={28} strokeWidth={2} />
          ) : (
            <Clock size={26} strokeWidth={2} className="animate-pulse" />
          )}
        </motion.div>

        <div className="space-y-4">
          <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
            {phase === "loading" ? "Kontrol Ediliyor" : eyebrow}
          </span>
          <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight">
            {phase === "loading" ? "Bir Saniye" : heading}
          </h1>
          <p className="text-foreground/50 leading-relaxed">
            {phase === "loading"
              ? "Siparişinizin durumu kontrol ediliyor…"
              : phase === "unavailable"
                ? "Sipariş durumunuzu şu anda gösteremiyoruz. Siparişlerim sayfasından güncel durumu görebilirsiniz."
                : isPaid
                  ? "Ödemeniz başarıyla alındı ve siparişiniz oluşturuldu. Siparişiniz hazırlandığında ve kargoya verildiğinde size e-posta ile bilgi vereceğiz."
                  : isFailed
                    ? "Bankanızdan onay alınamadı. Siparişinizi Siparişlerim sayfasından yeniden ödemeyi deneyebilirsiniz."
                    : "Siparişiniz oluşturuldu. Bankanızın onayı birkaç saniye içinde ulaşacak — bu sayfa kendini güncelleyecek."}
          </p>
        </div>

        <div className="border border-foreground/10 p-8 space-y-4 text-left">
          <SummaryRow label="Sipariş No" value={order?.orderNumber ?? "—"} />
          <SummaryRow
            label="Ödeme Durumu"
            value={
              phase !== "resolved" || !status ? (
                <span className="text-foreground/40">Kontrol ediliyor…</span>
              ) : isPaid ? (
                <span className="inline-flex items-center gap-2 text-green-700">
                  <Check size={12} /> {paymentLabel[status]}
                </span>
              ) : isFailed ? (
                <span className="inline-flex items-center gap-2 text-red-600">
                  <AlertTriangle size={12} /> {paymentLabel[status]}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-foreground/60">
                  <Clock size={12} /> {paymentLabel[status]}
                </span>
              )
            }
          />
          {!isFailed ? (
            <SummaryRow label="Tahmini Teslimat" value={estimatedDelivery()} />
          ) : null}
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
