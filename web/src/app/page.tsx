"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/translations";

const FEATURES: { titleKey: TranslationKey; descKey: TranslationKey; icon: React.ReactNode }[] = [
  {
    titleKey: "home.feature.scanner.title",
    descKey: "home.feature.scanner.desc",
    icon: (
      <path
        d="M9 3h6l1.5 3H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h2.5L9 3z M12 17a4 4 0 100-8 4 4 0 000 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    titleKey: "home.feature.marketplace.title",
    descKey: "home.feature.marketplace.desc",
    icon: (
      <path
        d="M4 8l1-4h14l1 4M4 8v11a1 1 0 001 1h14a1 1 0 001-1V8M4 8h16M9 12a3 3 0 006 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
  },
  {
    titleKey: "home.feature.chat.title",
    descKey: "home.feature.chat.desc",
    icon: (
      <path
        d="M21 12a8 8 0 10-3.5 6.6L21 20l-1.2-3.6A7.96 7.96 0 0021 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    titleKey: "home.feature.notifications.title",
    descKey: "home.feature.notifications.desc",
    icon: (
      <path
        d="M12 3a5 5 0 015 5v3.2c0 .9.3 1.8.9 2.5l1.1 1.3H5l1.1-1.3c.6-.7.9-1.6.9-2.5V8a5 5 0 015-5z M10 19a2 2 0 004 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
  },
];

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main>
      <Navbar />

      <section className="bg-brand-900">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            {t("home.title1")} <span className="text-accent-400">{t("home.title2")}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">{t("home.subtitle")}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded bg-accent-500 px-6 py-3 font-semibold text-brand-900 hover:bg-accent-400"
            >
              {t("home.getStarted")}
            </Link>
            <Link
              href="/login"
              className="rounded border border-white/25 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              {t("home.login")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="rounded-lg border border-brand-200 bg-white p-5">
              <svg width="28" height="28" viewBox="0 0 24 24" className="text-accent-500">
                {f.icon}
              </svg>
              <p className="mt-3 font-heading font-semibold text-brand-800">{t(f.titleKey)}</p>
              <p className="mt-1 text-sm text-brand-600">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
