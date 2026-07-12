"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { ordersApi, ApiError } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Lock,
  Mail,
  Package,
  Phone,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  estimatedDelivery,
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
} from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: "contact", label: "İletişim" },
  { id: "shipping", label: "Teslimat" },
  { id: "delivery", label: "Kargo" },
  { id: "payment", label: "Ödeme" },
  { id: "review", label: "Onay" },
] as const;
type StepId = (typeof steps)[number]["id"];

type ContactForm = { email: string; phone: string };
type ShippingForm = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
};
type DeliveryMethod = "standart" | "ekspres";
// "kart" (online card payment) is intentionally NOT selectable yet: PayTR
// virtual POS integration is pending. We never render our own card fields —
// when PayTR lands, the customer will pay on PayTR's hosted page/iframe.
type PaymentMethod = "havale" | "kapida";

const deliveryPricing: Record<DeliveryMethod, number> = {
  standart: STANDARD_SHIPPING_COST,
  ekspres: 89.9,
};

const deliveryDescriptions: Record<DeliveryMethod, string> = {
  standart: `Tahmini ${estimatedDelivery()}`,
  ekspres: "1 iş günü içinde teslim",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice, clearCart, isHydrated } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<StepId>("contact");
  const [contact, setContact] = useState<ContactForm>({ email: "", phone: "" });
  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
  });
  const [delivery, setDelivery] = useState<DeliveryMethod>("standart");
  const [payment, setPayment] = useState<PaymentMethod>("havale");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && cart.length === 0) {
      router.replace("/sepet");
    }
  }, [isHydrated, cart.length, router]);

  // Prefill the contact email for a signed-in shopper.
  useEffect(() => {
    if (user?.email) setContact((c) => (c.email ? c : { ...c, email: user.email }));
  }, [user]);

  const baseShipping =
    totalPrice >= FREE_SHIPPING_THRESHOLD && delivery === "standart"
      ? 0
      : deliveryPricing[delivery];
  const orderTotal = totalPrice + baseShipping;
  const currentIndex = steps.findIndex((s) => s.id === step);

  const canProceed = useMemo(() => {
    if (step === "contact") {
      return /\S+@\S+\.\S+/.test(contact.email) && contact.phone.replace(/\D/g, "").length >= 10;
    }
    if (step === "shipping") {
      return (
        shipping.firstName.trim() &&
        shipping.lastName.trim() &&
        shipping.address.trim().length >= 8 &&
        shipping.city.trim() &&
        shipping.district.trim() &&
        shipping.postalCode.trim().length >= 4
      );
    }
    if (step === "delivery") return Boolean(delivery);
    if (step === "payment") return Boolean(payment);
    if (step === "review") return agree;
    return true;
  }, [step, contact, shipping, delivery, payment, agree]);

  const goNext = () => {
    const idx = steps.findIndex((s) => s.id === step);
    if (idx < steps.length - 1) setStep(steps[idx + 1].id);
  };
  const goBack = () => {
    const idx = steps.findIndex((s) => s.id === step);
    if (idx > 0) setStep(steps[idx - 1].id);
  };

  const handleSubmit = async () => {
    if (!agree || submitting) return;
    // Orders are tied to the signed-in user (no guest checkout in the API).
    if (!isAuthenticated) {
      router.push(`/giris?next=${encodeURIComponent("/odeme")}`);
      return;
    }
    setSubmitting(true);
    setError(null);

    const deliveryLabel = delivery === "ekspres" ? "Ekspres Kargo" : "Standart Kargo";
    const paymentLabel = payment === "havale" ? "Havale/EFT" : "Kapıda Ödeme";

    try {
      // Only productId + quantity are trusted by the API — price, shipping and
      // totals are recomputed server-side from the authoritative catalog.
      const { order } = await ordersApi.create({
        items: cart.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          ...(i.color ? { colorKey: i.color.key } : {}),
        })),
        shippingAddress: {
          fullName: `${shipping.firstName} ${shipping.lastName}`.trim(),
          phone: contact.phone || undefined,
          line1: shipping.address,
          city: shipping.city,
          state: shipping.district || undefined,
          postalCode: shipping.postalCode,
          country: "TR",
        },
        notes: `İletişim: ${contact.email} · ${contact.phone} | Kargo: ${deliveryLabel} | Ödeme: ${paymentLabel}`,
      });
      clearCart();
      router.replace(`/odeme/basarili?order=${encodeURIComponent(order.orderNumber)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/giris?next=${encodeURIComponent("/odeme")}`);
        return;
      }
      if (err instanceof ApiError && err.code === "out_of_stock") {
        const items =
          (err.details as { items?: { productId: string }[] } | undefined)?.items ?? [];
        const names = items
          .map((i) => cart.find((c) => c.id === i.productId)?.name ?? i.productId)
          .join(", ");
        setError(
          `Üzgünüz, stok yetersiz${names ? `: ${names}` : ""}. Lütfen sepetinizi güncelleyip tekrar deneyin.`,
        );
      } else {
        setError("Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
      }
      setSubmitting(false);
    }
  };

  if (!isHydrated || cart.length === 0) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yükleniyor
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 md:pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        <div className="mb-10">
          <Link
            href="/sepet"
            className="inline-flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} /> Sepete Dön
          </Link>
          <h1 className="font-audiowide text-3xl md:text-5xl uppercase tracking-tight mt-4">
            Ödeme
          </h1>
        </div>

        {/* Step indicator */}
        <ol className="mb-12 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {steps.map((s, i) => {
            const active = s.id === step;
            const completed = i < currentIndex;
            return (
              <li
                key={s.id}
                className={`flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] whitespace-nowrap ${
                  active
                    ? "text-foreground"
                    : completed
                    ? "text-foreground/70"
                    : "text-foreground/30"
                }`}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center border text-[10px] ${
                    active || completed ? "border-foreground" : "border-foreground/20"
                  }`}
                >
                  {completed ? <Check size={10} /> : i + 1}
                </span>
                {s.label}
                {i < steps.length - 1 ? (
                  <span className="w-6 h-px bg-foreground/15 ml-2" />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="grid lg:grid-cols-12 gap-12">
          <section className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step === "contact" ? (
                  <FormCard title="İletişim Bilgileri" eyebrow="1. Adım">
                    <div className="space-y-5">
                      <Field label="E-posta" icon={<Mail size={14} />}>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={contact.email}
                          onChange={(e) =>
                            setContact({ ...contact, email: e.target.value })
                          }
                          placeholder="ornek@zest.com"
                          className="form-input"
                        />
                      </Field>
                      <Field label="Telefon" icon={<Phone size={14} />}>
                        <input
                          type="tel"
                          autoComplete="tel"
                          required
                          value={contact.phone}
                          onChange={(e) =>
                            setContact({ ...contact, phone: e.target.value })
                          }
                          placeholder="0 5XX XXX XX XX"
                          className="form-input"
                        />
                      </Field>
                      <p className="text-[11px] text-foreground/40 font-body">
                        Sipariş güncellemeleri için e-posta ve SMS göndereceğiz.
                      </p>
                    </div>
                  </FormCard>
                ) : null}

                {step === "shipping" ? (
                  <FormCard title="Teslimat Adresi" eyebrow="2. Adım">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Ad">
                        <input
                          required
                          autoComplete="given-name"
                          value={shipping.firstName}
                          onChange={(e) =>
                            setShipping({ ...shipping, firstName: e.target.value })
                          }
                          className="form-input"
                        />
                      </Field>
                      <Field label="Soyad">
                        <input
                          required
                          autoComplete="family-name"
                          value={shipping.lastName}
                          onChange={(e) =>
                            setShipping({ ...shipping, lastName: e.target.value })
                          }
                          className="form-input"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Adres">
                          <textarea
                            required
                            rows={3}
                            autoComplete="street-address"
                            value={shipping.address}
                            onChange={(e) =>
                              setShipping({ ...shipping, address: e.target.value })
                            }
                            placeholder="Mahalle, sokak, kapı / daire no"
                            className="form-input resize-none"
                          />
                        </Field>
                      </div>
                      <Field label="İl">
                        <input
                          required
                          autoComplete="address-level1"
                          value={shipping.city}
                          onChange={(e) =>
                            setShipping({ ...shipping, city: e.target.value })
                          }
                          className="form-input"
                        />
                      </Field>
                      <Field label="İlçe">
                        <input
                          required
                          autoComplete="address-level2"
                          value={shipping.district}
                          onChange={(e) =>
                            setShipping({ ...shipping, district: e.target.value })
                          }
                          className="form-input"
                        />
                      </Field>
                      <Field label="Posta Kodu">
                        <input
                          required
                          autoComplete="postal-code"
                          value={shipping.postalCode}
                          onChange={(e) =>
                            setShipping({ ...shipping, postalCode: e.target.value })
                          }
                          className="form-input"
                        />
                      </Field>
                    </div>
                  </FormCard>
                ) : null}

                {step === "delivery" ? (
                  <FormCard title="Kargo Seçenekleri" eyebrow="3. Adım">
                    <div className="space-y-3">
                      {(
                        [
                          ["standart", "Standart Kargo", "MNG / Yurtiçi"],
                          ["ekspres", "Ekspres Kargo", "Aynı gün hazırlanır"],
                        ] as [DeliveryMethod, string, string][]
                      ).map(([value, label, hint]) => {
                        const selected = delivery === value;
                        const cost = deliveryPricing[value];
                        const free =
                          value === "standart" && totalPrice >= FREE_SHIPPING_THRESHOLD;
                        return (
                          <label
                            key={value}
                            className={`flex items-start gap-4 p-5 border cursor-pointer transition-colors ${
                              selected
                                ? "border-foreground"
                                : "border-foreground/10 hover:border-foreground/30"
                            }`}
                          >
                            <input
                              type="radio"
                              name="delivery"
                              checked={selected}
                              onChange={() => setDelivery(value)}
                              className="mt-1 accent-foreground"
                            />
                            <div className="flex-1 flex justify-between items-start gap-4">
                              <div>
                                <p className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground">
                                  {label}
                                </p>
                                <p className="text-[12px] text-foreground/50 mt-1 font-body">
                                  {deliveryDescriptions[value]} · {hint}
                                </p>
                              </div>
                              <span className="font-audiowide text-xs tracking-tight text-foreground whitespace-nowrap">
                                {free || cost === 0 ? "Ücretsiz" : formatPrice(cost)}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </FormCard>
                ) : null}

                {step === "payment" ? (
                  <FormCard title="Ödeme Yöntemi" eyebrow="4. Adım">
                    <div className="space-y-3 mb-6">
                      {/* Online card payment — visible but not selectable until
                          PayTR virtual POS goes live. We do NOT render card
                          fields ourselves; PayTR's hosted page will handle
                          card entry when the integration is complete. */}
                      <div
                        aria-disabled
                        className="flex items-start gap-4 p-5 border border-dashed border-foreground/15 opacity-60 select-none"
                      >
                        <input type="radio" name="payment" disabled className="mt-1" />
                        <div>
                          <p className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground">
                            Kredi / Banka Kartı
                          </p>
                          <p className="text-[12px] text-foreground/50 mt-1 font-body">
                            Çok yakında — PayTR güvenli ödeme entegrasyonu tamamlandığında
                            aktif olacaktır.
                          </p>
                        </div>
                      </div>

                      {(
                        [
                          ["havale", "Havale / EFT", "Banka bilgileri e-posta ile gönderilir"],
                          ["kapida", "Kapıda Ödeme", "Nakit veya kart ile teslimat anında"],
                        ] as [PaymentMethod, string, string][]
                      ).map(([value, label, hint]) => {
                        const selected = payment === value;
                        return (
                          <label
                            key={value}
                            className={`flex items-start gap-4 p-5 border cursor-pointer transition-colors ${
                              selected
                                ? "border-foreground"
                                : "border-foreground/10 hover:border-foreground/30"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              checked={selected}
                              onChange={() => setPayment(value)}
                              className="mt-1 accent-foreground"
                            />
                            <div>
                              <p className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground">
                                {label}
                              </p>
                              <p className="text-[12px] text-foreground/50 mt-1 font-body">
                                {hint}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <p className="text-[12px] text-foreground/60 bg-foreground/[0.03] border border-foreground/10 px-4 py-3 font-body flex items-start gap-2">
                      <Clock size={13} className="mt-0.5 shrink-0" />
                      <span>
                        Siparişiniz <strong className="text-foreground">“ödeme bekleniyor”</strong>{" "}
                        durumunda alınır. Havale/EFT seçtiyseniz banka bilgilerimiz e-posta ile
                        gönderilir; ödemeniz onaylandığında siparişiniz hazırlanmaya başlar.
                      </span>
                    </p>
                  </FormCard>
                ) : null}

                {step === "review" ? (
                  <FormCard title="Sipariş Onayı" eyebrow="5. Adım">
                    <div className="space-y-8">
                      <ReviewBlock title="İletişim" onEdit={() => setStep("contact")}>
                        <p>{contact.email}</p>
                        <p>{contact.phone}</p>
                      </ReviewBlock>
                      <ReviewBlock title="Teslimat Adresi" onEdit={() => setStep("shipping")}>
                        <p>
                          {shipping.firstName} {shipping.lastName}
                        </p>
                        <p>{shipping.address}</p>
                        <p>
                          {shipping.district}, {shipping.city} {shipping.postalCode}
                        </p>
                      </ReviewBlock>
                      <ReviewBlock title="Kargo" onEdit={() => setStep("delivery")}>
                        <p>
                          {delivery === "ekspres" ? "Ekspres Kargo" : "Standart Kargo"}
                          {" · "}
                          {deliveryDescriptions[delivery]}
                        </p>
                      </ReviewBlock>
                      <ReviewBlock title="Ödeme" onEdit={() => setStep("payment")}>
                        <p>{payment === "havale" ? "Havale / EFT" : "Kapıda Ödeme"}</p>
                        <p className="text-foreground/50">
                          Sipariş “ödeme bekleniyor” durumunda oluşturulur.
                        </p>
                      </ReviewBlock>

                      <label className="flex items-start gap-3 cursor-pointer text-[12px] text-foreground/60 font-body pt-2 border-t border-foreground/10">
                        <input
                          type="checkbox"
                          checked={agree}
                          onChange={(e) => setAgree(e.target.checked)}
                          className="mt-1 accent-foreground"
                        />
                        <span>
                          <strong className="text-foreground">Ön Bilgilendirme Formu</strong> ve{" "}
                          <strong className="text-foreground">Mesafeli Satış Sözleşmesi</strong>'ni
                          okudum, onaylıyorum.
                        </span>
                      </label>
                    </div>
                  </FormCard>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {error ? (
              <p className="mt-6 text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 font-body">
                {error}
              </p>
            ) : null}
            {step === "review" && !isAuthenticated ? (
              <p className="mt-6 text-[13px] text-foreground/60 bg-foreground/[0.03] border border-foreground/10 px-4 py-3 font-body">
                Siparişi tamamlamak için{" "}
                <Link href="/giris?next=/odeme" className="underline text-foreground">
                  giriş yapın
                </Link>
                .
              </p>
            ) : null}

            {/* Step actions */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={goBack}
                disabled={currentIndex === 0}
                className="font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft size={12} /> Geri
              </button>
              {step === "review" ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed || submitting}
                  className="px-10 py-4 bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? "İşleniyor..." : "Siparişi Tamamla"}
                  <Lock size={12} />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canProceed}
                  className="px-10 py-4 bg-foreground text-background font-audiowide text-[11px] uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Devam Et <ArrowRight size={12} />
                </button>
              )}
            </div>
          </section>

          {/* Order summary */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 border border-foreground/10 p-6 md:p-8 space-y-6">
              <h2 className="font-audiowide text-sm uppercase tracking-[0.3em]">
                Sipariş Özeti
              </h2>

              <ul className="space-y-5 max-h-[320px] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 bg-secondary/30 overflow-hidden">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      <span className="absolute -top-1 -right-1 bg-foreground text-background w-5 h-5 flex items-center justify-center text-[10px] font-audiowide rounded-full">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-audiowide uppercase tracking-[0.3em] text-foreground/40">
                        {item.categoryLabel}
                      </p>
                      <p className="text-sm text-foreground line-clamp-1 mt-1">{item.name}</p>
                    </div>
                    <p className="font-audiowide text-xs text-foreground tracking-tight whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-foreground/10 pt-4 space-y-2 text-sm font-body">
                <Line label="Ara toplam" value={formatPrice(totalPrice)} />
                <Line label="Kargo" value={baseShipping === 0 ? "Ücretsiz" : formatPrice(baseShipping)} />
                <div className="flex items-center gap-2 text-xs text-foreground/50 pt-2">
                  <Truck size={12} /> Tahmini teslimat: {estimatedDelivery()}
                </div>
              </div>

              <div className="pt-4 border-t border-foreground/10 flex items-end justify-between">
                <span className="font-audiowide text-xs uppercase tracking-[0.3em]">Toplam</span>
                <span className="font-audiowide text-2xl text-foreground tracking-tight">
                  {formatPrice(orderTotal)}
                </span>
              </div>

              <p className="text-[11px] text-foreground/40 font-body flex items-center gap-2 pt-4 border-t border-foreground/10">
                <Package size={11} /> Tüm siparişler şık Zest Home hediye paketinde gönderilir.
              </p>
            </div>
          </aside>
        </div>
      </div>

    </main>
  );
}

function FormCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-foreground/10 p-6 md:p-10">
      <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40">
        {eyebrow}
      </span>
      <h2 className="font-audiowide text-xl md:text-2xl uppercase tracking-tight mt-2 mb-8">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="font-audiowide text-[9px] uppercase tracking-[0.3em] text-foreground/50 flex items-center gap-2">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function Line({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-foreground/60">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function ReviewBlock({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="border-t border-foreground/10 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-audiowide text-[11px] uppercase tracking-[0.3em] text-foreground/60">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-[10px] font-audiowide uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground border-b border-foreground/10 hover:border-foreground"
        >
          Düzenle
        </button>
      </div>
      <div className="text-sm text-foreground/70 space-y-1 font-body">{children}</div>
    </div>
  );
}
