"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  adminApi,
  ApiError,
  type AdminOrderSummary,
  type FulfillmentStatus,
  type OrderStatus,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
  PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
  paymentLabel,
  fulfillmentLabel,
  fulfillmentDot,
  itemsSummary,
  liraFromCents,
} from "../labels";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  // Row whose fulfillment status is currently being saved (inline select).
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { orders } = await adminApi.listOrders({
        pageSize: 100,
        status: statusFilter || undefined,
      });
      setOrders(orders);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Same optimistic PATCH the detail page uses, so "Hazırlanıyor → Kargoda"
  // can be done straight from the list without opening each order.
  const setFulfillment = async (id: string, fulfillmentStatus: FulfillmentStatus) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, fulfillmentStatus } : o)));
    setSavingId(id);
    setErr(null);
    try {
      await adminApi.updateOrder(id, { fulfillmentStatus });
    } catch {
      setOrders(prev);
      setErr("Sipariş durumu güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-audiowide text-2xl uppercase tracking-tight">Siparişler</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          className="border border-foreground/15 bg-background px-3 py-2 text-[12px] font-body focus:outline-none focus:border-foreground"
        >
          <option value="">Tüm ödeme durumları</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {paymentLabel[s]}
            </option>
          ))}
        </select>
      </div>

      {err ? <p className="text-red-600 text-sm font-body mb-4">{err}</p> : null}

      {loading ? (
        <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>
      ) : orders.length === 0 ? (
        <p className="text-foreground/40 font-body text-sm">Sipariş bulunamadı.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm font-body">
            <thead>
              <tr className="text-left font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40 border-b border-foreground/10">
                <th className="py-3 pr-4">Sipariş</th>
                <th className="py-3 pr-4">Müşteri</th>
                <th className="py-3 pr-4">Ürünler</th>
                <th className="py-3 pr-4 text-right">Tutar</th>
                <th className="py-3 pr-4">Ödeme</th>
                <th className="py-3 pr-4">Durum</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                // Whole row opens the order (same page the "Siparişi Yönet"
                // e-mail button lands on). The inline select stops propagation
                // so changing a status doesn't also navigate.
                <tr
                  key={o.id}
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                  className="border-b border-foreground/5 hover:bg-foreground/[0.03] cursor-pointer"
                >
                  <td className="py-3 pr-4 font-audiowide text-xs">
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="block text-foreground">{o.user?.name}</span>
                    <span className="block text-foreground/40 text-[12px]">{o.user?.email}</span>
                  </td>
                  <td className="py-3 pr-4 text-foreground/60 max-w-[260px] truncate">
                    {itemsSummary(o.items)}
                  </td>
                  <td className="py-3 pr-4 text-right font-audiowide text-xs whitespace-nowrap">
                    {formatPrice(liraFromCents(o.totalCents))}
                  </td>
                  <td className="py-3 pr-4 text-foreground/60 whitespace-nowrap">
                    {paymentLabel[o.status]}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${fulfillmentDot[o.fulfillmentStatus]}`} />
                      <select
                        value={o.fulfillmentStatus}
                        disabled={savingId === o.id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setFulfillment(o.id, e.target.value as FulfillmentStatus)
                        }
                        className="border border-foreground/15 bg-background px-2 py-1 text-[12px] font-body focus:outline-none focus:border-foreground disabled:opacity-50"
                      >
                        {FULFILLMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {fulfillmentLabel[s]}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground whitespace-nowrap"
                    >
                      Yönet <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
