"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { NotificationBell } from "./NotificationBell";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-white">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path
          d="M13 24C13 24 4 19.5 4 11.5C4 6.5 8 3 13 3C18 3 22 6.5 22 11.5C22 19.5 13 24 13 24Z"
          fill="#DFA430"
        />
        <path d="M13 20V6" stroke="#172A3D" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13 9L9 6.5M13 13L8.5 11M13 17L9 15.5" stroke="#172A3D" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      FarmLink.AI
    </Link>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`rounded px-2 py-1 transition-colors ${
        active ? "text-accent-400" : "text-white/75 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex overflow-hidden rounded border border-white/20 text-xs font-medium">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 ${language === "en" ? "bg-accent-500 text-brand-900" : "text-white/70 hover:text-white"}`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ur")}
        className={`px-2 py-1 ${language === "ur" ? "bg-accent-500 text-brand-900" : "text-white/70 hover:text-white"}`}
      >
        اردو
      </button>
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = user
    ? user.role === "ADMIN"
      ? [{ href: "/admin", label: t("nav.admin") }]
      : [
          { href: "/dashboard", label: t("nav.dashboard") },
          { href: "/scanner", label: t("nav.scanner") },
          { href: "/marketplace", label: t("nav.marketplace") },
          ...(user.role === "FARMER" ? [{ href: "/inventory", label: t("nav.inventory") }] : []),
          { href: "/orders", label: t("nav.orders") },
          ...(user.role === "BUYER" ? [{ href: "/recurring-orders", label: t("nav.recurring") }] : []),
          { href: "/messages", label: t("nav.messages") },
          { href: "/guidelines", label: t("nav.guidelines") },
        ]
    : [];

  return (
    <header className="sticky top-0 z-20 bg-brand-900 shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo />

        {/* Desktop nav */}
        <div className="hidden items-center gap-5 text-sm font-medium lg:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {user ? (
            <>
              <NotificationBell />
              <span className="text-sm text-white/70">
                {user.name} <span className="text-white/40">·</span> {user.role}
              </span>
              <button
                onClick={logout}
                className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white">
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="rounded bg-accent-500 px-4 py-1.5 text-sm font-semibold text-brand-900 hover:bg-accent-400"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded text-white"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-brand-900 px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-1 pt-2 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded px-2 py-2 text-white/85 hover:bg-white/10"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            {user ? (
              <>
                <span className="text-sm text-white/70">
                  {user.name} · {user.role}
                </span>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/90"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <div className="flex w-full gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded border border-white/20 px-3 py-2 text-center text-sm text-white"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded bg-accent-500 px-3 py-2 text-center text-sm font-semibold text-brand-900"
                >
                  {t("nav.signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
