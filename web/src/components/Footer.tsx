"use client";

import { useLanguage } from "@/lib/language-context";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 bg-brand-900 py-8 text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
        <p className="font-heading font-semibold text-white/80">FarmLink.AI</p>
        <p>{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
