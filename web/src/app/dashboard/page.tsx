"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { WeatherWidget } from "@/components/WeatherWidget";
import type { TranslationKey } from "@/lib/translations";

const ICONS: Record<string, string> = {
  "/scanner": "M9 3h6l1.5 3H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h2.5L9 3z M12 17a4 4 0 100-8 4 4 0 000 8z",
  "/marketplace": "M4 8l1-4h14l1 4M4 8v11a1 1 0 001 1h14a1 1 0 001-1V8M4 8h16M9 12a3 3 0 006 0",
  "/inventory": "M4 7l8-4 8 4M4 7v10l8 4 8-4V7M4 7l8 4 8-4M12 11v10",
  "/orders": "M6 3h12l1 5H5l1-5zM5 8h14v11a1 1 0 01-1 1H6a1 1 0 01-1-1V8zM9 12h6",
  "/messages": "M21 12a8 8 0 10-3.5 6.6L21 20l-1.2-3.6A7.96 7.96 0 0021 12z",
  "/guidelines": "M12 3a5 5 0 015 5v3.2c0 .9.3 1.8.9 2.5l1.1 1.3H5l1.1-1.3c.6-.7.9-1.6.9-2.5V8a5 5 0 015-5z M10 19a2 2 0 004 0",
  profile: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 20c0-4 4-6 8-6s8 2 8 6",
};

const CARDS: { href: string; titleKey: TranslationKey; descKey: TranslationKey; roles: string[]; icon?: string }[] = [
  { href: "/scanner", titleKey: "dashboard.scanner.title", descKey: "dashboard.scanner.desc", roles: ["FARMER", "BUYER"] },
  { href: "/marketplace", titleKey: "dashboard.marketplace.title", descKey: "dashboard.marketplace.desc", roles: ["FARMER", "BUYER"] },
  { href: "/inventory", titleKey: "dashboard.inventory.title", descKey: "dashboard.inventory.desc", roles: ["FARMER"] },
  { href: "/orders", titleKey: "dashboard.orders.title", descKey: "dashboard.orders.desc", roles: ["FARMER", "BUYER"] },
  { href: "/messages", titleKey: "dashboard.messages.title", descKey: "dashboard.messages.desc", roles: ["FARMER", "BUYER"] },
  { href: "/guidelines", titleKey: "dashboard.guidelines.title", descKey: "dashboard.guidelines.desc", roles: ["FARMER", "BUYER"] },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [user, router]);

  if (user?.role === "ADMIN") return null;

  const cards =
    user?.role === "FARMER"
      ? [
          ...CARDS,
          {
            href: `/farmers/${user.id}`,
            titleKey: "dashboard.profile.title" as TranslationKey,
            descKey: "dashboard.profile.desc" as TranslationKey,
            roles: ["FARMER"],
            icon: "profile",
          },
        ]
      : CARDS;

  return (
    <AuthGuard>
      <main>
        <Navbar />
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="font-heading text-2xl font-bold text-brand-800">
            {t("dashboard.welcome")}, {user?.name}
          </h1>
          <p className="mt-2 text-brand-600">
            {t("dashboard.signedInAs")}{" "}
            <strong className="text-brand-800">{user?.role === "FARMER" ? t("auth.farmer") : t("auth.buyer")}</strong>.
          </p>

          {user?.role === "FARMER" && (
            <div className="mt-6">
              <WeatherWidget />
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {cards.filter((c) => c.roles.includes(user?.role ?? "")).map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex items-start gap-4 rounded-lg border border-brand-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-600 group-hover:bg-accent-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d={ICONS[card.icon ?? card.href]} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-heading font-semibold text-brand-800">{t(card.titleKey)}</p>
                  <p className="mt-1 text-sm text-brand-600">{t(card.descKey)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
