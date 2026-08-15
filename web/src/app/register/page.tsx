"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import type { AuthResponse, Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("FARMER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const isEmail = contact.includes("@");
      const res = await api.post<AuthResponse>("/api/auth/register", {
        name,
        password,
        role,
        ...(isEmail ? { email: contact } : { phone: contact }),
      });
      login(res.token, res.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-sm px-4 py-16">
        <div className="rounded-xl border border-brand-200 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-brand-800">{t("auth.register.heading")}</h1>
          <p className="mt-1 text-sm text-brand-500">{t("auth.register.sub")}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-700">{t("auth.fullName")}</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700">{t("auth.emailOrPhone")}</label>
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="you@example.com or +1234567890"
                className="mt-1 w-full rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700">{t("auth.password")}</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700">{t("auth.iAmA")}</label>
              <div className="mt-1 flex gap-3">
                {(["FARMER", "BUYER"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      role === r
                        ? "border-brand-800 bg-brand-800 text-white"
                        : "border-brand-300 text-brand-700 hover:border-brand-400"
                    }`}
                  >
                    {r === "FARMER" ? t("auth.farmer") : t("auth.buyer")}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-accent-500 px-4 py-2.5 font-semibold text-brand-900 hover:bg-accent-400 disabled:opacity-50"
            >
              {submitting ? t("auth.creatingAccount") : t("auth.signupButton")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
