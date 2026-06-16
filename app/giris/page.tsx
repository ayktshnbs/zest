"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") || "/";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 0
            ? "Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin."
            : err.message || "Giriş başarısız oldu.",
        );
      } else {
        setError("Giriş başarısız oldu.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
        <div className="flex items-end justify-between">
          <label className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/50">
            Şifre
          </label>
          <Link
            href="/sifre-sifirla"
            className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors"
          >
            Unuttum
          </Link>
        </div>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-foreground/15 focus:border-foreground py-3 text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors"
          placeholder="••••••••"
        />
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
        {busy ? "Giriş yapılıyor..." : (
          <>
            Giriş Yap <ArrowRight size={14} />
          </>
        )}
      </button>

      {/* Google sign-in (only renders if NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID is set). */}
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
        Hesabınız yok mu?{" "}
        <Link
          href={`/uye-ol${redirectTo !== "/" ? `?next=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-foreground underline underline-offset-4 hover:opacity-70"
        >
          Üye olun
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen pt-28 md:pt-40 pb-28 bg-background flex items-start justify-center px-5">
      <div className="w-full max-w-md">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.5em] text-foreground/40 mb-4">
          Hesabım
        </p>
        <h1 className="font-audiowide text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-2">
          Giriş Yap
        </h1>
        <p className="text-foreground/55 text-sm md:text-base mb-10 leading-relaxed">
          Favori ürünlerinize, sipariş geçmişinize ve hızlı ödemeye anında
          erişin.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
