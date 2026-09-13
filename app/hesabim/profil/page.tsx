"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { accountApi, ApiError } from "@/lib/api";
import { Check } from "lucide-react";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Prefill once the authenticated user is known; re-sync if it changes
  // (e.g. after a successful save elsewhere refreshes context).
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
  }, [user]);

  const validate = (): string | null => {
    if (!name.trim()) return "Ad soyad gerekli.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Geçerli bir e-posta adresi girin.";
    if (phone.trim() && phone.trim().length < 7) return "Telefon numarası çok kısa.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSuccess(false);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await accountApi.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() ? phone.trim() : null,
      });
      await refresh();
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "conflict") {
        setError("Bu e-posta adresi başka bir hesap tarafından kullanılıyor.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
      } else {
        setError("Profil güncellenemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>;
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-audiowide text-sm uppercase tracking-[0.3em] mb-6">
        Profil Bilgilerim
      </h2>

      <form onSubmit={handleSubmit} className="border border-foreground/10 p-6 md:p-10 space-y-6">
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Ad Soyad
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            className="form-input"
          />
        </label>

        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            E-posta
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="form-input"
          />
        </label>

        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Telefon
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="0 5XX XXX XX XX"
            className="form-input"
          />
        </label>

        {error ? (
          <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 font-body">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="flex items-center gap-2 text-[13px] text-green-700 bg-green-50 border border-green-200 px-4 py-3 font-body">
            <Check size={14} /> Profil bilgileriniz güncellendi.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
