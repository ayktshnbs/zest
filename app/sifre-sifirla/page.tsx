"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, MailCheck, Lock } from "lucide-react";
import { authApi, ApiError } from "@/lib/api";

// Single page, two states:
//   no ?token=        → request a reset email (forgot-password)
//   ?token=…          → set a new password (reset-password)
// The backend always returns 200 from forgot-password to avoid leaking which
// emails exist — so the UI shows a generic success message either way.

function RequestForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 0
          ? "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin."
          : "Bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center">
          <MailCheck size={22} />
        </div>
        <h2 className="font-audiowide text-xl uppercase tracking-tight">E-posta gönderildi</h2>
        <p className="text-foreground/60 text-sm leading-relaxed">
          Bu e-posta hesabımızda kayıtlıysa, sıfırlama bağlantısını birkaç dakika içinde
          göndereceğiz. Lütfen gelen kutunuzu (ve spam klasörünüzü) kontrol edin.
        </p>
        <p className="text-foreground/40 text-xs">Bağlantı 1 saat geçerlidir.</p>
        <Link
          href="/giris"
          className="inline-block mt-4 font-audiowide text-[10px] uppercase tracking-[0.3em] border-b border-foreground/15 hover:border-foreground pb-1"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-foreground/55 text-sm md:text-base leading-relaxed">
        E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
      </p>
      <div>
        <label className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50">
          E-posta
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-foreground/15 focus:border-foreground py-3 text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors"
          placeholder="siz@ornek.com"
        />
      </div>
      {error ? (
        <p role="alert" className="text-[12px] text-red-500 border-l-2 border-red-500 pl-3 py-1">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !email.trim()}
        className="w-full bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] py-4 disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
      >
        {busy ? "Gönderiliyor..." : (<>Bağlantıyı Gönder <ArrowRight size={14} /></>)}
      </button>
      <p className="text-center text-sm text-foreground/60 pt-4 border-t border-foreground/5">
        Şifrenizi hatırladınız mı?{" "}
        <Link href="/giris" className="text-foreground underline underline-offset-4 hover:opacity-70">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}

function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    password === confirm;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError("Şifre en az 8 karakter, harf ve rakam içermeli ve eşleşmelidir.");
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 0
            ? "Sunucuya ulaşılamıyor."
            : err.message || "Bağlantı geçersiz veya süresi dolmuş olabilir."
          : "Bir hata oluştu.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center">
          <Lock size={22} />
        </div>
        <h2 className="font-audiowide text-xl uppercase tracking-tight">Şifreniz değiştirildi</h2>
        <p className="text-foreground/60 text-sm leading-relaxed">
          Yeni şifrenizle giriş yapabilirsiniz. Güvenliğiniz için tüm aktif oturumlarınız kapatıldı.
        </p>
        <button
          onClick={() => router.push("/giris")}
          className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90"
        >
          Giriş Yap <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-foreground/55 text-sm md:text-base leading-relaxed">
        Yeni bir şifre belirleyin. En az 8 karakter, harf ve rakam içermelidir.
      </p>
      <div>
        <label className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50">
          Yeni Şifre
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-foreground/15 focus:border-foreground py-3 text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50">
          Şifre Tekrar
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-foreground/15 focus:border-foreground py-3 text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors"
          placeholder="••••••••"
        />
      </div>
      {error ? (
        <p role="alert" className="text-[12px] text-red-500 border-l-2 border-red-500 pl-3 py-1">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !valid}
        className="w-full bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] py-4 disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
      >
        {busy ? "Kaydediliyor..." : (<>Şifreyi Güncelle <ArrowRight size={14} /></>)}
      </button>
    </form>
  );
}

function PasswordResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return token ? <ResetForm token={token} /> : <RequestForm />;
}

export default function PasswordResetPage() {
  return (
    <main className="min-h-screen pt-28 md:pt-40 pb-28 bg-background flex items-start justify-center px-5">
      <div className="w-full max-w-md">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
          Hesabım
        </p>
        <h1 className="font-audiowide text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-2">
          Şifremi Sıfırla
        </h1>
        <div className="mt-8">
          <Suspense fallback={null}>
            <PasswordResetContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
