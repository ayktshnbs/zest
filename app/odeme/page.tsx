"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Lock,
  Mail,
  Package,
  Phone,
  Truck,
  User,
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
type DeliveryMethod = "standart" | "ekspres" | "magazadan";
type PaymentMethod = "kart" | "havale" | "kapida";
type PaymentForm = {
  cardName: string;
  cardNumber: string;
  cardExp: string;
  cardCvv: string;
};

const deliveryPricing: Record<DeliveryMethod, number> = {
  standart: STANDARD_SHIPPING_COST,
  ekspres: 89.9,
  magazadan: 0,
};

const deliveryDescriptions: Record<DeliveryMethod, string> = {
  standart: `Tahmini ${estimatedDelivery()}`,
  ekspres: "1 iş günü içinde teslim",
  magazadan: "Mağazadan ücretsiz teslim alın (İstanbul Beşiktaş)",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice, clearCart, isHydrated } = useCart();
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
  const [payment, setPayment] = useState<PaymentMethod>("kart");
  const [card, setCard] = useState<PaymentForm>({
    cardName: "",
    cardNumber: "",
    cardExp: "",
    cardCvv: "",
  });
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isHydrated && cart.length === 0) {
      router.replace("/sepet");
    }
  }, [isHydrated, cart.length, router]);

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
    if (step === "payment") {
      if (payment !== "kart") return true;
      return (
        card.cardName.trim().length >= 3 &&
        card.cardNumber.replace(/\s/g, "").length >= 14 &&
        /\d{2}\/\d{2}/.test(card.cardExp) &&
        card.cardCvv.length >= 3
      );
    }
    if (step === "review") return agree;
    return true;
  }, [step, contact, shipping, delivery, payment, card, agree]);

  const goNext = () => {
    const idx = steps.findIndex((s) => s.id === step);
    if (idx < steps.length - 1) setStep(steps[idx + 1].id);
  };
  const goBack = () => {
    const idx = steps.findIndex((s) => s.id === step);
    if (idx > 0) setStep(steps[idx - 1].id);
  };

  const handleSubmit = () => {
    if (!agree) return;
    setSubmitting(true);
    setTimeout(() => {
      clearCart();
      router.replace("/odeme/basarili");
    }, 800);
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
                          ["magazadan", "Mağazadan Teslim", "Ücretsiz seçenek"],
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
                      {(
                        [
                          ["kart", "Kredi / Banka Kartı", "Visa, MasterCard, Troy"],
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

                    {payment === "kart" ? (
                      <div className="space-y-5">
                        <Field label="Kart Üzerindeki İsim" icon={<User size={14} />}>
                          <input
                            value={card.cardName}
                            onChange={(e) =>
                              setCard({ ...card, cardName: e.target.value })
                            }
                            placeholder="Adınız Soyadınız"
                            autoComplete="cc-name"
                            className="form-input"
                          />
                        </Field>
                        <Field label="Kart Numarası" icon={<CreditCard size={14} />}>
                          <input
                            value={card.cardNumber}
                            onChange={(e) =>
                              setCard({
                                ...card,
                                cardNumber: e.target.value
                                  .replace(/[^\d ]/g, "")
                                  .replace(/(\d{4})(?=\d)/g, "$1 ")
                                  .slice(0, 19),
                              })
                            }
                            placeholder="0000 0000 0000 0000"
                            autoComplete="cc-number"
                            inputMode="numeric"
                            className="form-input tracking-widest"
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-5">
                          <Field label="Son Kullanma (AA/YY)">
                            <input
                              value={card.cardExp}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                                const formatted =
                                  digits.length > 2
                                    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                                    : digits;
                                setCard({ ...card, cardExp: formatted });
                              }}
                              placeholder="MM/YY"
                              autoComplete="cc-exp"
                              className="form-input"
                            />
                          </Field>
                          <Field label="CVV">
                            <input
                              value={card.cardCvv}
                              onChange={(e) =>
                                setCard({
                                  ...card,
                                  cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                                })
                              }
                              placeholder="123"
                              autoComplete="cc-csc"
                              inputMode="numeric"
                              className="form-input"
                            />
                          </Field>
                        </div>
                        <p className="text-[11px] text-foreground/40 font-body flex items-center gap-2">
                          <Lock size={11} /> 256-bit SSL ile şifrelenmiş ödeme. Kart bilgileriniz
                          saklanmaz.
                        </p>
                      </div>
                    ) : null}
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
                          {delivery === "standart"
                            ? "Standart Kargo"
                            : delivery === "ekspres"
                            ? "Ekspres Kargo"
                            : "Mağazadan Teslim"}
                          {" · "}
                          {deliveryDescriptions[delivery]}
                        </p>
                      </ReviewBlock>
                      <ReviewBlock title="Ödeme" onEdit={() => setStep("payment")}>
                        <p>
                          {payment === "kart"
                            ? `Kredi/Banka Kartı · **** ${card.cardNumber.slice(-4)}`
                            : payment === "havale"
                            ? "Havale / EFT"
                            : "Kapıda Ödeme"}
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
                <Package size={11} /> Tüm siparişler şık Zest Kitchene hediye paketinde gönderilir.
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
