"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const nav = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/orders", label: "Siparişler" },
  { href: "/admin/products", label: "Ürünler" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = isAuthenticated && user?.role === "admin";

  // Bounce anyone who isn't an admin (incl. signed-out, once auth resolves).
  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/");
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <main className="min-h-screen pt-40 text-center">
        <p className="font-audiowide text-[10px] uppercase tracking-[0.4em] text-foreground/40">
          Yükleniyor
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen pt-28 md:pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-5 md:px-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6 mb-10">
          <div>
            <span className="font-audiowide text-[9px] uppercase tracking-[0.4em] text-foreground/40">
              Yönetim Paneli
            </span>
            <p className="font-body text-sm text-foreground/50 mt-1">
              Hoş geldiniz, {user?.name}
            </p>
          </div>
          <nav className="flex gap-2">
            {nav.map((n) => {
              const active =
                n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-4 py-2 font-audiowide text-[10px] uppercase tracking-[0.3em] border transition-colors ${
                    active
                      ? "border-foreground text-foreground"
                      : "border-foreground/15 text-foreground/40 hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
