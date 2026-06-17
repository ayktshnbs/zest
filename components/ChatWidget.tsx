"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Merhaba! Ben Zest Asistan. Ürün önerisi, kargo, iade ve sipariş konularında yardımcı olabilirim. Nasıl yardımcı olayım?",
};

const SUGGESTIONS = [
  "Doğrayıcı öner",
  "Kargo ne zaman gelir?",
  "İade nasıl yapılır?",
  "İndirimli ürünler",
];

// Render markdown-style internal links [text](/path) as clickable links.
function renderRich(text: string) {
  const nodes: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <Link
        key={key++}
        href={match[2]}
        className="font-medium underline underline-offset-2 hover:opacity-70"
      >
        {match[1]}
      </Link>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m !== WELCOME),
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.ok
            ? data.reply
            : data?.error ?? "Bir sorun oluştu, lütfen tekrar deneyin.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Bağlantı hatası. Lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!open ? (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            aria-label="Sohbet asistanını aç"
            className="fixed right-4 bottom-48 lg:right-6 lg:bottom-6 z-40 flex items-center gap-2 rounded-full bg-foreground text-background pl-4 pr-5 py-3 shadow-xl shadow-black/20 hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={20} strokeWidth={1.75} />
            <span className="font-audiowide text-[10px] uppercase tracking-[0.2em]">
              Yardım
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="fixed right-4 bottom-48 lg:right-6 lg:bottom-6 z-[80] flex flex-col w-[calc(100vw-2rem)] sm:w-[380px] h-[calc(100dvh-14rem)] max-h-[560px] bg-background border border-foreground/10 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-foreground/10 bg-foreground text-background">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} strokeWidth={1.75} />
                <div className="leading-tight">
                  <p className="font-audiowide text-[11px] uppercase tracking-[0.25em]">
                    Zest Asistan
                  </p>
                  <p className="text-[10px] opacity-70 font-body">Çevrimiçi</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Sohbeti kapat"
                className="p-1.5 hover:opacity-70 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap font-body ${
                      m.role === "user"
                        ? "bg-foreground text-background rounded-br-sm"
                        : "bg-secondary/40 text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.role === "assistant" ? renderRich(m.content) : m.content}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="bg-secondary/40 rounded-2xl rounded-bl-sm px-4 py-3">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Suggestions (only before the first user message) */}
              {messages.length === 1 && !loading ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[12px] font-body border border-foreground/15 rounded-full px-3 py-1.5 text-foreground/70 hover:border-foreground hover:text-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-foreground/10 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bir şey sorun..."
                className="flex-1 bg-transparent px-2 py-2 text-sm font-body text-foreground placeholder:text-foreground/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Gönder"
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-foreground text-background disabled:opacity-30 hover:opacity-90 transition-opacity"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
