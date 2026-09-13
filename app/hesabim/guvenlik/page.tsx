"use client";

import { useState } from "react";
import { accountApi, ApiError } from "@/lib/api";
import { Check, Lock } from "lucide-react";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!currentPassword) return "Mevcut şifrenizi girin.";
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return "Yeni şifre en az 8 karakter olmalı ve harf + rakam içermelidir.";
    }
    if (newPassword !== confirmPassword) return "Yeni şifreler eşleşmiyor.";
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
      await accountApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Mevcut şifreniz yanlış.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
      } else {
        setError("Şifre güncellenemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="font-audiowide text-sm uppercase tracking-[0.3em] mb-6">
        Şifre ve Güvenlik
      </h2>

      <form onSubmit={handleSubmit} className="border border-foreground/10 p-6 md:p-10 space-y-6">
        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Mevcut Şifre
          </span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="form-input"
          />
        </label>

        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Yeni Şifre
          </span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            className="form-input"
          />
        </label>

        <label className="block space-y-2">
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50">
            Yeni Şifre (Tekrar)
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
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
            <Check size={14} /> Şifreniz güncellendi. Bu cihazda oturumunuz açık kalacak; diğer
            cihazlardaki oturumlar sonlandırıldı.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lock size={12} />
          {saving ? "Güncelleniyor…" : "Şifreyi Güncelle"}
        </button>
      </form>
    </div>
  );
}
