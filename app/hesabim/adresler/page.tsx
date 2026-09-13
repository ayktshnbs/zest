"use client";

import { useEffect, useState } from "react";
import {
  addressesApi,
  ApiError,
  type SavedAddress,
  type AddressInput,
} from "@/lib/api";
import { Check, MapPin, Plus, Star, Trash2 } from "lucide-react";

type FormValues = {
  title: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

const emptyForm: FormValues = {
  title: "",
  fullName: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false,
};

const toFormValues = (a: SavedAddress): FormValues => ({
  title: a.title,
  fullName: a.fullName,
  phone: a.phone ?? "",
  line1: a.line1,
  city: a.city,
  state: a.state ?? "",
  postalCode: a.postalCode,
  isDefault: a.isDefault,
});

const validate = (v: FormValues): string | null => {
  if (!v.title.trim()) return "Adres başlığı gerekli (Ev, İş, Annem gibi).";
  if (!v.fullName.trim()) return "Ad soyad gerekli.";
  if (v.phone.replace(/\D/g, "").length < 7) return "Geçerli bir telefon numarası girin.";
  if (v.line1.trim().length < 8) return "Adres çok kısa.";
  if (!v.city.trim()) return "İl gerekli.";
  if (!v.state.trim()) return "İlçe gerekli.";
  if (v.postalCode.trim().length < 4) return "Geçerli bir posta kodu girin.";
  return null;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setListError(null);
    try {
      const { addresses } = await addressesApi.list();
      setAddresses(addresses);
    } catch {
      setListError("Adresler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleCreated = (a: SavedAddress) => {
    setCreating(false);
    setNotice("Adresiniz başarıyla kaydedildi.");
    load();
    void a;
  };

  const handleUpdated = (a: SavedAddress) => {
    setEditingId(null);
    setNotice("Adresiniz başarıyla güncellendi.");
    load();
    void a;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    setBusyId(id);
    try {
      await addressesApi.remove(id);
      setNotice("Adres silindi.");
      await load();
    } catch {
      setListError("Adres silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    try {
      await addressesApi.setDefault(id);
      await load();
    } catch {
      setListError("Varsayılan adres ayarlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-audiowide text-sm uppercase tracking-[0.3em]">Adreslerim</h2>
        {!creating ? (
          <button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground border-b border-foreground/10 hover:border-foreground pb-1"
          >
            <Plus size={13} /> Yeni Adres Ekle
          </button>
        ) : null}
      </div>

      {notice ? (
        <p className="flex items-center gap-2 mb-6 text-[13px] text-green-700 bg-green-50 border border-green-200 px-4 py-3 font-body">
          <Check size={14} /> {notice}
        </p>
      ) : null}
      {listError ? (
        <p className="mb-6 text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 font-body">
          {listError}
        </p>
      ) : null}

      {creating ? (
        <div className="mb-8 border border-foreground/10 p-6 md:p-10">
          <h3 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60 mb-6">
            Yeni Adres
          </h3>
          <AddressForm
            initial={emptyForm}
            onCancel={() => setCreating(false)}
            onSaved={handleCreated}
            submitLabel="Adresi Kaydet"
          />
        </div>
      ) : null}

      {loading ? (
        <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>
      ) : addresses.length === 0 && !creating ? (
        <div className="border border-foreground/10 p-10 text-center">
          <MapPin size={20} className="mx-auto mb-3 text-foreground/30" />
          <p className="text-foreground/50 font-body">Henüz kayıtlı adresiniz yok.</p>
          <button
            onClick={() => setCreating(true)}
            className="inline-block mt-4 font-audiowide text-[10px] uppercase tracking-[0.3em] border-b border-foreground/20 hover:border-foreground pb-1"
          >
            + Yeni Adres Ekle
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {addresses.map((a) =>
            editingId === a.id ? (
              <li key={a.id} className="border border-foreground/10 p-6 md:p-10">
                <h3 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60 mb-6">
                  Adresi Düzenle
                </h3>
                <AddressForm
                  initial={toFormValues(a)}
                  addressId={a.id}
                  onCancel={() => setEditingId(null)}
                  onSaved={handleUpdated}
                  submitLabel="Değişiklikleri Kaydet"
                />
              </li>
            ) : (
              <li key={a.id} className="border border-foreground/10 p-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-audiowide text-[12px] uppercase tracking-[0.2em] text-foreground">
                      {a.title}
                    </p>
                    {a.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-audiowide uppercase tracking-[0.2em] text-foreground/60 border border-foreground/15 px-2 py-0.5">
                        <Star size={9} className="fill-current" /> Varsayılan
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[14px] text-foreground/80 font-body">{a.fullName}</p>
                  <p className="text-[13px] text-foreground/50 font-body mt-0.5">{a.phone}</p>
                  <p className="text-[13px] text-foreground/50 font-body mt-1 max-w-md">
                    {a.line1}
                  </p>
                  <p className="text-[13px] text-foreground/50 font-body">
                    {a.state} / {a.city} {a.postalCode}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setEditingId(a.id);
                        setCreating(false);
                      }}
                      className="text-[10px] font-audiowide uppercase tracking-[0.25em] text-foreground/50 hover:text-foreground"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={busyId === a.id}
                      className="text-foreground/40 hover:text-red-600 disabled:opacity-30 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {!a.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(a.id)}
                      disabled={busyId === a.id}
                      className="text-[10px] font-audiowide uppercase tracking-[0.25em] text-foreground/40 hover:text-foreground disabled:opacity-30"
                    >
                      Varsayılan Yap
                    </button>
                  ) : null}
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function AddressForm({
  initial,
  addressId,
  onCancel,
  onSaved,
  submitLabel,
}: {
  initial: FormValues;
  addressId?: string;
  onCancel: () => void;
  onSaved: (a: SavedAddress) => void;
  submitLabel: string;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const validationError = validate(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    const payload: AddressInput = {
      title: values.title.trim(),
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      line1: values.line1.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
      isDefault: values.isDefault,
    };
    try {
      const { address } = addressId
        ? await addressesApi.update(addressId, payload)
        : await addressesApi.create(payload);
      onSaved(address);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError("Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
      } else {
        setError("Adres kaydedilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Adres Başlığı
          </span>
          <input
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ev, İş, Annem..."
            className="form-input"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Ad Soyad
          </span>
          <input
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            autoComplete="name"
            className="form-input"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Telefon
          </span>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            autoComplete="tel"
            placeholder="0 5XX XXX XX XX"
            className="form-input"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Posta Kodu
          </span>
          <input
            value={values.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
            autoComplete="postal-code"
            className="form-input"
          />
        </label>
        <div className="sm:col-span-2">
          <label className="block space-y-2">
            <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
              Adres
            </span>
            <textarea
              value={values.line1}
              onChange={(e) => set("line1", e.target.value)}
              rows={3}
              autoComplete="street-address"
              placeholder="Mahalle, sokak, kapı / daire no"
              className="form-input resize-none"
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            İl
          </span>
          <input
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
            autoComplete="address-level1"
            className="form-input"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            İlçe
          </span>
          <input
            value={values.state}
            onChange={(e) => set("state", e.target.value)}
            autoComplete="address-level2"
            className="form-input"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 cursor-pointer text-[13px] text-foreground/70 font-body pt-1">
        <input
          type="checkbox"
          checked={values.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="accent-foreground"
        />
        Varsayılan adresim olsun
      </label>

      {error ? (
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 font-body">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Kaydediliyor…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground disabled:opacity-40"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
