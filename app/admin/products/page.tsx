"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi, ApiError, type AdminProduct } from "@/lib/api";
import { RotateCcw } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { products } = await adminApi.listProducts();
        setProducts(products);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSaved = (p: AdminProduct) =>
    setProducts((list) => list.map((r) => (r.productId === p.productId ? p : r)));

  const filtered = useMemo(() => {
    const term = q.trim().toLocaleLowerCase("tr");
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLocaleLowerCase("tr").includes(term) ||
        p.productId.toLocaleLowerCase("tr").includes(term),
    );
  }, [products, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-audiowide text-2xl uppercase tracking-tight">Ürünler &amp; Stok</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ürün ara…"
          className="border border-foreground/15 bg-background px-3 py-2 text-[13px] font-body focus:outline-none focus:border-foreground w-56"
        />
      </div>

      <p className="text-foreground/40 font-body text-[12px] mb-6">
        İsim ve fiyat değişiklikleri mağazada ve sipariş fiyatında anında geçerli olur. Boş bırakıp
        ↺ ile varsayılana döndürebilirsiniz.
      </p>

      {err ? <p className="text-red-600 text-sm font-body mb-4">{err}</p> : null}

      {loading ? (
        <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm font-body">
            <thead>
              <tr className="text-left font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40 border-b border-foreground/10">
                <th className="py-3 pr-4">Ürün Adı</th>
                <th className="py-3 pr-4">Kod</th>
                <th className="py-3 pr-4 w-36">Fiyat (₺)</th>
                <th className="py-3 pr-4 w-28">Stok</th>
                <th className="py-3 pr-4 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <ProductRowEditor key={row.productId} row={row} onSaved={onSaved} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRowEditor({
  row,
  onSaved,
}: {
  row: AdminProduct;
  onSaved: (p: AdminProduct) => void;
}) {
  const [name, setName] = useState(row.name);
  const [price, setPrice] = useState((row.priceCents / 100).toString());
  const [stock, setStock] = useState(String(row.stock));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Re-sync when the saved row changes (e.g. after revert).
  useEffect(() => {
    setName(row.name);
    setPrice((row.priceCents / 100).toString());
    setStock(String(row.stock));
  }, [row.name, row.priceCents, row.stock]);

  const priceNum = Number(price.replace(",", "."));
  const priceCents = Math.round(priceNum * 100);
  const stockNum = Math.floor(Number(stock));
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    stock !== "" &&
    Number.isFinite(stockNum) &&
    stockNum >= 0;
  const dirty =
    name.trim() !== row.name || priceCents !== row.priceCents || stockNum !== row.stock;
  const overridden = row.nameOverridden || row.priceOverridden;

  const save = async () => {
    if (!valid || !dirty) return;
    setSaving(true);
    setErr(null);
    const patch: { name?: string; priceCents?: number; stock?: number } = {};
    if (name.trim() !== row.name) patch.name = name.trim();
    if (priceCents !== row.priceCents) patch.priceCents = priceCents;
    if (stockNum !== row.stock) patch.stock = stockNum;
    try {
      const { product } = await adminApi.updateProduct(row.productId, patch);
      onSaved(product);
    } catch {
      setErr("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const revert = async () => {
    setSaving(true);
    setErr(null);
    try {
      const { product } = await adminApi.updateProduct(row.productId, {
        name: null,
        priceCents: null,
      });
      onSaved(product);
    } catch {
      setErr("Geri alınamadı");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-foreground/15 bg-background px-2 py-1.5 text-[13px] focus:outline-none focus:border-foreground";

  return (
    <tr className="border-b border-foreground/5 align-top">
      <td className="py-2 pr-4">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        {row.nameOverridden ? (
          <span className="block text-[10px] text-foreground/30 mt-0.5">
            Varsayılan: {row.defaultName}
          </span>
        ) : null}
      </td>
      <td className="py-2 pr-4 text-foreground/40 font-audiowide text-[11px] whitespace-nowrap">
        {row.productId}
      </td>
      <td className="py-2 pr-4">
        <input
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={inputCls + " w-28"}
        />
        {row.priceOverridden ? (
          <span className="block text-[10px] text-foreground/30 mt-0.5">
            Varsayılan: ₺{(row.defaultPriceCents / 100).toFixed(2)}
          </span>
        ) : null}
      </td>
      <td className="py-2 pr-4">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className={inputCls + " w-24"}
        />
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          <button
            disabled={!dirty || !valid || saving}
            onClick={save}
            className="px-3 py-1.5 font-audiowide text-[9px] uppercase tracking-[0.2em] border border-foreground/15 disabled:opacity-30 hover:border-foreground transition-colors"
          >
            Kaydet
          </button>
          {overridden ? (
            <button
              onClick={revert}
              disabled={saving}
              title="Varsayılana döndür"
              className="p-1.5 text-foreground/40 hover:text-foreground disabled:opacity-30"
            >
              <RotateCcw size={14} />
            </button>
          ) : null}
          {err ? <span className="text-[11px] text-red-600">{err}</span> : null}
        </div>
      </td>
    </tr>
  );
}
