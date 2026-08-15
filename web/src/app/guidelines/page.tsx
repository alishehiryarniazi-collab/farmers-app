"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Guideline } from "@/lib/types";

function GuidelinesPageContent() {
  const { token } = useAuth();
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Guideline[]>("/api/guidelines", token)
      .then(setGuidelines)
      .finally(() => setLoading(false));
  }, [token]);

  const categories = useMemo(() => Array.from(new Set(guidelines.map((g) => g.category))), [guidelines]);
  const visible = activeCategory ? guidelines.filter((g) => g.category === activeCategory) : guidelines;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Guidelines</h1>
      <p className="mt-1 text-sm text-brand-600">Tips for growing, selling, and staying safe on the platform.</p>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeCategory === null ? "bg-brand-800 text-white" : "border border-brand-300 text-brand-700 hover:border-brand-400"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeCategory === c ? "bg-brand-800 text-white" : "border border-brand-300 text-brand-700 hover:border-brand-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-brand-600">Loading...</p>}
        {!loading && visible.length === 0 && <p className="text-brand-600">No guidelines found.</p>}
        {visible.map((g) => (
          <div key={g.id} className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">{g.category}</p>
            <p className="mt-1 font-heading font-semibold text-brand-800">{g.title}</p>
            <p className="mt-1 text-sm text-brand-700">{g.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function GuidelinesPage() {
  return (
    <AuthGuard>
      <main>
        <Navbar />
        <GuidelinesPageContent />
      </main>
    </AuthGuard>
  );
}
