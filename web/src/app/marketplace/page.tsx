"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { Conversation, Listing, ListingsPage, Order, RecurringFrequency, RecurringOrder } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function ListingCard({ listing }: { listing: Listing }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"idle" | "ordering" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("WEEKLY");
  const [subMessage, setSubMessage] = useState<string | null>(null);

  async function subscribe() {
    setSubMessage(null);
    try {
      await api.post<RecurringOrder>(
        "/api/recurring-orders",
        { listingId: listing.id, quantity: Number(quantity), frequency },
        token
      );
      setSubMessage("Recurring order set up! Manage it from Recurring orders.");
      setSubscribing(false);
    } catch (err) {
      setSubMessage(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function messageFarmer() {
    const conversation = await api.post<Conversation>("/api/conversations", { listingId: listing.id }, token);
    router.push(`/messages/${conversation.id}`);
  }

  async function placeOrder() {
    setStatus("ordering");
    setMessage(null);
    try {
      const order = await api.post<Order>(
        "/api/orders",
        { listingId: listing.id, quantity: Number(quantity) },
        token
      );
      setStatus("done");
      setMessage(`Order placed — total $${order.totalPrice.toFixed(2)}`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  const isOwnListing = user?.id === listing.farmerId;

  return (
    <div className="flex gap-4 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
      {listing.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`${API_URL}${listing.imageUrl}`}
          alt={listing.title}
          className="h-24 w-24 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs text-brand-400">
          No photo
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading font-semibold text-brand-800">{listing.title}</p>
            <span className="mt-0.5 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
              {listing.category}
            </span>
          </div>
          <p className="font-heading font-semibold text-accent-600">
            ${listing.pricePerUnit}/{listing.unit}
          </p>
        </div>
        <p className="mt-2 text-sm text-brand-700">{listing.description}</p>
        <p className="mt-2 text-xs text-brand-500">
          {listing.quantityAvailable} {listing.unit} available · sold by{" "}
          <Link href={`/farmers/${listing.farmerId}`} className="font-medium text-accent-600 hover:underline">
            {listing.farmer?.name}
          </Link>
        </p>

        {!isOwnListing && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={listing.quantityAvailable}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 rounded border border-brand-300 px-2 py-1"
          />
          <span className="text-sm text-brand-600">{listing.unit}</span>
          <button
            onClick={messageFarmer}
            className="ml-auto rounded border border-brand-400 px-3 py-1.5 text-sm text-brand-700"
          >
            Message farmer
          </button>
          <button
            onClick={placeOrder}
            disabled={status === "ordering"}
            className="rounded bg-accent-500 px-3 py-1.5 text-sm font-semibold text-brand-900 hover:bg-accent-400 disabled:opacity-50"
          >
            {status === "ordering" ? "Placing..." : "Order"}
          </button>
        </div>
        )}
        {message && (
          <p className={`mt-2 text-sm ${status === "error" ? "text-red-600" : "text-sage-700"}`}>{message}</p>
        )}

        {!isOwnListing && (
          <>
            {subscribing ? (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-brand-200 bg-brand-50 p-2">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                  className="rounded border border-brand-300 px-2 py-1 text-sm"
                >
                  <option value="WEEKLY">Every week</option>
                  <option value="MONTHLY">Every month</option>
                </select>
                <button
                  onClick={subscribe}
                  className="rounded bg-brand-800 px-3 py-1 text-sm font-medium text-white hover:bg-brand-900"
                >
                  Confirm
                </button>
                <button onClick={() => setSubscribing(false)} className="text-sm text-brand-500">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSubscribing(true)}
                className="mt-2 text-sm font-medium text-brand-600 underline"
              >
                Set up recurring order
              </button>
            )}
            {subMessage && <p className="mt-1 text-sm text-sage-700">{subMessage}</p>}
          </>
        )}
      </div>
    </div>
  );
}

type SortOption = "newest" | "price_asc" | "price_desc";

function MarketplacePageContent() {
  const { token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounce free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api.get<string[]>("/api/listings/categories", token).then(setCategories);
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, minPrice, maxPrice, sort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("sort", sort);
    params.set("page", String(page));

    setLoading(true);
    api
      .get<ListingsPage>(`/api/listings?${params.toString()}`, token)
      .then((res) => {
        setListings(res.listings);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [token, debouncedSearch, category, minPrice, maxPrice, sort, page]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Marketplace</h1>
      <p className="mt-1 text-sm text-brand-600">Browse produce listed directly by farmers.</p>

      <div className="mt-4 space-y-3 rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
        <input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-brand-300 px-2 py-2 text-sm focus:border-accent-400 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rounded-md border border-brand-300 px-2 py-2 text-sm focus:border-accent-400 focus:outline-none"
          />
          <input
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-md border border-brand-300 px-2 py-2 text-sm focus:border-accent-400 focus:outline-none"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-md border border-brand-300 px-2 py-2 text-sm focus:border-accent-400 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-brand-600">Loading...</p>}
        {!loading && listings.length === 0 && <p className="text-brand-600">No listings found.</p>}
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-brand-300 px-3 py-1.5 text-sm text-brand-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-brand-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-brand-300 px-3 py-1.5 text-sm text-brand-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

export default function MarketplacePage() {
  return (
    <AuthGuard>
      <main>
        <Navbar />
        <MarketplacePageContent />
      </main>
    </AuthGuard>
  );
}
