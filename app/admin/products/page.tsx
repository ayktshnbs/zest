"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminApi,
  adminCategoriesApi,
  adminCustomProductsApi,
  ApiError,
  batchUploadImages,
  type AdminProduct,
  type AdminCategory,
  type CustomProductData,
  type ProductVariant,
} from "@/lib/api";
import { RotateCcw, Plus, X, ImagePlus, Trash2, Pencil } from "lucide-react";
import { refreshLiveCatalog, useLiveCatalog } from "@/lib/useStock";
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
  "Organizerlar",
  "Diğer",
];

const BUILTIN_CATEGORY_OPTIONS = [
  { slug: "mutfak", label: "Mutfak" },
  { slug: "saklama-kaplari", label: "Mutfak › Saklama Kapları" },
  { slug: "dograyicilar-rendeler", label: "Mutfak › Doğrayıcılar & Rendeler" },
  { slug: "servis-sofra", label: "Mutfak › Servis & Sofra" },
  { slug: "mutfak-yardimcilari", label: "Mutfak › Mutfak Yardımcıları" },
  { slug: "genel-ev-urunleri", label: "Ev Gereçleri" },
  { slug: "organizerlar", label: "Ev Gereçleri › Organizerlar" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [customProducts, setCustomProducts] = useState<CustomProductData[]>([]);
  const [adminCats, setAdminCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  // Variants are exposed by the public catalog endpoint and surfaced via
  // useLiveCatalog so the editor can prefill them.
  const liveCatalog = useLiveCatalog();
  const [editing, setEditing] = useState<CustomProductData | null>(null);
  const [editingBuiltin, setEditingBuiltin] = useState<AdminProduct | null>(null);

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
          existingVariants={[]}
          onClose={() => setShowNew(false)}
          onDone={async () => { await refreshLiveCatalog(); await reload(); setShowNew(false); }}
        />
      ) : null}
      {editing ? (
        <ProductFormModal
          adminCats={adminCats}
          existing={editing}
          existingVariants={liveCatalog.variants[editing.id] ?? []}
          onClose={() => setEditing(null)}
          onDone={async () => { await refreshLiveCatalog(); await reload(); setEditing(null); }}
        />
      ) : null}
      {editingBuiltin ? (
        <BuiltinProductFormModal
          row={editingBuiltin}
          existingVariants={liveCatalog.variants[editingBuiltin.productId] ?? []}
          onClose={() => setEditingBuiltin(null)}
          onSaved={(updated) => {
            onSaved(updated);
          }}
          onDone={async () => {
            await refreshLiveCatalog();
            await reload();
            setEditingBuiltin(null);
          }}
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
          onEditBuiltin={setEditingBuiltin}
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
  "genel-ev-urunleri": "Ev Gereçleri",
  "saklama-kaplari": "Saklama Kapları",
  "dograyicilar-rendeler": "Doğrayıcılar & Rendeler",
  "servis-sofra": "Servis & Sofra",
  "mutfak-yardimcilari": "Mutfak Yardımcıları",
  organizerlar: "Organizerlar",
};

function ProductGroups({
  builtinRows,
  customRows,
  adminCats,
  onSaved,
  onEdit,
  onEditBuiltin,
  onDelete,
}: {
  builtinRows: AdminProduct[];
  customRows: CustomProductData[];
  adminCats: AdminCategory[];
  onSaved: (p: AdminProduct) => void;
  onEdit: (p: CustomProductData) => void;
  onEditBuiltin: (p: AdminProduct) => void;
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
              <ul className="space-y-2">
                {items.builtin.map((row) => (
                  <BuiltinProductCardRow
                    key={row.productId}
                    row={row}
                    onSaved={onSaved}
                    onEdit={onEditBuiltin}
                  />
                ))}
              </ul>
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

// Built-in product card row — same visual shape as CustomProductRow so the
// admin sees one consistent list (thumb · name + price · Düzenle · Trash).
// All editing happens in the full BuiltinProductFormModal opened by Düzenle.
// The trash icon RETIRES the product (sets the is_active override to false)
// because the seed lives in lib/products.ts — there is no hard delete for
// built-ins. Retired rows render faded with a Restore action in place of
// the trash icon.
function BuiltinProductCardRow({
  row,
  onSaved,
  onEdit,
}: {
  row: AdminProduct;
  onSaved: (p: AdminProduct) => void;
  onEdit: (row: AdminProduct) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Cover precedence: admin image override → static catalog images → singleton.
  const staticP = staticProducts.find((p) => p.id === row.productId);
  const cover =
    (row.imageUrlsOverride && row.imageUrlsOverride[0]) ||
    staticP?.images?.[0] ||
    staticP?.imageUrl ||
    null;

  const isRetired = row.isActive === false;

  const setActive = async (next: boolean) => {
    const verb = next ? "geri alınsın" : "mağazadan gizlensin";
    if (!confirm(`'${row.name}' ${verb} mı?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const { product } = await adminApi.updateProduct(row.productId, { isActive: next });
      onSaved(product);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className={`flex items-center justify-between border border-foreground/10 p-3 sm:p-4 gap-3 bg-foreground/[0.015] ${
        isRetired ? "opacity-50" : ""
      }`}
    >
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
          <p className="text-foreground truncate">{row.name}</p>
          <p className="text-foreground/40 text-[12px] font-body">
            ₺{(row.priceCents / 100).toFixed(2)}
            {" · "}<span className="text-foreground/30">Yerleşik · {row.productId}</span>
            {isRetired ? (
              <> · <span className="text-yellow-700">Gizlendi</span></>
            ) : null}
            {err ? <> · <span className="text-red-600">{err}</span></> : null}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-foreground/15 font-audiowide text-[9px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
        >
          <Pencil size={12} /> Düzenle
        </button>
        {isRetired ? (
          <button
            onClick={() => setActive(true)}
            disabled={busy}
            title="Mağazaya geri al"
            className="p-2 text-foreground/40 hover:text-green-700 transition-colors disabled:opacity-30"
          >
            <RotateCcw size={14} />
          </button>
        ) : (
          <button
            onClick={() => setActive(false)}
            disabled={busy}
            title="Mağazadan gizle"
            className="p-2 text-foreground/40 hover:text-red-600 transition-colors disabled:opacity-30"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  );
}

// Editable row for one color variant inside the product form modal.
type DraftVariant = {
  colorKey: string;
  colorLabel: string;
  colorHex: string;
  stock: number;
  imageUrls: string[];
};

const slugifyColor = (s: string) => {
  const tr: Record<string, string> = { ı:"i", İ:"i", ş:"s", Ş:"s", ğ:"g", Ğ:"g", ü:"u", Ü:"u", ö:"o", Ö:"o", ç:"c", Ç:"c" };
  return s.toLowerCase().replace(/[ıİşŞğĞüÜöÖçÇ]/g, (c) => tr[c] ?? c)
    .normalize("NFKD").replace(/\p{M}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};

function ProductFormModal({
  adminCats,
  existing,
  existingVariants,
  onClose,
  onDone,
}: {
  adminCats: AdminCategory[];
  existing: CustomProductData | null;
  existingVariants: ProductVariant[];
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
  // Set-style structural fields + per-color variants.
  const [volumeLabel, setVolumeLabel] = useState<string>(existing?.volumeLabel ?? "");
  const [setSize, setSetSize] = useState<string>(existing?.setSize ? String(existing.setSize) : "");
  const [variants, setVariants] = useState<DraftVariant[]>(
    existingVariants.map((v) => ({
      colorKey: v.colorKey,
      colorLabel: v.colorLabel,
      colorHex: v.colorHex,
      stock: v.stock,
      imageUrls: v.imageUrls,
    })),
  );
  const [variantUploadingKey, setVariantUploadingKey] = useState<string | null>(null);
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
      const batch = Array.from(files).slice(0, 10);
      // Parallel upload + per-file error capture: a single bad file (too big,
      // network blip) no longer throws away the rest.
      const { urls, errors } = await batchUploadImages(batch, "products");
      if (urls.length > 0) {
        setImageUrls((prev) => [...prev, ...urls].slice(0, 12));
      }
      if (errors.length > 0) {
        setErr(`${urls.length}/${batch.length} yüklendi · ${errors.join(" · ")}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) =>
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));

  // ── Variant helpers ───────────────────────────────────────────────
  const addVariant = () => {
    setVariants((prev) => {
      // Default new color: pick a fresh slug to avoid colliding with existing ones.
      let n = prev.length + 1;
      let key = `renk-${n}`;
      while (prev.some((v) => v.colorKey === key)) {
        n += 1;
        key = `renk-${n}`;
      }
      return [...prev, { colorKey: key, colorLabel: `Renk ${n}`, colorHex: "#888888", stock: 0, imageUrls: [] }];
    });
  };
  const removeVariant = (key: string) =>
    setVariants((prev) => prev.filter((v) => v.colorKey !== key));
  const updateVariant = (key: string, patch: Partial<DraftVariant>) =>
    setVariants((prev) => prev.map((v) => (v.colorKey === key ? { ...v, ...patch } : v)));
  // Re-slug when the label changes, but only if the key was auto-generated
  // (i.e. matches the slug of the previous label).
  const updateVariantLabel = (key: string, label: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.colorKey !== key) return v;
        const prevLabelSlug = slugifyColor(v.colorLabel);
        const newKey = v.colorKey === prevLabelSlug || v.colorKey.startsWith("renk-")
          ? slugifyColor(label) || v.colorKey
          : v.colorKey;
        return { ...v, colorLabel: label, colorKey: newKey };
      }),
    );
  };
  const handleVariantFiles = async (key: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr(null);
    setVariantUploadingKey(key);
    try {
      const batch = Array.from(files).slice(0, 10);
      const { urls, errors } = await batchUploadImages(batch, "products");
      if (urls.length > 0) {
        setVariants((prev) =>
          prev.map((v) =>
            v.colorKey === key ? { ...v, imageUrls: [...v.imageUrls, ...urls].slice(0, 12) } : v,
          ),
        );
      }
      if (errors.length > 0) {
        setErr(`${urls.length}/${batch.length} yüklendi · ${errors.join(" · ")}`);
      }
    } finally {
      setVariantUploadingKey(null);
    }
  };
  const removeVariantImage = (key: string, idx: number) =>
    setVariants((prev) =>
      prev.map((v) =>
        v.colorKey === key ? { ...v, imageUrls: v.imageUrls.filter((_, i) => i !== idx) } : v,
      ),
    );

  const hasVariants = variants.length > 0;
  const variantsValid =
    !hasVariants ||
    variants.every(
      (v) =>
        v.colorKey.trim().length > 0 &&
        v.colorLabel.trim().length > 0 &&
        /^#[0-9a-fA-F]{6}$/.test(v.colorHex) &&
        v.stock >= 0,
    );
  const duplicateKeys = new Set(
    variants
      .map((v) => v.colorKey)
      .filter((k, i, arr) => arr.indexOf(k) !== i),
  );

  const save = async () => {
    if (!valid || saving || uploading || variantUploadingKey) return;
    if (!variantsValid) { setErr("Renk varyantı eksik veya hatalı."); return; }
    if (duplicateKeys.size > 0) {
      setErr(`Aynı renk anahtarı iki kez kullanılamaz: ${[...duplicateKeys].join(", ")}`);
      return;
    }
    // Image rule applies only to non-variant products (variants carry their
    // own image galleries).
    if (!hasVariants && imageUrls.length === 0 && !confirmedNoImages) {
      setConfirmedNoImages(true);
      return;
    }
    setSaving(true);
    setErr(null);
    const setSizeNum = setSize.trim() ? Math.floor(Number(setSize)) : null;
    const variantPayload = hasVariants
      ? variants.map((v) => ({
          colorKey: v.colorKey.trim(),
          colorLabel: v.colorLabel.trim(),
          colorHex: v.colorHex.trim(),
          stock: Math.max(0, Math.floor(v.stock || 0)),
          imageUrls: v.imageUrls,
        }))
      : undefined;
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
          volumeLabel: volumeLabel.trim() || null,
          setSize: Number.isFinite(setSizeNum as number) && (setSizeNum as number) > 0 ? setSizeNum : null,
          ...(variantPayload ? { variants: variantPayload } : { variants: [] }),
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
          volumeLabel: volumeLabel.trim() || null,
          setSize: Number.isFinite(setSizeNum as number) && (setSizeNum as number) > 0 ? setSizeNum : null,
          ...(variantPayload ? { variants: variantPayload } : {}),
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

        {/* ── Set-style fields (volume + set size) ────────────────── */}
        <div className="mt-8 pt-6 border-t border-foreground/10">
          <p className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/60 mb-3">
            Set Bilgileri <span className="text-foreground/30">(opsiyonel)</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
                Hacim / Boy
              </span>
              <input
                value={volumeLabel}
                onChange={(e) => setVolumeLabel(e.target.value)}
                placeholder="600ml, 1L, Orta…"
                className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
                Set Boyutu
              </span>
              <input
                type="number"
                min={1}
                value={setSize}
                onChange={(e) => setSetSize(e.target.value)}
                placeholder="3, 6, 12…"
                className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
              />
            </label>
          </div>
        </div>

        {/* ── Color variants editor ───────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <p className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/60">
              Renk Varyantları <span className="text-foreground/30">({variants.length})</span>
            </p>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-foreground/15 font-audiowide text-[9px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
            >
              <Plus size={12} /> Renk Ekle
            </button>
          </div>
          {hasVariants ? (
            <p className="text-foreground/40 font-body text-[11px] mb-4">
              Renkleri eklediğinizde, mağazada müşteri rengi seçer. Stok her renk için ayrı tutulur ve görseller seçime göre değişir.
            </p>
          ) : (
            <p className="text-foreground/40 font-body text-[11px] mb-4">
              Bu ürün renk seçeneksiz tek üründür. Renk eklemek isterseniz yukarıdaki butonu kullanın.
            </p>
          )}
          <div className="space-y-4">
            {variants.map((v) => {
              const isDup = duplicateKeys.has(v.colorKey);
              const isUploadingThis = variantUploadingKey === v.colorKey;
              const hexOk = /^#[0-9a-fA-F]{6}$/.test(v.colorHex);
              return (
                <div key={v.colorKey} className="border border-foreground/10 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="color"
                      value={hexOk ? v.colorHex : "#888888"}
                      onChange={(e) => updateVariant(v.colorKey, { colorHex: e.target.value })}
                      className="w-12 h-12 shrink-0 border border-foreground/15 cursor-pointer"
                      aria-label={`${v.colorLabel} rengi`}
                    />
                    <div className="grid sm:grid-cols-3 gap-3 flex-1">
                      <label className="block">
                        <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
                          Etiket
                        </span>
                        <input
                          value={v.colorLabel}
                          onChange={(e) => updateVariantLabel(v.colorKey, e.target.value)}
                          placeholder="Bej, Siyah…"
                          className="mt-1 w-full border border-foreground/15 bg-background px-2 py-1.5 text-[13px] focus:outline-none focus:border-foreground"
                        />
                      </label>
                      <label className="block">
                        <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
                          Slug
                        </span>
                        <input
                          value={v.colorKey}
                          onChange={(e) =>
                            updateVariant(v.colorKey, {
                              colorKey: slugifyColor(e.target.value) || v.colorKey,
                            })
                          }
                          className={`mt-1 w-full border bg-background px-2 py-1.5 text-[13px] focus:outline-none ${
                            isDup ? "border-red-400 focus:border-red-600" : "border-foreground/15 focus:border-foreground"
                          }`}
                        />
                        {isDup ? (
                          <span className="block text-[10px] text-red-600 mt-0.5">Bu slug zaten kullanılıyor</span>
                        ) : null}
                      </label>
                      <label className="block">
                        <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
                          Stok
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(v.colorKey, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                          }
                          className="mt-1 w-full border border-foreground/15 bg-background px-2 py-1.5 text-[13px] focus:outline-none focus:border-foreground"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(v.colorKey)}
                      title="Rengi sil"
                      className="p-2 text-foreground/40 hover:text-red-600 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-15">
                    {v.imageUrls.map((u, i) => (
                      <div key={u + i} className="relative w-16 h-16 border border-foreground/10">
                        <img src={u} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(v.colorKey, i)}
                          className="absolute -top-2 -right-2 bg-background border border-foreground/20 p-0.5 text-foreground/50 hover:text-red-600"
                          aria-label="Sil"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-foreground/20 cursor-pointer hover:border-foreground transition-colors text-[11px] font-body">
                      <ImagePlus size={12} />
                      {isUploadingThis ? "Yükleniyor…" : "Görsel Ekle"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleVariantFiles(v.colorKey, e.target.files)}
                        disabled={variantUploadingKey != null}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
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

// ─────────────────────────────────────────────────────────────────────────
// Built-in product editor: same shape as ProductFormModal but pre-loaded
// from the static catalog + admin overrides, and persisted through the
// built-in /api/admin/products/:productId endpoint (which now accepts
// imageUrls + variants since migration 018+019).
// ─────────────────────────────────────────────────────────────────────────
function BuiltinProductFormModal({
  row,
  existingVariants,
  onClose,
  onSaved,
  onDone,
}: {
  row: AdminProduct;
  existingVariants: ProductVariant[];
  onClose: () => void;
  onSaved: (p: AdminProduct) => void;
  onDone: () => Promise<void> | void;
}) {
  const staticP = staticProducts.find((p) => p.id === row.productId);
  const defaultShort = staticP?.shortDescription ?? "";
  const defaultLong = staticP?.description ?? "";
  // Image precedence: admin override > static images > single cover.
  const initialImages =
    row.imageUrlsOverride && row.imageUrlsOverride.length > 0
      ? row.imageUrlsOverride
      : staticP?.images && staticP.images.length > 0
      ? staticP.images
      : staticP?.imageUrl
      ? [staticP.imageUrl]
      : [];
  const subcatLabel =
    staticP?.subcategoryLabel ?? staticP?.categoryLabel ?? row.productId;

  const [name, setName] = useState(row.name);
  const [price, setPrice] = useState((row.priceCents / 100).toString());
  const [stock, setStock] = useState(String(row.stock));
  const [shortDesc, setShortDesc] = useState<string>(
    row.shortDescriptionOverride ?? defaultShort,
  );
  const [description, setDescription] = useState<string>(
    row.descriptionOverride ?? defaultLong,
  );
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  // Set Bilgileri (parity with custom products). Built-ins don't store these
  // in the static catalog; the override row holds whatever the admin enters.
  const [volumeLabel, setVolumeLabel] = useState<string>(row.volumeLabelOverride ?? "");
  const [setSize, setSetSize] = useState<string>(
    row.setSizeOverride != null ? String(row.setSizeOverride) : "",
  );
  // Badges. Default to the static catalog flags when no override is set; the
  // admin can flip them and we save the FULL effective state as an override.
  const initialBadges = row.badgesOverride ?? {
    isNew: staticP?.isNew ?? false,
    isFeatured: staticP?.isFeatured ?? false,
  };
  const [isNew, setIsNew] = useState<boolean>(Boolean(initialBadges.isNew));
  const [isFeatured, setIsFeatured] = useState<boolean>(Boolean(initialBadges.isFeatured));
  const [variants, setVariants] = useState<DraftVariant[]>(
    existingVariants.map((v) => ({
      colorKey: v.colorKey,
      colorLabel: v.colorLabel,
      colorHex: v.colorHex,
      stock: v.stock,
      imageUrls: v.imageUrls,
    })),
  );
  const [variantUploadingKey, setVariantUploadingKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const priceNum = Number(price.replace(",", "."));
  const stockNum = Math.floor(Number(stock));
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    Number.isFinite(stockNum) &&
    stockNum >= 0;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr(null);
    setUploading(true);
    try {
      const batch = Array.from(files).slice(0, 10);
      const { urls, errors } = await batchUploadImages(batch, "products");
      if (urls.length > 0) {
        setImageUrls((prev) => [...prev, ...urls].slice(0, 12));
      }
      if (errors.length > 0) {
        setErr(`${urls.length}/${batch.length} yüklendi · ${errors.join(" · ")}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) =>
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));

  // ── Variant helpers (same as ProductFormModal) ──────────────────────
  const addVariant = () =>
    setVariants((prev) => {
      let n = prev.length + 1;
      let key = `renk-${n}`;
      while (prev.some((v) => v.colorKey === key)) {
        n += 1;
        key = `renk-${n}`;
      }
      return [
        ...prev,
        { colorKey: key, colorLabel: `Renk ${n}`, colorHex: "#888888", stock: 0, imageUrls: [] },
      ];
    });
  const removeVariant = (key: string) =>
    setVariants((prev) => prev.filter((v) => v.colorKey !== key));
  const updateVariant = (key: string, patch: Partial<DraftVariant>) =>
    setVariants((prev) => prev.map((v) => (v.colorKey === key ? { ...v, ...patch } : v)));
  const updateVariantLabel = (key: string, label: string) =>
    setVariants((prev) =>
      prev.map((v) => {
        if (v.colorKey !== key) return v;
        const prevLabelSlug = slugifyColor(v.colorLabel);
        const newKey =
          v.colorKey === prevLabelSlug || v.colorKey.startsWith("renk-")
            ? slugifyColor(label) || v.colorKey
            : v.colorKey;
        return { ...v, colorLabel: label, colorKey: newKey };
      }),
    );
  const handleVariantFiles = async (key: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr(null);
    setVariantUploadingKey(key);
    try {
      const batch = Array.from(files).slice(0, 10);
      const { urls, errors } = await batchUploadImages(batch, "products");
      if (urls.length > 0) {
        setVariants((prev) =>
          prev.map((v) =>
            v.colorKey === key ? { ...v, imageUrls: [...v.imageUrls, ...urls].slice(0, 12) } : v,
          ),
        );
      }
      if (errors.length > 0) {
        setErr(`${urls.length}/${batch.length} yüklendi · ${errors.join(" · ")}`);
      }
    } finally {
      setVariantUploadingKey(null);
    }
  };
  const removeVariantImage = (key: string, idx: number) =>
    setVariants((prev) =>
      prev.map((v) =>
        v.colorKey === key ? { ...v, imageUrls: v.imageUrls.filter((_, i) => i !== idx) } : v,
      ),
    );

  const hasVariants = variants.length > 0;
  const duplicateKeys = new Set(
    variants.map((v) => v.colorKey).filter((k, i, arr) => arr.indexOf(k) !== i),
  );
  const variantsValid =
    !hasVariants ||
    variants.every(
      (v) =>
        v.colorKey.trim().length > 0 &&
        v.colorLabel.trim().length > 0 &&
        /^#[0-9a-fA-F]{6}$/.test(v.colorHex) &&
        v.stock >= 0,
    );

  const save = async () => {
    if (!valid || saving || uploading || variantUploadingKey) return;
    if (!variantsValid) {
      setErr("Renk varyantı eksik veya hatalı.");
      return;
    }
    if (duplicateKeys.size > 0) {
      setErr(`Aynı renk anahtarı iki kez kullanılamaz: ${[...duplicateKeys].join(", ")}`);
      return;
    }
    setSaving(true);
    setErr(null);
    // Override semantics: send null for name/price/desc when they match the
    // static defaults → revert the override row. Same for images.
    const nameOut = name.trim() === (staticP?.name ?? row.defaultName) ? null : name.trim();
    const priceOut =
      Math.round(priceNum * 100) === row.defaultPriceCents
        ? null
        : Math.round(priceNum * 100);
    const shortOut =
      shortDesc.trim() === defaultShort.trim() || shortDesc.trim() === ""
        ? null
        : shortDesc.trim();
    const longOut =
      description.trim() === defaultLong.trim() || description.trim() === ""
        ? null
        : description.trim();
    // If the gallery matches static disk images exactly, clear the override.
    const staticSet = JSON.stringify(initialImages);
    const isUnchanged =
      JSON.stringify(imageUrls) === staticSet &&
      (row.imageUrlsOverride == null || row.imageUrlsOverride.length === 0);
    const imagesOut = isUnchanged ? null : imageUrls;
    const variantsOut = variants.map((v) => ({
      colorKey: v.colorKey.trim(),
      colorLabel: v.colorLabel.trim(),
      colorHex: v.colorHex.trim(),
      stock: Math.max(0, Math.floor(v.stock || 0)),
      imageUrls: v.imageUrls,
    }));
    // Set Bilgileri: empty values mean "clear the override" → static default
    // wins. Built-ins normally have no volume/setSize, so leaving them blank
    // is the right zero state.
    const volumeOut = volumeLabel.trim() === "" ? null : volumeLabel.trim();
    const setSizeNum = setSize.trim() === "" ? null : Math.floor(Number(setSize));
    const setSizeOut =
      setSizeNum != null && Number.isFinite(setSizeNum) && setSizeNum > 0
        ? setSizeNum
        : null;
    // Badges: only persist as an override if the admin flipped anything off
    // the static catalog default. Otherwise clear the override.
    const staticBadges = {
      isNew: Boolean(staticP?.isNew),
      isFeatured: Boolean(staticP?.isFeatured),
    };
    const matchesDefault = isNew === staticBadges.isNew && isFeatured === staticBadges.isFeatured;
    const badgesOut = matchesDefault ? null : { isNew, isFeatured };
    try {
      const { product } = await adminApi.updateProduct(row.productId, {
        name: nameOut,
        priceCents: priceOut,
        stock: hasVariants ? undefined : stockNum,
        shortDescription: shortOut,
        description: longOut,
        imageUrls: imagesOut,
        variants: variantsOut,
        volumeLabel: volumeOut,
        setSize: setSizeOut,
        badges: badgesOut,
      });
      onSaved(product);
      await onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Kaydedilemedi");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm pt-10 pb-20 px-4">
      <div className="w-full max-w-2xl bg-background border border-foreground/15 p-6 md:p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-audiowide text-lg uppercase tracking-[0.2em]">
            Ürünü Düzenle
          </h2>
          <button onClick={onClose} aria-label="Kapat" className="p-2 text-foreground/40 hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <p className="text-foreground/40 font-body text-[12px] mb-5">
          {row.productId} <span className="text-foreground/30">· {subcatLabel}</span>
        </p>

        {err ? <p className="mb-4 text-red-600 text-sm font-body">{err}</p> : null}

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">İsim</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
            {row.nameOverridden ? (
              <span className="block text-[10px] text-foreground/30 mt-1">
                Varsayılan: {row.defaultName}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Fiyat (₺)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
            {row.priceOverridden ? (
              <span className="block text-[10px] text-foreground/30 mt-1">
                Varsayılan: ₺{(row.defaultPriceCents / 100).toFixed(2)}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
              {hasVariants ? "Stok (renk bazında ayrı)" : "Stok"}
            </span>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={hasVariants}
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground disabled:opacity-40"
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
            Görseller {hasVariants ? <span className="text-foreground/30">(parent kapak — renk seçimi yapılırken renk görselleri öncelik kazanır)</span> : null}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrls.map((u, i) => (
              <div key={u + i} className="relative w-20 h-20 border border-foreground/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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

        {/* ── Set Bilgileri (parity with Bonny modal) ─────────────── */}
        <div className="mt-8 pt-6 border-t border-foreground/10">
          <p className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/60 mb-3">
            Set Bilgileri <span className="text-foreground/30">(opsiyonel)</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
                Hacim / Boy
              </span>
              <input
                value={volumeLabel}
                onChange={(e) => setVolumeLabel(e.target.value)}
                placeholder="600ml, 1L, Orta…"
                className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
                Set Boyutu
              </span>
              <input
                type="number"
                min={1}
                value={setSize}
                onChange={(e) => setSetSize(e.target.value)}
                placeholder="3, 6, 12…"
                className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
              />
            </label>
          </div>
        </div>

        {/* ── Color variants editor ───────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <p className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/60">
              Renk Varyantları <span className="text-foreground/30">({variants.length})</span>
            </p>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-foreground/15 font-audiowide text-[9px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
            >
              <Plus size={12} /> Renk Ekle
            </button>
          </div>
          {hasVariants ? (
            <p className="text-foreground/40 font-body text-[11px] mb-4">
              Renkleri eklediğinizde, mağazada müşteri rengi seçer. Stok her renk için ayrı tutulur ve görseller seçime göre değişir.
            </p>
          ) : (
            <p className="text-foreground/40 font-body text-[11px] mb-4">
              Bu ürün renk seçeneksiz tek üründür. Renk eklemek isterseniz yukarıdaki butonu kullanın.
            </p>
          )}
          <div className="space-y-4">
            {variants.map((v) => {
              const isDup = duplicateKeys.has(v.colorKey);
              const isUploadingThis = variantUploadingKey === v.colorKey;
              const hexOk = /^#[0-9a-fA-F]{6}$/.test(v.colorHex);
              return (
                <div key={v.colorKey} className="border border-foreground/10 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="color"
                      value={hexOk ? v.colorHex : "#888888"}
                      onChange={(e) => updateVariant(v.colorKey, { colorHex: e.target.value })}
                      className="w-12 h-12 shrink-0 border border-foreground/15 cursor-pointer"
                      aria-label={`${v.colorLabel} rengi`}
                    />
                    <div className="grid sm:grid-cols-3 gap-3 flex-1">
                      <label className="block">
                        <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Etiket</span>
                        <input
                          value={v.colorLabel}
                          onChange={(e) => updateVariantLabel(v.colorKey, e.target.value)}
                          className="mt-1 w-full border border-foreground/15 bg-background px-2 py-1.5 text-[13px] focus:outline-none focus:border-foreground"
                        />
                      </label>
                      <label className="block">
                        <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Slug</span>
                        <input
                          value={v.colorKey}
                          onChange={(e) =>
                            updateVariant(v.colorKey, {
                              colorKey: slugifyColor(e.target.value) || v.colorKey,
                            })
                          }
                          className={`mt-1 w-full border bg-background px-2 py-1.5 text-[13px] focus:outline-none ${
                            isDup ? "border-red-400 focus:border-red-600" : "border-foreground/15 focus:border-foreground"
                          }`}
                        />
                        {isDup ? (
                          <span className="block text-[10px] text-red-600 mt-0.5">Bu slug zaten kullanılıyor</span>
                        ) : null}
                      </label>
                      <label className="block">
                        <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">Stok</span>
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(v.colorKey, {
                              stock: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                            })
                          }
                          className="mt-1 w-full border border-foreground/15 bg-background px-2 py-1.5 text-[13px] focus:outline-none focus:border-foreground"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(v.colorKey)}
                      title="Rengi sil"
                      className="p-2 text-foreground/40 hover:text-red-600 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {v.imageUrls.map((u, i) => (
                      <div key={u + i} className="relative w-16 h-16 border border-foreground/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(v.colorKey, i)}
                          className="absolute -top-2 -right-2 bg-background border border-foreground/20 p-0.5 text-foreground/50 hover:text-red-600"
                          aria-label="Sil"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-foreground/20 cursor-pointer hover:border-foreground transition-colors text-[11px] font-body">
                      <ImagePlus size={12} />
                      {isUploadingThis ? "Yükleniyor…" : "Görsel Ekle"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleVariantFiles(v.colorKey, e.target.files)}
                        disabled={variantUploadingKey != null}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Badges (parity with Bonny modal) ────────────────────── */}
        <div className="mt-6 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-[12px] font-body">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="accent-foreground"
            />
            Yeni rozeti
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] font-body">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-foreground"
            />
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
            disabled={!valid || saving || uploading || variantUploadingKey != null}
            onClick={save}
            className="px-6 py-2.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] disabled:opacity-30 hover:opacity-90"
          >
            {saving
              ? "Kaydediliyor…"
              : uploading || variantUploadingKey
              ? "Görsel yükleniyor…"
              : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
