"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  adminApi,
  ApiError,
  type AdminOrderSummary,
  type OrderStatus,
  type StockRow,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";

const STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"];
const statusLabel: Record<OrderStatus, string> = {
  pending: "Beklemede",
  paid: "Ödendi",
  fulfilled: "Gönderildi",
  cancelled: "İptal",
  refunded: "İade",
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const [tab, setTab] = useState<"orders" | "stock">("orders");
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Non-admins (incl. signed-out, once auth resolves) are bounced home.
  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/");
  }, [isLoading, isAdmin, router]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { orders } = await adminApi.listOrders({ pageSize: 100 });
      setOrders(orders);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStock = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { stock } = await adminApi.listStock();
      setStock(stock);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "orders") loadOrders();
    else loadStock();
  }, [isAdmin, tab, loadOrders, loadStock]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const prev = orders;
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await adminApi.updateOrderStatus(id, status);
    } catch {
      setOrders(prev); // revert on failure
      setErr("Durum güncellenemedi.");
    }
  };

  const saveStock = async (productId: string, value: number) => {
    try {
      await adminApi.setStock(productId, value);
      setStock((s) => s.map((r) => (r.productId === productId ? { ...r, stock: value } : r)));
    } catch {
      setErr("Stok güncellenemedi.");
    }
  };

  if (isLoading || !isAdmin) {
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
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40">
          Yönetim Paneli
        </span>
        <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight mt-2">
          Siparişler & Stok
        </h1>

        <div className="mt-8 flex gap-2">
          {(["orders", "stock"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 font-audiowide text-[10px] uppercase tracking-[0.3em] border transition-colors ${
                tab === t
                  ? "border-foreground text-foreground"
                  : "border-foreground/15 text-foreground/40 hover:text-foreground"
              }`}
            >
              {t === "orders" ? "Siparişler" : "Stok"}
            </button>
          ))}
        </div>

        {err ? <p className="mt-6 text-[13px] text-red-600 font-body">{err}</p> : null}

        {loading ? (
          <p className="mt-10 text-foreground/40 font-body text-sm">Yükleniyor…</p>
        ) : tab === "orders" ? (
          <OrdersTable orders={orders} onStatus={updateStatus} />
        ) : (
          <StockTable stock={stock} onSave={saveStock} />
        )}
      </div>
    </main>
  );
}

function OrdersTable({
  orders,
  onStatus,
}: {
  orders: AdminOrderSummary[];
  onStatus: (id: string, status: OrderStatus) => void;
}) {
  if (orders.length === 0) {
    return <p className="mt-10 text-foreground/40 font-body text-sm">Henüz sipariş yok.</p>;
  }
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-sm font-body">
        <thead>
          <tr className="text-left font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40 border-b border-foreground/10">
            <th className="py-3 pr-4">Sipariş No</th>
            <th className="py-3 pr-4">Müşteri</th>
            <th className="py-3 pr-4">Tarih</th>
            <th className="py-3 pr-4 text-right">Tutar</th>
            <th className="py-3 pr-4">Durum</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-foreground/5">
              <td className="py-3 pr-4 font-audiowide text-xs">{o.orderNumber}</td>
              <td className="py-3 pr-4">
                <span className="block text-foreground">{o.user?.name}</span>
                <span className="block text-foreground/40 text-[12px]">{o.user?.email}</span>
              </td>
              <td className="py-3 pr-4 text-foreground/60 whitespace-nowrap">
                {new Date(o.createdAt).toLocaleDateString("tr-TR")}
              </td>
              <td className="py-3 pr-4 text-right font-audiowide text-xs whitespace-nowrap">
                {formatPrice(o.totalCents / 100)}
              </td>
              <td className="py-3 pr-4">
                <select
                  value={o.status}
                  onChange={(e) => onStatus(o.id, e.target.value as OrderStatus)}
                  className="border border-foreground/15 bg-background px-2 py-1 text-[12px] font-body focus:outline-none focus:border-foreground"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockTable({
  stock,
  onSave,
}: {
  stock: StockRow[];
  onSave: (productId: string, value: number) => void;
}) {
  if (stock.length === 0) {
    return (
      <p className="mt-10 text-foreground/40 font-body text-sm">
        Stok kaydı yok — `npm run seed:inventory` çalıştırın.
      </p>
    );
  }
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-sm font-body">
        <thead>
          <tr className="text-left font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40 border-b border-foreground/10">
            <th className="py-3 pr-4">Ürün</th>
            <th className="py-3 pr-4">Kod</th>
            <th className="py-3 pr-4 w-48">Stok</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((r) => (
            <StockRowEditor key={r.productId} row={r} onSave={onSave} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockRowEditor({
  row,
  onSave,
}: {
  row: StockRow;
  onSave: (productId: string, value: number) => void;
}) {
  const [value, setValue] = useState(String(row.stock));
  const dirty = value !== String(row.stock);
  return (
    <tr className="border-b border-foreground/5">
      <td className="py-3 pr-4 text-foreground">{row.name ?? "—"}</td>
      <td className="py-3 pr-4 text-foreground/40 font-audiowide text-[11px]">{row.productId}</td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-24 border border-foreground/15 bg-background px-2 py-1 text-[13px] focus:outline-none focus:border-foreground"
          />
          <button
            disabled={!dirty || value === ""}
            onClick={() => onSave(row.productId, Math.max(0, Math.floor(Number(value))))}
            className="px-3 py-1 font-audiowide text-[9px] uppercase tracking-[0.2em] border border-foreground/15 disabled:opacity-30 hover:border-foreground transition-colors"
          >
            Kaydet
          </button>
        </div>
      </td>
    </tr>
  );
}
