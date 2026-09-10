"use client";

// Payment conditions that need a human.
//
// The PayTR webhook flags these into audit_logs with
// metadata.requiresManualReview = true (amount mismatches, probable double
// charges, orders needing a refund, callbacks we failed to process). Until this
// page existed they were written and never read, so a customer could be charged
// twice — or charged for a cancelled order — with nothing telling anyone.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError, type PaymentReview } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { paymentLabel, liraFromCents } from "../labels";

// Turkish labels + severity for each flagged condition.
const ACTION_INFO: Record<string, { label: string; hint: string }> = {
  "payment.legacy_attempt_ambiguous": {
    label: "Belirsiz Eski Kayıt",
    hint: "Bu merchant_oid için birden fazla eski ödeme kaydı var ve bildirim hangi denemeye ait olduğunu söylemiyor. HİÇBİR kayıt değiştirilmedi. PayTR kayıtlarıyla elle mutabakat yapın.",
  },
  "payment.legacy_event_identity_unclear": {
    label: "Belirsiz Eski Bildirim Kimliği",
    hint: "Eski biçimli bir bildirim kaydı işlenmiş görünüyor ama bu bildirimin onun tekrarı mı yoksa farklı bir bildirim mi olduğu karşılaştırılamıyor. HİÇBİR kayıt değiştirilmedi.",
  },
  "payment.double_charge_detected": {
    label: "Olası Çift Çekim",
    hint: "Siparişte birden fazla başarılı ödeme var. PayTR panelinden doğrulayıp fazla çekimi iade edin.",
  },
  "payment.amount_mismatch": {
    label: "Tutar Uyuşmazlığı",
    hint: "Çekilen tutar sipariş tutarından farklı. Sipariş ödendi olarak işaretlenmedi.",
  },
  "payment.requires_manual_refund": {
    label: "Manuel İade Gerekli",
    hint: "Ödeme alındı ancak stok tükendiği için sipariş karşılanamıyor. İade edilmeli.",
  },
  "payment.conflicting_callbacks": {
    label: "Çelişkili Bildirim",
    hint: "Başarılı ödemesi olan bir sipariş için başarısız bildirimi geldi.",
  },
  "payment.webhook_processing_failed": {
    label: "Bildirim İşlenemedi",
    hint: "PayTR bildirimi işlenemedi ve onaylanmadı. PayTR tekrar denemeli; denemeler durduysa elle mutabakat gerekir.",
  },
};

const describe = (action: string) =>
  ACTION_INFO[action] ?? { label: action, hint: "" };

export default function PaymentReviewsPage() {
  const [reviews, setReviews] = useState<PaymentReview[]>([]);
  const [unresolved, setUnresolved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.listPaymentReviews({ pageSize: 100 });
      setReviews(res.reviews);
      setUnresolved(res.unresolvedTotal);
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string) => {
    if (resolving) return;
    const note = window.prompt(
      "Bu inceleme nasıl çözüldü? (örn. iade referansı — isteğe bağlı)",
    );
    if (note === null) return; // cancelled
    setResolving(id);
    try {
      await adminApi.resolvePaymentReview(id, note.trim() || undefined);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "İşaretlenemedi");
    } finally {
      setResolving(null);
    }
  };

  if (loading) return <p className="text-foreground/40 font-body text-sm">Yükleniyor…</p>;
  if (err) return <p className="text-red-600 font-body text-sm">{err}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-audiowide text-xl uppercase tracking-[0.2em]">
          Ödeme İncelemeleri
        </h1>
        <p className="text-foreground/50 font-body text-[13px] mt-2 max-w-2xl">
          Elle müdahale gerektiren ödeme durumları. Siparişin güncel durumu, konunun
          çözülüp çözülmediğini anlamanızı sağlar — örneğin tutar uyuşmazlığı olan bir
          sipariş hâlâ &quot;Ödeme Bekliyor&quot; ise henüz ele alınmamıştır.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="border border-foreground/10 p-10 text-center">
          <p className="text-foreground/50 font-body">
            İnceleme gerektiren ödeme kaydı yok.
          </p>
        </div>
      ) : (
        <>
          <p className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-red-600">
            {unresolved} çözülmemiş · {reviews.length} kayıt listeleniyor
          </p>
          <ul className="space-y-4">
            {reviews.map((r) => {
              const info = describe(r.action);
              return (
                <li
                  key={r.id}
                  className={`border p-5 space-y-3 ${
                    r.resolved
                      ? "border-foreground/10 bg-foreground/[0.02] opacity-70"
                      : "border-red-500/30 bg-red-500/[0.03]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p
                        className={`font-audiowide text-[11px] uppercase tracking-[0.2em] ${
                          r.resolved ? "text-foreground/50" : "text-red-600"
                        }`}
                      >
                        {r.resolved ? "✓ " : ""}
                        {info.label}
                      </p>
                      <p className="text-[11px] font-body text-foreground/40 mt-1">
                        {new Date(r.createdAt).toLocaleString("tr-TR")}
                        {r.merchantOid ? ` · ${r.merchantOid}` : ""}
                      </p>
                    </div>
                    {r.order ? (
                      <div className="text-right">
                        <Link
                          href={`/admin/orders/${r.order.id}`}
                          className="font-audiowide text-xs tracking-tight underline underline-offset-4"
                        >
                          {r.order.orderNumber}
                        </Link>
                        <p className="text-[11px] font-body text-foreground/50 mt-1">
                          {formatPrice(liraFromCents(r.order.totalCents))} ·{" "}
                          <span className="text-foreground/70">
                            {paymentLabel[r.order.status]}
                          </span>
                        </p>
                        <p className="text-[11px] font-body text-foreground/40">
                          {r.order.customerEmail}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] font-body text-foreground/40">
                        Sipariş eşleştirilemedi
                      </p>
                    )}
                  </div>

                  {r.detail ? (
                    <p className="text-[13px] font-body text-foreground/70">{r.detail}</p>
                  ) : null}
                  {info.hint ? (
                    <p className="text-[12px] font-body text-foreground/50">{info.hint}</p>
                  ) : null}

                  <details className="text-[11px] font-body text-foreground/40">
                    <summary className="cursor-pointer hover:text-foreground/70">
                      Teknik detay
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed">
                      {JSON.stringify(r.metadata, null, 2)}
                    </pre>
                  </details>

                  {/* Resolution is an append-only audit record — the incident
                      row above is never modified or deleted. */}
                  {r.resolved ? (
                    <p className="text-[11px] font-body text-foreground/50 border-t border-foreground/10 pt-3">
                      Çözüldü ·{" "}
                      {r.resolvedAt
                        ? new Date(r.resolvedAt).toLocaleString("tr-TR")
                        : ""}
                      {r.resolvedBy ? ` · ${r.resolvedBy}` : ""}
                      {r.resolutionNote ? ` — ${r.resolutionNote}` : ""}
                    </p>
                  ) : (
                    <div className="border-t border-foreground/10 pt-3">
                      <button
                        onClick={() => resolve(r.id)}
                        disabled={resolving === r.id}
                        className="font-audiowide text-[10px] uppercase tracking-[0.25em] border border-foreground/20 px-4 py-2 hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {resolving === r.id ? "Kaydediliyor…" : "Çözüldü olarak işaretle"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
