"use client";

// "Continue with Google" button using Google Identity Services (GIS).
// On click we render a temporary GIS "Sign in with Google" button right under
// our visual button — that's the only way to use GIS without our domain being
// pre-registered for One Tap. The script is loaded once globally.
//
// To use: set NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID in the Vercel project env. Add
// http://localhost:3000 (dev) and the prod URL to your Google Cloud Console's
// "Authorized JavaScript origins" for this OAuth client.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";

declare global {
  interface Window {
    google?: any;
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

let scriptLoading: Promise<void> | null = null;

const loadGis = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GIS load failed"));
    document.head.appendChild(s);
  });
  return scriptLoading;
};

export const GoogleSignInButton = ({
  redirectTo = "/",
  onError,
}: {
  redirectTo?: string;
  onError?: (message: string) => void;
}) => {
  const router = useRouter();
  const { refresh } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled) return;
        if (!window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: { credential?: string }) => {
            if (!resp.credential) {
              onError?.("Google girişi iptal edildi.");
              return;
            }
            setBusy(true);
            try {
              await authApi.google(resp.credential);
              await refresh();
              router.push(redirectTo);
              router.refresh();
            } catch (err) {
              const msg =
                err instanceof ApiError
                  ? err.status === 0
                    ? "Sunucuya ulaşılamıyor."
                    : err.message || "Google ile giriş başarısız."
                  : "Google ile giriş başarısız.";
              onError?.(msg);
              setBusy(false);
            }
          },
          auto_select: false,
          use_fedcm_for_prompt: false,
        });
        if (containerRef.current) {
          window.google.accounts.id.renderButton(containerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "continue_with",
            shape: "rectangular",
            width: containerRef.current.offsetWidth || 320,
            locale: "tr",
          });
        }
        setReady(true);
      })
      .catch(() => onError?.("Google servisi yüklenemedi."));
    return () => { cancelled = true; };
  }, [clientId, redirectTo, router, refresh, onError]);

  if (!clientId) {
    // Don't render anything if not configured — keep the form clean.
    return null;
  }

  return (
    <div className="w-full">
      {/* GIS injects its own button here. Until it's ready we render a styled
          placeholder so the layout doesn't jump. */}
      <div
        ref={containerRef}
        className={`flex justify-center min-h-[44px] ${busy ? "opacity-50 pointer-events-none" : ""}`}
        aria-busy={busy}
      />
      {!ready ? (
        <p className="text-center text-[11px] font-audiowide tracking-[0.3em] uppercase text-foreground/30 mt-2">
          Google yükleniyor…
        </p>
      ) : null}
    </div>
  );
};
