"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { User, MapPin, Package, ShieldCheck, LogOut } from "lucide-react";

const tabs = [
  { href: "/hesabim", label: "Genel Bakış", icon: User, exact: true },
  { href: "/hesabim/profil", label: "Profil Bilgilerim", icon: User, exact: false },
  { href: "/hesabim/adresler", label: "Adreslerim", icon: MapPin, exact: false },
  { href: "/hesabim/siparisler", label: "Siparişlerim", icon: Package, exact: false },
  { href: "/hesabim/guvenlik", label: "Şifre ve Güvenlik", icon: ShieldCheck, exact: false },
] as const;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/hesabim";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/giris?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
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
      <div className="max-w-5xl mx-auto px-5 md:px-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6 mb-8">
          <div>
            <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40">
              Hesabım
            </span>
            <h1 className="font-audiowide text-3xl md:text-4xl uppercase tracking-tight mt-2">
              Merhaba, {user?.name?.split(" ")[0] ?? ""} 👋
            </h1>
            <p className="text-foreground/40 font-body text-sm mt-1">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="flex items-center gap-2 font-audiowide text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground border-b border-foreground/10 hover:border-foreground pb-1"
          >
            <LogOut size={13} />
            Çıkış Yap
          </button>
        </div>

        {/* Tab nav — horizontally scrollable on mobile, matches the checkout
            step-indicator pattern already used elsewhere in the app. */}
        <nav className="mb-10 -mx-1 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 font-audiowide text-[10px] uppercase tracking-[0.25em] border-b-2 transition-colors ${
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-foreground/40 hover:text-foreground/70"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </main>
  );
}
