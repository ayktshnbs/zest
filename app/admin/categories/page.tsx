"use client";

import { useEffect, useState } from "react";
import {
  adminCategoriesApi,
  ApiError,
  uploadImage,
  type AdminCategory,
} from "@/lib/api";
import { Trash2, ImagePlus } from "lucide-react";
import { refreshLiveCatalog } from "@/lib/useStock";

const slugifyTr = (s: string) => {
  const tr: Record<string, string> = { ı:"i", İ:"i", ş:"s", Ş:"s", ğ:"g", Ğ:"g", ü:"u", Ü:"u", ö:"o", Ö:"o", ç:"c", Ç:"c" };
  return s.toLowerCase().replace(/[ıİşŞğĞüÜöÖçÇ]/g, (c) => tr[c] ?? c)
    .normalize("NFKD").replace(/\p{M}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};

export default function AdminCategoriesPage() {
  const [list, setList] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const { categories } = await adminCategoriesApi.list();
      setList(categories);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const { secureUrl } = await uploadImage(file, "categories");
      setImageUrl(secureUrl);
    } catch (e) {
      setErr("Görsel yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const create = async () => {
    if (!label.trim() || !slug.trim()) return;
    setCreating(true);
    setErr(null);
    try {
      await adminCategoriesApi.create({ slug: slug.trim(), label: label.trim(), imageUrl: imageUrl || null });
      setLabel(""); setSlug(""); setSlugTouched(false); setImageUrl("");
      await refreshLiveCatalog();
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Eklenemedi");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (s: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    setErr(null);
    try {
      await adminCategoriesApi.remove(s);
      await refreshLiveCatalog();
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Silinemedi");
    }
  };

  return (
    <div>
      <h1 className="font-audiowide text-2xl uppercase tracking-tight mb-6">Kategoriler</h1>
      {err ? <p className="text-red-600 font-body text-sm mb-4">{err}</p> : null}

      {/* Add new category */}
      <section className="border border-foreground/10 p-6 mb-10">
        <h2 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60 mb-4">
          Yeni Kategori
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">İsim</span>
            <input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (!slugTouched) setSlug(slugifyTr(e.target.value));
              }}
              placeholder="Yeni Koleksiyon"
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">URL (slug)</span>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              placeholder="yeni-koleksiyon"
              className="mt-1 w-full border border-foreground/15 bg-background px-3 py-2 text-[13px] focus:outline-none focus:border-foreground"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50 block mb-2">Görsel (opsiyonel)</span>
          {imageUrl ? (
            <div className="flex items-center gap-3">
              <img src={imageUrl} alt="" className="w-20 h-20 object-cover border border-foreground/10" />
              <button onClick={() => setImageUrl("")} className="text-[11px] font-audiowide uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground">Kaldır</button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-foreground/20 cursor-pointer hover:border-foreground transition-colors text-[12px] font-body">
              <ImagePlus size={14} />
              {uploading ? "Yükleniyor…" : "Görsel Yükle"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <div className="mt-6">
          <button
            disabled={!label.trim() || !slug.trim() || creating}
            onClick={create}
            className="px-6 py-2.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] disabled:opacity-30 hover:opacity-90"
          >
            {creating ? "Ekleniyor…" : "Kategori Ekle"}
          </button>
        </div>
      </section>

      {/* Existing categories */}
      <h2 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60 mb-4">
        Mevcut Kategoriler
      </h2>
      {loading ? (
        <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>
      ) : list.length === 0 ? (
        <p className="text-foreground/40 font-body text-sm">Henüz özel kategori eklenmedi.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.slug} className="flex items-center justify-between border border-foreground/10 p-4">
              <div className="flex items-center gap-4">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className="w-12 h-12 object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-foreground/5" />
                )}
                <div>
                  <p className="text-foreground">{c.label}</p>
                  <p className="text-foreground/40 font-audiowide text-[11px]">{c.slug}</p>
                </div>
              </div>
              <button
                onClick={() => remove(c.slug)}
                className="p-2 text-foreground/40 hover:text-red-600 transition-colors"
                title="Sil"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
