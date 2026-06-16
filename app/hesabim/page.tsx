"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { ordersApi, ApiError, type OrderSummary } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { paymentLabel, fulfillmentLabel, fulfillmentDot, liraFromCents } from "@/lib/orderLabels";

export default function AccountPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Require login.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/giris?next=${encodeURIComponent("/hesabim")}`);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { orders } = await ordersApi.list(1, 50);
        setOrders(orders);
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) setErr("Siparişler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yükleniyor
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 md:pt-32 pb-24 bg-background">
      <div className="max-w-4xl mx-auto px-5 md:px-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6 mb-10">
          <div>
            <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40">
              Hesabım
            </span>
            <h1 className="font-audiowide text-3xl md:text-4xl uppercase tracking-tight mt-2">
              {user?.name}
            </h1>
            <p className="text-foreground/40 font-body text-sm mt-1">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground border-b border-foreground/10 hover:border-foreground pb-1"
          >
            Çıkış Yap
          </button>
        </div>

        <h2 className="font-audiowide text-sm uppercase tracking-[0.3em] mb-6">Siparişlerim</h2>

        {err ? <p className="text-red-600 font-body text-sm mb-4">{err}</p> : null}

        {loading ? (
          <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>
        ) : orders.length === 0 ? (
          <div className="border border-foreground/10 p-10 text-center">
            <p className="text-foreground/50 font-body">Henüz siparişiniz yok.</p>
            <Link
              href="/shop"
              className="inline-block mt-4 font-audiowide text-[10px] uppercase tracking-[0.3em] border-b border-foreground/20 hover:border-foreground pb-1"
            >
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="border border-foreground/10 p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-[140px]">
                  <p className="font-audiowide text-xs tracking-tight">{o.orderNumber}</p>
                  <p className="text-foreground/40 text-[12px] font-body mt-1">
                    {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="inline-flex items-center gap-2 text-[13px] font-body text-foreground/80">
                    <span className={`w-2 h-2 rounded-full ${fulfillmentDot[o.fulfillmentStatus]}`} />
                    {fulfillmentLabel[o.fulfillmentStatus]}
                  </span>
                  <span className="text-[11px] font-body text-foreground/40">
                    Ödeme: {paymentLabel[o.status]}
                  </span>
                </div>
                <p className="font-audiowide text-sm tracking-tight whitespace-nowrap">
                  {formatPrice(liraFromCents(o.totalCents))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
