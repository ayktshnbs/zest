"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCcw, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ordersApi, paymentsApi, ApiError, type OrderSummary } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { liraFromCents } from "@/lib/orderLabels";

// The cart is cleared once an order has been handed to PayTR, so the old copy
// ("siparişiniz sepetinizde korunmaktadır") was wrong and its "Tekrar Dene"
// link to /odeme just bounced to an empty cart. What actually survives is the
// ORDER — and the API now accepts a fresh payment attempt for one that is
// still `pending` or has `failed`, re-reserving its stock in the process.
const RETRYABLE = new Set(["pending", "failed"]);

export default function OrderFailedPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { orders } = await ordersApi.list(1, 1);
        if (cancelled) return;
        const latest = orders[0] ?? null;
        setOrder(latest && RETRYABLE.has(latest.status) ? latest : null);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = useCallback(async () => {
    if (!order || retrying) return;
    setRetrying(true);
    setError(null);
    try {
      const { token } = await paymentsApi.createCheckout(order.id);
      router.replace(`/odeme/kart?token=${encodeURIComponent(token)}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "out_of_stock") {
        setError(
          "Siparişinizdeki ürünlerden biri bu sırada tükendi. Lütfen sepetinizi yeniden oluşturun.",
        );
      } else if (err instanceof ApiError && err.code === "payment_in_progress") {
        // A previous PayTR session for this order is still payable. Opening a
        // second one could charge the customer twice, so the server refuses.
        const secs =
          (err.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds ?? 0;
        const mins = Math.ceil(secs / 60);
        setError(
          `${err.message}${mins > 0 ? ` (yaklaşık ${mins} dakika)` : ""}`,
        );
      } else if (err instanceof ApiError && err.status === 401) {
        router.push(`/giris?next=${encodeURIComponent("/odeme/basarisiz")}`);
        return;
      } else {
        setError("Ödeme yeniden başlatılamadı. Lütfen biraz sonra tekrar deneyin.");
      }
      setRetrying(false);
    }
  }, [order, retrying, router]);

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

        <div className="border border-foreground/10 p-8 space-y-4 bg-foreground/[0.02]">
          {loading ? (
            <p className="text-[13px] text-foreground/50 font-body text-center">
              Siparişiniz kontrol ediliyor…
            </p>
          ) : order ? (
            <>
              <p className="text-[13px] text-foreground/70 font-body leading-relaxed text-center">
                <strong className="text-foreground">{order.orderNumber}</strong> numaralı
                siparişiniz kaydedildi ve ürünleriniz sizin için ayrıldı. Aynı sipariş için
                ödemeyi yeniden deneyebilirsiniz.
              </p>
              <p className="text-[12px] text-foreground/50 font-body text-center">
                Tutar: {formatPrice(liraFromCents(order.totalCents))}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-foreground/70 font-body leading-relaxed text-center">
              Tamamlanmamış bir siparişiniz bulunamadı. Siparişlerinizi kontrol edebilir
              veya alışverişe kaldığınız yerden devam edebilirsiniz.
            </p>
          )}
          {error ? (
            <p className="text-[13px] text-red-600 font-body text-center">{error}</p>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {order ? (
            <button
              onClick={retry}
              disabled={retrying}
              className="px-10 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={12} />
              {retrying ? "Yönlendiriliyor…" : "Tekrar Dene"}
            </button>
          ) : null}
          <Link
            href="/hesabim/siparisler"
            className="px-10 py-4 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors inline-flex items-center justify-center gap-2"
          >
            <Package size={12} /> Siparişlerim
          </Link>
          <Link
            href="/shop"
            className="px-10 py-4 border border-foreground/15 font-audiowide text-[10px] uppercase tracking-[0.3em] hover:border-foreground transition-colors inline-flex items-center justify-center gap-2"
          >
            Alışverişe Dön <ArrowLeft size={12} />
          </Link>
        </div>
      </div>
    </main>
  );
}
