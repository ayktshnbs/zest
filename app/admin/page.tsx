"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError, type AdminOrderSummary, type StockRow } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { fulfillmentLabel, itemsSummary, liraFromCents } from "./labels";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [o, s] = await Promise.all([
          adminApi.listOrders({ pageSize: 100 }),
          adminApi.listStock(),
        ]);
        setOrders(o.orders);
        setStock(s.stock);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>;
  if (err) return <p className="text-red-600 font-body text-sm">{err}</p>;

  const revenue = orders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + o.totalCents, 0);
  const processing = orders.filter((o) => o.fulfillmentStatus === "processing").length;
  const shipped = orders.filter((o) => o.fulfillmentStatus === "shipped").length;
  const lowStock = stock.filter((s) => s.stock <= 5).sort((a, b) => a.stock - b.stock);
  const recent = orders.slice(0, 6);

  const tiles = [
    { label: "Toplam Sipariş", value: String(orders.length) },
    { label: "Hazırlanan", value: String(processing) },
    { label: "Kargodaki", value: String(shipped) },
    { label: "Ödenen Ciro", value: formatPrice(liraFromCents(revenue)) },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="border border-foreground/10 p-6">
            <p className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40">
              {t.label}
            </p>
            <p className="font-audiowide text-2xl md:text-3xl tracking-tight mt-3">{t.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-audiowide text-sm uppercase tracking-[0.3em]">Son Siparişler</h2>
          <Link
            href="/admin/orders"
            className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground border-b border-foreground/10 hover:border-foreground"
          >
            Tümü
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-foreground/40 font-body text-sm">Henüz sipariş yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm font-body">
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-foreground/5">
                    <td className="py-3 pr-4 font-audiowide text-xs">
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-foreground/70">{o.user?.name}</td>
                    <td className="py-3 pr-4 text-foreground/50 max-w-[240px] truncate">
                      {itemsSummary(o.items)}
                    </td>
                    <td className="py-3 pr-4 text-foreground/60">
                      {fulfillmentLabel[o.fulfillmentStatus]}
                    </td>
                    <td className="py-3 text-right font-audiowide text-xs whitespace-nowrap">
                      {formatPrice(liraFromCents(o.totalCents))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-audiowide text-sm uppercase tracking-[0.3em] mb-4">
          Düşük Stok ({lowStock.length})
        </h2>
        {lowStock.length === 0 ? (
          <p className="text-foreground/40 font-body text-sm">Tüm ürünlerde yeterli stok var.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lowStock.map((s) => (
              <Link
                key={s.productId}
                href="/admin/products"
                className="flex items-center gap-2 border border-foreground/10 px-3 py-2 text-[12px] font-body hover:border-foreground transition-colors"
              >
                <span className="text-foreground/70 max-w-[180px] truncate">
                  {s.name ?? s.productId}
                </span>
                <span
                  className={`font-audiowide text-[11px] ${
                    s.stock === 0 ? "text-red-600" : "text-yellow-600"
                  }`}
                >
                  {s.stock}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
