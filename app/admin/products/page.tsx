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
  type CustomProductData,
} from "@/lib/api";
import { RotateCcw, Plus, X, ImagePlus, Trash2, Pencil, FileText } from "lucide-react";
import { refreshLiveCatalog } from "@/lib/useStock";
import { products as staticProducts } from "@/lib/products";

// Map each built-in product id → the category label it belongs to. The seed's
// `category` field is actually a subcategory of Mutfak (e.g. "saklama-kaplari"),
// so we read `subcategoryLabel` first, falling back to the top-level label.
const PRODUCT_GROUP_LABEL: Record<string, string> = Object.fromEntries(
  staticProducts.map((p) => [p.id, p.subcategoryLabel ?? p.categoryLabel ?? "Diğer"]),
);
// Deterministic order of category sections (matches storefront /kategoriler).
const GROUP_ORDER = [
  "Saklama Kapları",
  "Doğrayıcılar & Rendeler",
  "Servis & Sofra",
  "Mutfak Yardımcıları",
  "Diğer",
];

const BUILTIN_CATEGORY_OPTIONS = [
  { slug: "mutfak", label: "Mutfak" },
  { slug: "saklama-kaplari", label: "Mutfak › Saklama Kapları" },
  { slug: "dograyicilar-rendeler", label: "Mutfak › Doğrayıcılar & Rendeler" },
  { slug: "servis-sofra", label: "Mutfak › Servis & Sofra" },
  { slug: "mutfak-yardimcilari", label: "Mutfak › Mutfak Yardımcıları" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [customProducts, setCustomProducts] = useState<CustomProductData[]>([]);
  const [adminCats, setAdminCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<CustomProductData | null>(null);

  const reload = async () => {
    try {
      const [p, c, cp] = await Promise.all([
        adminApi.listProducts(),
        adminCategoriesApi.list(),
        adminCustomProductsApi.list(),
      ]);
      setProducts(p.products);
      setAdminCats(c.categories);
      setCustomProducts(cp.products);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const deleteCustom = async (id: string, name: string) => {
    if (!confirm(`'${name}' silinsin mi?`)) return;
    try {
      await adminCustomProductsApi.remove(id);
      await refreshLiveCatalog();
      await reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Silinemedi");
    }
  };

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

  const filteredCustom = useMemo(() => {
    const term = q.trim().toLocaleLowerCase("tr");
    if (!term) return customProducts;
    return customProducts.filter(
      (p) =>
        p.name.toLocaleLowerCase("tr").includes(term) ||
        p.id.toLocaleLowerCase("tr").includes(term),
    );
  }, [customProducts, q]);

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
        <ProductFormModal
          adminCats={adminCats}
          existing={null}
          onClose={() => setShowNew(false)}
          onDone={async () => { await refreshLiveCatalog(); await reload(); setShowNew(false); }}
        />
      ) : null}
      {editing ? (
        <ProductFormModal
          adminCats={adminCats}
          existing={editing}
          onClose={() => setEditing(null)}
          onDone={async () => { await refreshLiveCatalog(); await reload(); setEditing(null); }}
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
        <ProductGroups
          builtinRows={filtered}
          customRows={filteredCustom}
          adminCats={adminCats}
          onSaved={onSaved}
          onEdit={setEditing}
          onDelete={deleteCustom}
        />
      )}
    </div>
  );
}

// Built-in top-level + subcategory slug → human label. Custom categories are
// looked up via the adminCats list (label set by the admin themselves).
const BUILTIN_CATEGORY_LABEL: Record<string, string> = {
  mutfak: "Mutfak",
  "genel-ev-urunleri": "Genel Ev Ürünleri",
  "saklama-kaplari": "Saklama Kapları",
  "dograyicilar-rendeler": "Doğrayıcılar & Rendeler",
  "servis-sofra": "Servis & Sofra",
  "mutfak-yardimcilari": "Mutfak Yardımcıları",
};

function ProductGroups({
  builtinRows,
  customRows,
  adminCats,
  onSaved,
  onEdit,
  onDelete,
}: {
  builtinRows: AdminProduct[];
  customRows: CustomProductData[];
  adminCats: AdminCategory[];
  onSaved: (p: AdminProduct) => void;
  onEdit: (p: CustomProductData) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const resolveLabel = (slug: string) =>
    BUILTIN_CATEGORY_LABEL[slug] ??
    adminCats.find((c) => c.slug === slug)?.label ??
    slug;

  // Build a single map: category label → { builtin: AdminProduct[], custom: CustomProductData[] }.
  // Both kinds live in the same section so an admin-added product appears
  // inside its category, not in a separate "Eklediğiniz" bucket.
  const groups = useMemo(() => {
    const byGroup = new Map<string, { builtin: AdminProduct[]; custom: CustomProductData[] }>();
    const ensure = (label: string) => {
      const existing = byGroup.get(label);
      if (existing) return existing;
      const created = { builtin: [] as AdminProduct[], custom: [] as CustomProductData[] };
      byGroup.set(label, created);
      return created;
    };
    for (const r of builtinRows) {
      ensure(PRODUCT_GROUP_LABEL[r.productId] ?? "Diğer").builtin.push(r);
    }
    for (const r of customRows) {
      ensure(resolveLabel(r.categorySlug)).custom.push(r);
    }
    // Known categories first (in GROUP_ORDER), then admin-added alphabetically.
    return [...byGroup.entries()].sort(([a], [b]) => {
      const ia = GROUP_ORDER.indexOf(a);
      const ib = GROUP_ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b, "tr");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtinRows, customRows, adminCats]);

  if (groups.length === 0) {
    return <p className="text-foreground/40 font-body text-sm">Eşleşen ürün yok.</p>;
  }

  return (
    <div className="space-y-10">
      {groups.map(([label, items]) => {
        const total = items.builtin.length + items.custom.length;
        return (
          <section key={label}>
            <div className="flex items-baseline justify-between mb-3 border-b border-foreground/10 pb-2">
              <h2 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60">
                {label}
              </h2>
              <span className="font-audiowide text-[10px] text-foreground/40">
                {total} ürün
              </span>
            </div>

            {items.custom.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {items.custom.map((p) => (
                  <CustomProductRow
                    key={p.id}
                    product={p}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            ) : null}

            {items.builtin.length > 0 ? (
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
                    {items.builtin.map((row) => (
                      <ProductRowEditor key={row.productId} row={row} onSaved={onSaved} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function CustomProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: CustomProductData;
  onEdit: (p: CustomProductData) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const cover = product.imageUrls[0];
  return (
    <li className="flex items-center justify-between border border-foreground/10 p-3 sm:p-4 gap-3 bg-foreground/[0.015]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="w-12 h-12 object-cover bg-foreground/5 shrink-0" />
        ) : (
          <div
            className="w-12 h-12 bg-yellow-50 border border-yellow-200 flex items-center justify-center shrink-0"
            title="Görsel eksik"
          >
            <ImagePlus size={14} className="text-yellow-600" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-foreground truncate">{product.name}</p>
          <p className="text-foreground/40 text-[12px] font-body">
            ₺{(product.priceCents / 100).toFixed(2)}
            {product.imageUrls.length === 0 ? (
              <> · <span className="text-yellow-700">Görselsiz</span></>
            ) : null}
            {" · "}<span className="text-foreground/30">Sizin eklediğiniz</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(product)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-foreground/15 font-audiowide text-[9px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
        >
          <Pencil size={12} /> Düzenle
        </button>
        <button
          onClick={() => onDelete(product.id, product.name)}
          title="Sil"
          className="p-2 text-foreground/40 hover:text-red-600 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
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
  const [editingDesc, setEditingDesc] = useState(false);
  const descriptionOverridden =
    row.shortDescriptionOverride != null || row.descriptionOverride != null;

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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            disabled={!dirty || !valid || saving}
            onClick={save}
            className="px-3 py-1.5 font-audiowide text-[9px] uppercase tracking-[0.2em] border border-foreground/15 disabled:opacity-30 hover:border-foreground transition-colors"
          >
            Kaydet
          </button>
          <button
            onClick={() => setEditingDesc(true)}
            title="Açıklamayı düzenle"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-audiowide text-[9px] uppercase tracking-[0.2em] border transition-colors ${
              descriptionOverridden
                ? "border-foreground text-foreground"
                : "border-foreground/15 text-foreground/60 hover:border-foreground hover:text-foreground"
            }`}
          >
            <FileText size={12} /> Açıklama
          </button>
          {overridden ? (
            <button
              onClick={revert}
              disabled={saving}
              title="İsim/fiyatı varsayılana döndür"
              className="p-1.5 text-foreground/40 hover:text-foreground disabled:opacity-30"
            >
              <RotateCcw size={14} />
            </button>
          ) : null}
          {err ? <span className="text-[11px] text-red-600">{err}</span> : null}
          {editingDesc ? (
            <DescriptionEditorModal
              row={row}
              onClose={() => setEditingDesc(false)}
              onSaved={(p) => { onSaved(p); setEditingDesc(false); }}
            />
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function ProductFormModal({
  adminCats,
  existing,
  onClose,
  onDone,
}: {
  adminCats: AdminCategory[];
  existing: CustomProductData | null;
  onClose: () => void;
  onDone: () => Promise<void> | void;
}) {
  const isEdit = existing != null;
  const [name, setName] = useState(existing?.name ?? "");
  const [categorySlug, setCategorySlug] = useState(existing?.categorySlug ?? "mutfak");
  const [price, setPrice] = useState(existing ? (existing.priceCents / 100).toString() : "");
  const [stock, setStock] = useState("0");
  const [shortDesc, setShortDesc] = useState(existing?.shortDescription ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(existing?.imageUrls ?? []);
  const [isNew, setIsNew] = useState(existing?.badges?.isNew ?? true);
  const [isFeatured, setIsFeatured] = useState(existing?.badges?.isFeatured ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Forces user to acknowledge a zero-image save (so the silent-no-image case
  // can't happen again). Click "Save" once → warns; click again → saves.
  const [confirmedNoImages, setConfirmedNoImages] = useState(false);

  const priceNum = Number(price.replace(",", "."));
  const valid = name.trim().length > 0 && Number.isFinite(priceNum) && priceNum > 0;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr(null);
    setUploading(true);
    setConfirmedNoImages(false);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files).slice(0, 10)) {
        const { secureUrl } = await uploadImage(f, "products");
        uploaded.push(secureUrl);
      }
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, 12));
    } catch {
      // Loud error so the admin can't miss a failed upload — must be cleared
      // by trying again. Don't allow save while this state is showing.
      setErr(
        "Görsel yüklenemedi. Render'da CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET ayarlı olmalı.",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) =>
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!valid || saving || uploading) return;
    // Require explicit confirmation if there are no images.
    if (imageUrls.length === 0 && !confirmedNoImages) {
      setConfirmedNoImages(true);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      if (isEdit && existing) {
        await adminCustomProductsApi.update(existing.id, {
          name: name.trim(),
          categorySlug,
          priceCents: Math.round(priceNum * 100),
          shortDescription: shortDesc.trim() || null,
          description: description.trim() || null,
          imageUrls,
          badges: { isNew, isFeatured },
          isActive: true,
        });
      } else {
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
      }
      await onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (isEdit ? "Güncellenemedi" : "Eklenemedi"));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm pt-10 pb-20 px-4">
      <div className="w-full max-w-2xl bg-background border border-foreground/15 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-audiowide text-lg uppercase tracking-[0.2em]">
            {isEdit ? "Ürünü Düzenle" : "Yeni Ürün"}
          </h2>
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
          {!isEdit ? (
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
          ) : null}
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

        {imageUrls.length === 0 && confirmedNoImages ? (
          <p className="mt-4 text-[13px] text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 font-body">
            Bu ürünün hiç görseli yok — mağazada varsayılan resim gözükür. Yine de kaydetmek için
            tekrar tıklayın, yoksa önce görsel ekleyin.
          </p>
        ) : null}

        <div className="mt-8 flex justify-end gap-3 border-t border-foreground/10 pt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground"
          >
            Vazgeç
          </button>
          <button
            disabled={!valid || saving || uploading}
            onClick={save}
            className="px-6 py-2.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] disabled:opacity-30 hover:opacity-90"
          >
            {saving
              ? (isEdit ? "Kaydediliyor…" : "Ekleniyor…")
              : uploading
              ? "Görsel yükleniyor…"
              : isEdit ? "Değişiklikleri Kaydet" : "Ürünü Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DescriptionEditorModal({
  row,
  onClose,
  onSaved,
}: {
  row: AdminProduct;
  onClose: () => void;
  onSaved: (p: AdminProduct) => void;
}) {
  // Defaults live in the static catalog (lib/products.ts) — the API only
  // tracks the override, not the default.
  const staticP = staticProducts.find((p) => p.id === row.productId);
  const defaultShort = staticP?.shortDescription ?? "";
  const defaultLong = staticP?.description ?? "";

  const [shortDesc, setShortDesc] = useState<string>(
    row.shortDescriptionOverride ?? defaultShort,
  );
  const [longDesc, setLongDesc] = useState<string>(
    row.descriptionOverride ?? defaultLong,
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty =
    shortDesc !== (row.shortDescriptionOverride ?? defaultShort) ||
    longDesc !== (row.descriptionOverride ?? defaultLong);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setErr(null);
    // Send null when the field matches the default → clears the override.
    const patch: { shortDescription?: string | null; description?: string | null } = {};
    const shortTrim = shortDesc.trim();
    const longTrim = longDesc.trim();
    patch.shortDescription = shortTrim === defaultShort.trim() || shortTrim === "" ? null : shortTrim;
    patch.description = longTrim === defaultLong.trim() || longTrim === "" ? null : longTrim;
    try {
      const { product } = await adminApi.updateProduct(row.productId, patch);
      onSaved(product);
    } catch {
      setErr("Kaydedilemedi");
      setSaving(false);
    }
  };

  const revertAll = () => {
    setShortDesc(defaultShort);
    setLongDesc(defaultLong);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm pt-10 pb-20 px-4">
      <div className="w-full max-w-2xl bg-background border border-foreground/15 p-6 md:p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-audiowide text-lg uppercase tracking-[0.2em]">
            Açıklamayı Düzenle
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="p-2 text-foreground/40 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-foreground/40 font-body text-[12px] mb-5">
          {row.name} <span className="text-foreground/30">· {row.productId}</span>
        </p>

        {err ? <p className="mb-4 text-red-600 text-sm font-body">{err}</p> : null}

        <label className="block mb-5">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Kısa Açıklama
          </span>
          <textarea
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            rows={2}
            maxLength={500}
            className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] resize-y focus:outline-none focus:border-foreground"
          />
          <span className="block text-[10px] text-foreground/30 mt-1">
            {row.shortDescriptionOverride != null
              ? `Varsayılan: ${defaultShort.slice(0, 110)}${defaultShort.length > 110 ? "…" : ""}`
              : "Mağazada görünür · Ürün kartı altında özetlenir"}
          </span>
        </label>

        <label className="block mb-5">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Detaylı Açıklama
          </span>
          <textarea
            value={longDesc}
            onChange={(e) => setLongDesc(e.target.value)}
            rows={8}
            maxLength={5000}
            className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] leading-relaxed resize-y focus:outline-none focus:border-foreground whitespace-pre-line"
          />
          <span className="block text-[10px] text-foreground/30 mt-1">
            {row.descriptionOverride != null
              ? "Şu anda özel açıklama gösteriliyor."
              : "Ürün detay sayfasının altında gösterilir · Yeni satırlar korunur"}
          </span>
        </label>

        <div className="mt-8 flex justify-between items-center gap-3 border-t border-foreground/10 pt-6">
          <button
            onClick={revertAll}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-[10px] font-audiowide uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground"
          >
            <RotateCcw size={12} /> Varsayılana Döndür
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground"
            >
              Vazgeç
            </button>
            <button
              disabled={!dirty || saving}
              onClick={save}
              className="px-6 py-2.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] disabled:opacity-30 hover:opacity-90"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
