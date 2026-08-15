"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { RecurringOrder } from "@/lib/types";

function RecurringOrdersContent() {
  const { token } = useAuth();
  const [subs, setSubs] = useState<RecurringOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<RecurringOrder[]>("/api/recurring-orders/mine", token)
      .then(setSubs)
      .finally(() => setLoading(false));
  }, [token]);

  async function toggleActive(sub: RecurringOrder) {
    const updated = await api.patch<RecurringOrder>(`/api/recurring-orders/${sub.id}`, { active: !sub.active }, token);
    setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function cancel(sub: RecurringOrder) {
    await api.del(`/api/recurring-orders/${sub.id}`, token);
    setSubs((prev) => prev.filter((s) => s.id !== sub.id));
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Recurring orders</h1>
      <p className="mt-1 text-sm text-brand-600">Produce you've set up to order automatically on a schedule.</p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-brand-600">Loading...</p>}
        {!loading && subs.length === 0 && (
          <p className="text-brand-600">No recurring orders yet — set one up from a listing in the marketplace.</p>
        )}
        {subs.map((sub) => (
          <div key={sub.id} className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading font-semibold text-brand-800">{sub.listing.title}</p>
                <p className="text-sm text-brand-600">
                  {sub.quantity} {sub.listing.unit} · {sub.frequency === "WEEKLY" ? "Every week" : "Every month"}
                </p>
                <p className="text-xs text-brand-500">
                  Next order: {new Date(sub.nextOrderDate).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-sm font-medium ${sub.active ? "text-sage-600" : "text-brand-400"}`}>
                {sub.active ? "Active" : "Paused"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggleActive(sub)}
                className="rounded-md border border-brand-300 px-3 py-1 text-sm text-brand-700 hover:bg-brand-50"
              >
                {sub.active ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => cancel(sub)}
                className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RecurringOrdersPage() {
  return (
    <AuthGuard>
      <main>
        <Navbar />
        <RecurringOrdersContent />
      </main>
    </AuthGuard>
  );
}
