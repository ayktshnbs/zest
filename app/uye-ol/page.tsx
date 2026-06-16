"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || "/";

  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Şifre en az 8 karakter olmalı ve harf + rakam içermelidir.");
      return;
    }

    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("Bu e-posta ile zaten bir hesap var.");
        } else if (err.status === 0) {
          setError("Sunucuya ulaşılamıyor.");
        } else {
          setError(err.message || "Kayıt başarısız oldu.");
        }
      } else {
        setError("Kayıt başarısız oldu.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50">
          Ad Soyad
        </label>
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-foreground/15 focus:border-foreground py-3 text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors"
          placeholder="Ad Soyad"
        />
      </div>

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

      <div>
        <label className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50">
          Şifre
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-foreground/15 focus:border-foreground py-3 text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors"
          placeholder="En az 8 karakter, harf + rakam"
        />
        <p className="mt-2 text-[11px] text-foreground/40">
          Harf ve rakam içermeli, minimum 8 karakter.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="text-[12px] text-red-500 border-l-2 border-red-500 pl-3 py-1"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] py-4 disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
      >
        {busy ? "Hesap oluşturuluyor..." : (
          <>
            Üye Ol <ArrowRight size={14} />
          </>
        )}
      </button>

      {/* Google sign-in (signing up via Google creates the account in one step). */}
      <div className="relative pt-4">
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-foreground/10" />
          <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/30">
            veya
          </span>
          <span className="flex-1 h-px bg-foreground/10" />
        </div>
        <div className="mt-4">
          <GoogleSignInButton redirectTo={redirectTo} onError={setError} />
        </div>
      </div>

      <p className="text-center text-sm text-foreground/60 pt-4 border-t border-foreground/5">
        Zaten bir hesabınız var mı?{" "}
        <Link
          href={`/giris${redirectTo !== "/" ? `?next=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-foreground underline underline-offset-4 hover:opacity-70"
        >
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen pt-28 md:pt-40 pb-28 bg-background flex items-start justify-center px-5">
      <div className="w-full max-w-md">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
          Hesap Oluştur
        </p>
        <h1 className="font-audiowide text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-2">
          Üye Ol
        </h1>
        <p className="text-foreground/55 text-sm md:text-base mb-10 leading-relaxed">
          Favori ürünleriniz cihazlar arasında senkronize olur, sipariş geçmişiniz
          tek yerde toplanır.
        </p>

        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
