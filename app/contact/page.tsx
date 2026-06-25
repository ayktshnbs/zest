"use client";

import {
  Mail,
  Phone,
  MapPin,
  Send,
  Instagram,
  Sparkles,
  MessageCircle,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// FormSubmit.co — free form-to-email relay, no API key, no signup. The first
// submission triggers a one-time activation email to the recipient; click the
// link in it once and every future submission lands in the inbox.
// We use the AJAX endpoint so the page doesn't navigate away on submit — the
// in-page success/error UI keeps working.
const FORMSUBMIT_INBOX = "info@zest-home.net";
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${FORMSUBMIT_INBOX}`;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — real users don't see this field, so it should stay empty.
  // Bots that fill every input out themselves out by setting it.
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid =
    name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    message.trim().length >= 10;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    if (website.trim().length > 0) return; // honeypot tripped
    setErr(null);
    setSending(true);
    try {
      const res = await fetch(FORMSUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          // FormSubmit reads these to shape the outbound message:
          _subject: subject.trim()
            ? `ZestHome İletişim · ${subject.trim()}`
            : "ZestHome İletişim · Yeni mesaj",
          _replyto: email.trim(),
          _template: "table",
          _captcha: "false",
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!data?.success) {
        throw new Error("Mesaj gönderilemedi.");
      }
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Mesaj gönderilemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        {/* Header */}
        <div className="mb-20 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 mb-6 inline-flex bg-primary/5 px-4 py-2 rounded-full mx-auto"
          >
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Bize Ulaşın
            </span>
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-display text-6xl md:text-8xl font-black text-foreground mb-8 tracking-tighter leading-tight"
          >
            Sizi Dinlemeye <br />
            <span className="text-primary italic">Hazırız.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-body text-xl text-neutral-600 max-w-2xl mx-auto font-medium"
          >
            Her türlü soru, öneri ve iş birliği teklifleriniz için buradayız.
            Ekibimiz en kısa sürede size geri dönüş yapacaktır.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="relative overflow-hidden bg-neutral-950 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-premium">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.03] rounded-full -mr-20 -mt-20 pointer-events-none" />

              <h3 className="relative font-display text-2xl font-black mb-10 tracking-tighter text-white">
                İletişim Kanalları
              </h3>

              <div className="relative space-y-4">
                {/* E-posta — clickable mailto */}
                <a
                  href="mailto:info@zest-home.net"
                  className="flex items-center gap-5 -mx-3 px-3 py-3 rounded-2xl group hover:bg-white/[0.04] transition-colors"
                >
                  <div className="shrink-0 w-12 h-12 grid place-items-center bg-white/[0.08] text-white rounded-2xl group-hover:bg-white group-hover:text-neutral-950 transition-colors">
                    <Mail size={18} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">
                      E-posta
                    </p>
                    <p className="font-medium text-white truncate">info@zest-home.net</p>
                  </div>
                </a>

                {/* Telefon — clickable tel */}
                <a
                  href="tel:+905322809206"
                  className="flex items-center gap-5 -mx-3 px-3 py-3 rounded-2xl group hover:bg-white/[0.04] transition-colors"
                >
                  <div className="shrink-0 w-12 h-12 grid place-items-center bg-white/[0.08] text-white rounded-2xl group-hover:bg-white group-hover:text-neutral-950 transition-colors">
                    <Phone size={18} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">
                      Telefon
                    </p>
                    <p className="font-medium text-white">0532 280 92 06</p>
                  </div>
                </a>

                {/* Adres — opens Google Maps */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=MNG+Blue+Boutique+Residence+Halkalı+Caddesi+Küçükçekmece+İstanbul"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-5 -mx-3 px-3 py-3 rounded-2xl group hover:bg-white/[0.04] transition-colors"
                >
                  <div className="shrink-0 w-12 h-12 grid place-items-center bg-white/[0.08] text-white rounded-2xl group-hover:bg-white group-hover:text-neutral-950 transition-colors">
                    <MapPin size={18} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">
                      Adres
                    </p>
                    <address className="not-italic font-medium text-white leading-snug">
                      MNG Blue Boutique Residence
                      <br />
                      Halkalı Merkez · Halkalı Caddesi No: 232
                      <br />
                      <span className="text-white/65">Küçükçekmece, İstanbul 34295 · Türkiye</span>
                    </address>
                  </div>
                </a>
              </div>

              <div className="mt-16 pt-10 border-t border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-6">
                  Sosyal Medya
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/zesthomekitchen/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="p-4 bg-white/50 text-foreground rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-sm"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="https://wa.me/905322809206"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="p-4 bg-white/50 text-foreground rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-sm"
                  >
                    {/* WhatsApp glyph (lucide doesn't ship one) */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M19.05 4.91A9.82 9.82 0 0 0 12 2a9.94 9.94 0 0 0-8.6 14.91L2 22l5.25-1.37A9.94 9.94 0 0 0 12 22a9.93 9.93 0 0 0 9.95-9.95 9.86 9.86 0 0 0-2.9-7.14zM12 20.16a8.2 8.2 0 0 1-4.21-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.27 8.27 0 1 1 14.99-4.65A8.27 8.27 0 0 1 12 20.16zm4.53-6.16c-.25-.12-1.47-.72-1.7-.81s-.39-.12-.55.12-.64.81-.78.97-.29.18-.54.06a6.74 6.74 0 0 1-2-1.23 7.51 7.51 0 0 1-1.38-1.72c-.14-.25 0-.38.11-.5s.25-.29.37-.43.16-.25.25-.42.04-.32-.02-.44-.55-1.32-.75-1.81-.4-.41-.55-.42h-.47a.9.9 0 0 0-.66.31 2.78 2.78 0 0 0-.87 2.06 4.84 4.84 0 0 0 1 2.56 11.05 11.05 0 0 0 4.24 3.74c.6.25 1.07.4 1.43.51a3.47 3.47 0 0 0 1.58.1 2.57 2.57 0 0 0 1.7-1.2 2.13 2.13 0 0 0 .15-1.2c-.06-.1-.23-.16-.48-.28z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-neutral-950 text-white p-10 rounded-[3rem] shadow-premium flex flex-col justify-between aspect-square">
              <MessageCircle size={48} className="text-white" />
              <div>
                <h4 className="font-display text-2xl font-black tracking-tighter mb-4 text-white">
                  Canlı Destek
                </h4>
                <p className="text-white/70 font-medium mb-8">
                  Hafta içi 09:00 - 18:00 saatleri arasında yanınızdayız.
                </p>
                <a
                  href="https://wa.me/905322809206"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full py-4 text-xs tracking-widest uppercase font-audiowide border border-white/30 text-white hover:bg-white hover:text-neutral-950 transition-colors"
                >
                  Yardım Al
                </a>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8"
          >
            <div className="bg-neutral-950 p-10 md:p-16 rounded-[4rem] border border-white/10 shadow-premium relative overflow-hidden">
              <form onSubmit={submit} className="space-y-10">
                {/* Honeypot — invisible to real users, irresistible to dumb bots. */}
                <div aria-hidden className="absolute -left-[5000px] top-0">
                  <label>
                    Web sitesi
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-4">
                      Adınız
                    </label>
                    <input
                      type="text"
                      placeholder="Ahmet Yılmaz"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={120}
                      required
                      className="w-full px-8 py-5 rounded-[2rem] bg-white/5 text-white placeholder:text-white/40 border border-white/10 focus:border-white/30 focus:bg-white/10 outline-none font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-4">
                      E-posta
                    </label>
                    <input
                      type="email"
                      placeholder="ahmet@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                      required
                      className="w-full px-8 py-5 rounded-[2rem] bg-white/5 text-white placeholder:text-white/40 border border-white/10 focus:border-white/30 focus:bg-white/10 outline-none font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-4">
                    Konu
                  </label>
                  <input
                    type="text"
                    placeholder="Nasıl yardımcı olabiliriz?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    className="w-full px-8 py-5 rounded-[2rem] bg-white/5 text-white placeholder:text-white/40 border border-white/10 focus:border-white/30 focus:bg-white/10 outline-none font-medium transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-4">
                    Mesajınız
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Mesajınızı buraya yazın..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={5000}
                    required
                    className="w-full px-8 py-6 rounded-[2.5rem] bg-white/5 text-white placeholder:text-white/40 border border-white/10 focus:border-white/30 focus:bg-white/10 outline-none font-medium transition-all resize-none"
                  />
                </div>

                {err ? (
                  <p className="text-red-600 font-medium text-sm">{err}</p>
                ) : null}
                {sent ? (
                  <p className="inline-flex items-center gap-2 text-green-700 font-medium">
                    <Check size={18} /> Mesajınız gönderildi. En kısa sürede
                    dönüş yapacağız.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={!valid || sending}
                  className="w-full md:w-auto btn-primary py-6 px-16 text-lg tracking-[0.2em] group uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? "Gönderiliyor…" : "Mesaj Gönder"}
                  <Send
                    size={20}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
