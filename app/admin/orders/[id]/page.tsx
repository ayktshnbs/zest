"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  adminApi,
  ApiError,
  type Order,
  type OrderStatus,
  type FulfillmentStatus,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
  PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
  paymentLabel,
  fulfillmentLabel,
  liraFromCents,
} from "../../labels";

export default function AdminOrderDetail({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { order, customer } = await adminApi.getOrder(params.id);
        setOrder(order);
        setCustomer(customer);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const patch = async (p: { status?: OrderStatus; fulfillmentStatus?: FulfillmentStatus }) => {
    if (!order) return;
    const prev = order;
    setOrder({ ...order, ...p }); // optimistic
    setSaving(true);
    setErr(null);
    try {
      const { order: updated } = await adminApi.updateOrder(order.id, p);
      setOrder(updated);
    } catch {
      setOrder(prev);
      setErr("Güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>;
  if (err && !order) return <p className="text-red-600 font-body text-sm">{err}</p>;
  if (!order) return null;

  const a = order.shippingAddress;

  return (
    <div className="space-y-10">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground"
      >
        <ArrowLeft size={12} /> Siparişler
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight">
            {order.orderNumber}
          </h1>
          <p className="text-foreground/40 font-body text-sm mt-1">
            {new Date(order.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
        <div className="flex gap-3">
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40">
              Ödeme
            </span>
            <select
              value={order.status}
              disabled={saving}
              onChange={(e) => patch({ status: e.target.value as OrderStatus })}
              className="mt-1 block border border-foreground/15 bg-background px-2 py-1.5 text-[13px] font-body focus:outline-none focus:border-foreground disabled:opacity-50"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {paymentLabel[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40">
              Sipariş Durumu
            </span>
            <select
              value={order.fulfillmentStatus}
              disabled={saving}
              onChange={(e) => patch({ fulfillmentStatus: e.target.value as FulfillmentStatus })}
              className="mt-1 block border border-foreground/15 bg-background px-2 py-1.5 text-[13px] font-body focus:outline-none focus:border-foreground disabled:opacity-50"
            >
              {FULFILLMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {fulfillmentLabel[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-foreground/10 p-6 space-y-4">
          <h2 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60">
            Müşteri
          </h2>
          <div className="text-sm font-body text-foreground/80 space-y-1">
            <p className="text-foreground">{customer?.name ?? a.fullName}</p>
            {customer?.email ? <p>{customer.email}</p> : null}
            {a.phone ? <p>{a.phone}</p> : null}
          </div>
          <h2 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60 pt-2">
            Teslimat Adresi
          </h2>
          <div className="text-sm font-body text-foreground/80 space-y-1">
            <p>{a.fullName}</p>
            <p>
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
            </p>
            <p>{[a.state, a.city, a.postalCode].filter(Boolean).join(", ")}</p>
            <p>{a.country}</p>
          </div>
          {order.notes ? (
            <p className="text-[12px] text-foreground/50 border-t border-foreground/10 pt-3 whitespace-pre-wrap">
              {order.notes}
            </p>
          ) : null}
        </div>

        <div className="border border-foreground/10 p-6">
          <h2 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60 mb-4">
            Ürünler
          </h2>
          <table className="w-full text-sm font-body">
            <tbody>
              {order.items.map((it, i) => (
                <tr key={i} className="border-b border-foreground/5">
                  <td className="py-2 pr-2 text-foreground/80">{it.name}</td>
                  <td className="py-2 px-2 text-foreground/50 whitespace-nowrap">{it.quantity}×</td>
                  <td className="py-2 pl-2 text-right whitespace-nowrap">
                    {formatPrice(liraFromCents(it.unitPriceCents * it.quantity))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 space-y-1 text-sm font-body">
            <Row label="Ara toplam" value={formatPrice(liraFromCents(order.subtotalCents))} />
            <Row
              label="Kargo"
              value={
                order.shippingCents === 0
                  ? "Ücretsiz"
                  : formatPrice(liraFromCents(order.shippingCents))
              }
            />
            <div className="flex justify-between border-t border-foreground/10 pt-2 mt-2 font-audiowide">
              <span>Toplam</span>
              <span>{formatPrice(liraFromCents(order.totalCents))}</span>
            </div>
          </div>
        </div>
      </div>

      {err ? <p className="text-red-600 font-body text-sm">{err}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-foreground/60">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
