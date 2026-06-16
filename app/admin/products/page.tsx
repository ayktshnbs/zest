"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminApi,
  adminCategoriesApi,
  adminCustomProductsApi,
  ApiError,
  uploadImage,
  type AdminProduct,
  type AdminCategory,
} from "@/lib/api";
import { RotateCcw, Plus, X, ImagePlus, Trash2 } from "lucide-react";
import { refreshLiveCatalog } from "@/lib/useStock";

const BUILTIN_CATEGORY_OPTIONS = [
  { slug: "mutfak", label: "Mutfak" },
  { slug: "saklama-kaplari", label: "Mutfak › Saklama Kapları" },
  { slug: "dograyicilar-rendeler", label: "Mutfak › Doğrayıcılar & Rendeler" },
  { slug: "servis-sofra", label: "Mutfak › Servis & Sofra" },
  { slug: "mutfak-yardimcilari", label: "Mutfak › Mutfak Yardımcıları" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [adminCats, setAdminCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);

  const reload = async () => {
    try {
      const [p, c] = await Promise.all([adminApi.listProducts(), adminCategoriesApi.list()]);
      setProducts(p.products);
      setAdminCats(c.categories);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

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
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün ara…"
            className="border border-foreground/15 bg-background px-3 py-2 text-[13px] font-body focus:outline-none focus:border-foreground w-56"
          />
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90"
          >
            <Plus size={12} /> Yeni Ürün
          </button>
        </div>
      </div>

      {showNew ? (
        <NewProductModal
          adminCats={adminCats}
          onClose={() => setShowNew(false)}
          onCreated={async () => { await refreshLiveCatalog(); await reload(); setShowNew(false); }}
        />
      ) : null}

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

function NewProductModal({
  adminCats,
  onClose,
  onCreated,
}: {
  adminCats: AdminCategory[];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("mutfak");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const priceNum = Number(price.replace(",", "."));
  const valid = name.trim().length > 0 && Number.isFinite(priceNum) && priceNum > 0;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr(null);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files).slice(0, 10)) {
        const { secureUrl } = await uploadImage(f, "products");
        uploaded.push(secureUrl);
      }
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, 12));
    } catch {
      setErr("Görsel yüklenemedi (Cloudinary anahtarları doğru mu?)");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) =>
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setErr(null);
    try {
      await adminCustomProductsApi.create({
        name: name.trim(),
        categorySlug,
        priceCents: Math.round(priceNum * 100),
        shortDescription: shortDesc.trim() || null,
        description: description.trim() || null,
        imageUrls,
        badges: { isNew, isFeatured },
        isActive: true,
        initialStock: Math.max(0, Math.floor(Number(stock) || 0)),
      });
      await onCreated();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Eklenemedi");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm pt-10 pb-20 px-4">
      <div className="w-full max-w-2xl bg-background border border-foreground/15 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-audiowide text-lg uppercase tracking-[0.2em]">Yeni Ürün</h2>
          <button onClick={onClose} aria-label="Kapat" className="p-2 text-foreground/40 hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {err ? <p className="mb-4 text-red-600 text-sm font-body">{err}</p> : null}

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">İsim</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yeni Ürün"
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Kategori</span>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            >
              <optgroup label="Yerleşik">
                {BUILTIN_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </optgroup>
              {adminCats.length > 0 ? (
                <optgroup label="Özel">
                  {adminCats.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </label>
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Fiyat (₺)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Başlangıç Stok</span>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Kısa Açıklama</span>
            <input
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Açıklama</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-foreground"
            />
          </label>
        </div>

        <div className="mt-6">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50 block mb-2">
            Görseller
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrls.map((u, i) => (
              <div key={u} className="relative w-20 h-20 border border-foreground/10">
                <img src={u} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 bg-background border border-foreground/20 p-0.5 text-foreground/50 hover:text-red-600"
                  aria-label="Sil"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-foreground/20 cursor-pointer hover:border-foreground transition-colors text-[12px] font-body">
              <ImagePlus size={14} />
              {uploading ? "Yükleniyor…" : "Görsel Ekle"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-[12px] font-body">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="accent-foreground" />
            Yeni rozeti
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] font-body">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="accent-foreground" />
            Öne çıkar
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-foreground/10 pt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground"
          >
            Vazgeç
          </button>
          <button
            disabled={!valid || saving}
            onClick={save}
            className="px-6 py-2.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] disabled:opacity-30 hover:opacity-90"
          >
            {saving ? "Ekleniyor…" : "Ürünü Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
