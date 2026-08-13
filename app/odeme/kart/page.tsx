"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

function PaytrIframe() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      // If someone navigates here directly without a token, send them back to checkout.
      router.replace("/odeme");
    }
  }, [token, router]);

  if (!mounted || !token) return null;

  return (
    <>
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          if (window.iFrameResize) {
            // @ts-ignore
            window.iFrameResize({}, "#paytriframe");
          }
        }}
      />
      <div className="border border-foreground/10 p-2 md:p-6 bg-background rounded-sm shadow-sm relative min-h-[600px]">
        {/* Loading state behind the iframe */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -z-10 text-foreground/50 space-y-4">
          <ShieldCheck size={32} className="opacity-50 animate-pulse" />
          <p className="font-audiowide text-[10px] uppercase tracking-[0.3em]">
            Güvenli Ödeme Sayfası Yükleniyor...
          </p>
        </div>

        <iframe
          src={`https://www.paytr.com/odeme/guvenli/${token}`}
          id="paytriframe"
          frameBorder="0"
          scrolling="no"
          style={{ width: "100%", minHeight: "600px" }}
          title="PayTR Güvenli Ödeme"
        />
      </div>
    </>
  );
}

export default function PaytrPaymentPage() {
  return (
    <main className="min-h-screen pt-28 md:pt-32 pb-24 bg-background">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/odeme"
            className="inline-flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} /> Ödemeye Dön
          </Link>
          <div className="flex items-center gap-2 text-foreground/50">
            <ShieldCheck size={16} />
            <span className="font-audiowide text-[9px] uppercase tracking-[0.2em]">
              256-bit SSL
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-audiowide text-2xl md:text-3xl uppercase tracking-tight">
            Güvenli Ödeme
          </h1>
          <p className="text-[13px] text-foreground/60 font-body mt-2">
            Lütfen kart bilgilerinizi girerek ödemenizi tamamlayın.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="border border-foreground/10 p-6 flex flex-col items-center justify-center min-h-[600px] text-foreground/50 space-y-4">
              <ShieldCheck size={32} className="opacity-50 animate-pulse" />
              <p className="font-audiowide text-[10px] uppercase tracking-[0.3em]">
                Hazırlanıyor...
              </p>
            </div>
          }
        >
          <PaytrIframe />
        </Suspense>
      </div>
    </main>
  );
}
