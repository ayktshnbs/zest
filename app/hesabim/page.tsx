"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ordersApi,
  addressesApi,
  ApiError,
  type OrderSummary,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { paymentLabel, fulfillmentLabel, fulfillmentDot, liraFromCents } from "@/lib/orderLabels";
import { User, MapPin, Package, ShieldCheck, ArrowRight } from "lucide-react";

export default function AccountDashboard() {
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [latestOrders, setLatestOrders] = useState<OrderSummary[]>([]);
  const [addressCount, setAddressCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ordersResult, addressesResult] = await Promise.allSettled([
        ordersApi.list(1, 3),
        addressesApi.list(),
      ]);
      if (ordersResult.status === "fulfilled") {
        setLatestOrders(ordersResult.value.orders);
        setOrderCount(ordersResult.value.pagination.total);
      } else if (!(ordersResult.reason instanceof ApiError && ordersResult.reason.status === 401)) {
        setOrderCount(0);
      }
      if (addressesResult.status === "fulfilled") {
        setAddressCount(addressesResult.value.addresses.length);
      } else if (
        !(addressesResult.reason instanceof ApiError && addressesResult.reason.status === 401)
      ) {
        setAddressCount(0);
      }
      setLoading(false);
    })();
  }, []);

  const cards = [
    {
      href: "/hesabim/profil",
      icon: User,
      title: "Profil Bilgilerim",
      desc: "Ad, soyad, e-posta ve telefon bilgilerinizi güncelleyin.",
    },
    {
      href: "/hesabim/adresler",
      icon: MapPin,
      title: "Adreslerim",
      desc:
        addressCount === null
          ? "Kayıtlı teslimat adreslerinizi yönetin."
          : addressCount === 0
            ? "Henüz kayıtlı adresiniz yok."
            : `${addressCount} kayıtlı adres`,
    },
    {
      href: "/hesabim/siparisler",
      icon: Package,
      title: "Siparişlerim",
      desc:
        orderCount === null
          ? "Sipariş geçmişinizi görüntüleyin."
          : orderCount === 0
            ? "Henüz siparişiniz yok."
            : `${orderCount} sipariş`,
    },
    {
      href: "/hesabim/guvenlik",
      icon: ShieldCheck,
      title: "Şifre ve Güvenlik",
      desc: "Şifrenizi değiştirin ve hesap güvenliğinizi yönetin.",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Quick-nav cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex items-start gap-4 border border-foreground/10 p-6 hover:border-foreground/30 transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center border border-foreground/10 shrink-0 text-foreground/60 group-hover:text-foreground group-hover:border-foreground/30 transition-colors">
              <c.icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-audiowide text-[11px] uppercase tracking-[0.25em] text-foreground flex items-center gap-2">
                {c.title}
                <ArrowRight
                  size={12}
                  className="opacity-0 group-hover:opacity-60 transition-opacity -translate-x-1 group-hover:translate-x-0"
                />
              </p>
              <p className="text-[13px] text-foreground/50 font-body mt-1.5 leading-relaxed">
                {c.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Latest orders */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-audiowide text-sm uppercase tracking-[0.3em]">Son Siparişleriniz</h2>
          {latestOrders.length > 0 ? (
            <Link
              href="/hesabim/siparisler"
              className="text-[10px] font-audiowide uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground border-b border-foreground/10 hover:border-foreground pb-1"
            >
              Tümünü Gör
            </Link>
          ) : null}
        </div>

        {loading ? (
          <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>
        ) : latestOrders.length === 0 ? (
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
            {latestOrders.map((o) => (
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
    </div>
  );
}
