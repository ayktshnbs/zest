"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";

type State = "verifying" | "success" | "error" | "missing";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>(token ? "verifying" : "missing");
  const [message, setMessage] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setState("success"))
      .catch((err) => {
        setState("error");
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Doğrulama başarısız oldu. Lütfen tekrar deneyin.",
        );
      });
  }, [token]);

  return (
    <div className="max-w-md w-full text-center border border-foreground/10 p-10">
      <span className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
        Zest Home
      </span>
      <h1 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight mt-4 mb-6 text-foreground">
        E-posta Doğrulama
      </h1>

      {state === "verifying" ? (
        <p className="text-foreground/60 font-body">Doğrulanıyor…</p>
      ) : state === "success" ? (
        <>
          <p className="text-foreground/70 font-body mb-8">
            E-posta adresiniz doğrulandı. Teşekkürler!
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
          >
            Alışverişe Başla
          </Link>
        </>
      ) : state === "missing" ? (
        <p className="text-foreground/60 font-body">
          Geçersiz doğrulama bağlantısı: belirteç bulunamadı.
        </p>
      ) : (
        <>
          <p className="text-foreground/70 font-body mb-8">
            {message || "Bağlantı geçersiz veya süresi dolmuş."}
          </p>
          <Link
            href="/giris"
            className="inline-block px-8 py-4 bg-foreground text-background font-audiowide text-[10px] uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
          >
            Giriş Yap
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 pt-32 pb-24 bg-background">
      <Suspense fallback={<p className="text-foreground/40 font-body">Yükleniyor…</p>}>
        <VerifyEmailInner />
      </Suspense>
    </main>
  );
}
