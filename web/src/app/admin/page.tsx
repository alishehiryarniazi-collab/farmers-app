"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { Stars } from "@/components/Stars";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type {
  AdminListingsPage,
  AdminReviewsPage,
  AdminStats,
  AdminUser,
  AdminUsersPage,
  Guideline,
} from "@/lib/types";

type Tab = "users" | "listings" | "reviews" | "guidelines";

function StatsGrid({ stats }: { stats: AdminStats | null }) {
  if (!stats) return <p className="text-brand-600">Loading stats...</p>;
  const cells: { label: string; value: string | number }[] = [
    { label: "Users", value: stats.totalUsers },
    { label: "Farmers", value: stats.totalFarmers },
    { label: "Buyers", value: stats.totalBuyers },
    { label: "Suspended", value: stats.suspendedUsers },
    { label: "Listings", value: stats.totalListings },
    { label: "Active listings", value: stats.activeListings },
    { label: "Hidden listings", value: stats.hiddenListings },
    { label: "Orders", value: stats.totalOrders },
    { label: "Completed orders", value: stats.completedOrders },
    { label: "Revenue (paid)", value: `$${stats.totalRevenue.toFixed(2)}` },
    { label: "Reviews", value: stats.totalReviews },
    { label: "Hidden reviews", value: stats.hiddenReviews },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-brand-500">{c.label}</p>
          <p className="mt-1 font-heading text-xl font-bold text-brand-800">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-md border border-brand-300 px-3 py-1.5 text-sm text-brand-700 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-brand-600">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-md border border-brand-300 px-3 py-1.5 text-sm text-brand-700 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function UsersTab() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, role]);

  function load() {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (role) params.set("role", role);
    params.set("page", String(page));
    setLoading(true);
    api
      .get<AdminUsersPage>(`/api/admin/users?${params.toString()}`, token)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(load, [token, debouncedSearch, role, page]);

  async function toggleSuspend(u: AdminUser) {
    setBusyId(u.id);
    setError(null);
    try {
      await api.patch(`/api/admin/users/${u.id}`, { isSuspended: !u.isSuspended }, token);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-brand-300 px-2 py-2 text-sm focus:border-accent-400 focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="FARMER">Farmer</option>
          <option value="BUYER">Buyer</option>
        </select>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-brand-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Listings</th>
              <th className="px-3 py-2">Orders</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-brand-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && data?.users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-brand-500">
                  No users found.
                </td>
              </tr>
            )}
            {data?.users.map((u) => (
              <tr key={u.id} className="border-t border-brand-100">
                <td className="px-3 py-2 font-medium text-brand-800">{u.name}</td>
                <td className="px-3 py-2 text-brand-600">{u.email ?? u.phone}</td>
                <td className="px-3 py-2 text-brand-600">{u.role}</td>
                <td className="px-3 py-2 text-brand-600">{u._count.listings}</td>
                <td className="px-3 py-2 text-brand-600">{u._count.orders}</td>
                <td className="px-3 py-2">
                  {u.isSuspended ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Suspended
                    </span>
                  ) : (
                    <span className="rounded-full bg-sage-50 px-2 py-0.5 text-xs font-medium text-sage-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => toggleSuspend(u)}
                    disabled={busyId === u.id}
                    className={`rounded border px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                      u.isSuspended
                        ? "border-sage-300 text-sage-700 hover:bg-sage-50"
                        : "border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {u.isSuspended ? "Unsuspend" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}

function ListingsTab() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminListingsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch]);

  function load() {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    setLoading(true);
    api
      .get<AdminListingsPage>(`/api/admin/listings?${params.toString()}`, token)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(load, [token, debouncedSearch, page]);

  async function toggleHidden(id: string, isHidden: boolean) {
    setBusyId(id);
    try {
      await api.patch(`/api/admin/listings/${id}`, { isHidden: !isHidden }, token);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <input
        placeholder="Search listing titles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-brand-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Farmer</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-brand-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && data?.listings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-brand-500">
                  No listings found.
                </td>
              </tr>
            )}
            {data?.listings.map((l) => (
              <tr key={l.id} className="border-t border-brand-100">
                <td className="px-3 py-2 font-medium text-brand-800">{l.title}</td>
                <td className="px-3 py-2 text-brand-600">{l.farmer?.name}</td>
                <td className="px-3 py-2 text-brand-600">{l.category}</td>
                <td className="px-3 py-2 text-brand-600">
                  ${l.pricePerUnit}/{l.unit}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                    {l.status}
                  </span>
                  {l.isHidden && (
                    <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => toggleHidden(l.id, l.isHidden)}
                    disabled={busyId === l.id}
                    className={`rounded border px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                      l.isHidden
                        ? "border-sage-300 text-sage-700 hover:bg-sage-50"
                        : "border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {l.isHidden ? "Unhide" : "Hide"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}

function ReviewsTab() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminReviewsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<AdminReviewsPage>(`/api/admin/reviews?page=${page}`, token)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(load, [token, page]);

  async function toggleHidden(id: string, isHidden: boolean) {
    setBusyId(id);
    try {
      await api.patch(`/api/admin/reviews/${id}`, { isHidden: !isHidden }, token);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {loading && <p className="text-brand-600">Loading...</p>}
        {!loading && data?.reviews.length === 0 && <p className="text-brand-600">No reviews found.</p>}
        {data?.reviews.map((r) => (
          <div key={r.id} className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Stars value={r.rating} />
                <p className="mt-1 text-sm text-brand-700">{r.comment ?? <em className="text-brand-400">No comment</em>}</p>
                <p className="mt-1 text-xs text-brand-500">
                  {r.buyer?.name} reviewed {r.farmer?.name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.isHidden && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Hidden</span>
                )}
                <button
                  onClick={() => toggleHidden(r.id, r.isHidden)}
                  disabled={busyId === r.id}
                  className={`rounded border px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                    r.isHidden
                      ? "border-sage-300 text-sage-700 hover:bg-sage-50"
                      : "border-red-300 text-red-700 hover:bg-red-50"
                  }`}
                >
                  {r.isHidden ? "Unhide" : "Hide"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}

function GuidelinesTab() {
  const { token } = useAuth();
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", body: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<Guideline[]>("/api/guidelines", token)
      .then(setGuidelines)
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  function startAdd() {
    setForm({ title: "", category: "", body: "" });
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(g: Guideline) {
    setForm({ title: g.title, category: g.category, body: g.body });
    setEditingId(g.id);
    setAdding(true);
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await api.patch(`/api/guidelines/${editingId}`, form, token);
      } else {
        await api.post("/api/guidelines", form, token);
      }
      cancel();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await api.del(`/api/guidelines/${id}`, token);
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!adding && (
        <button
          onClick={startAdd}
          className="rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-accent-400"
        >
          + Add guideline
        </button>
      )}

      {adding && (
        <div className="mt-3 space-y-3 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none"
          />
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none"
          />
          <textarea
            placeholder="Body"
            rows={4}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy || !form.title || !form.category || !form.body}
              className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50"
            >
              {editingId ? "Save changes" : "Create"}
            </button>
            <button onClick={cancel} className="rounded-md border border-brand-300 px-4 py-2 text-sm text-brand-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading && <p className="text-brand-600">Loading...</p>}
        {guidelines.map((g) => (
          <div key={g.id} className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">{g.category}</p>
                <p className="mt-1 font-heading font-semibold text-brand-800">{g.title}</p>
                <p className="mt-1 text-sm text-brand-700">{g.body}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => startEdit(g)}
                  className="rounded border border-brand-300 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(g.id)}
                  disabled={busy}
                  className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPageContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    api.get<AdminStats>("/api/admin/stats", token).then(setStats);
  }, [token]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "listings", label: "Listings" },
    { key: "reviews", label: "Reviews" },
    { key: "guidelines", label: "Guidelines" },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-heading text-2xl font-bold text-brand-800">Admin panel</h1>
      <p className="mt-1 text-sm text-brand-600">Signed in as {user?.name}. Manage users, listings, and content moderation.</p>

      <div className="mt-6">
        <StatsGrid stats={stats} />
      </div>

      <div className="mt-8 flex gap-1 border-b border-brand-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border border-b-0 border-brand-200 bg-white text-brand-800"
                : "text-brand-500 hover:text-brand-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "users" && <UsersTab />}
        {tab === "listings" && <ListingsTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "guidelines" && <GuidelinesTab />}
      </div>
    </section>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard role="ADMIN">
      <main>
        <Navbar />
        <AdminPageContent />
      </main>
    </AuthGuard>
  );
}
