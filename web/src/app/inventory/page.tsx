"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { Listing } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function NewListingForm({ onCreated }: { onCreated: (listing: Listing) => void }) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setPhoto(selected);
    setPhotoPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("unit", unit);
      formData.append("pricePerUnit", price);
      formData.append("quantityAvailable", quantity);
      if (photo) formData.append("image", photo);

      const listing = await api.postForm<Listing>("/api/listings", formData, token);
      onCreated(listing);
      setTitle("");
      setDescription("");
      setCategory("");
      setPrice("");
      setQuantity("");
      setPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-brand-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <div className="sm:col-span-2">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        {photoPreview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Listing preview" className="h-20 w-20 rounded-md object-cover" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-accent-600 underline"
            >
              Change photo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-300 text-sm text-brand-500 hover:border-accent-400"
          >
            Add a photo (optional, but buyers trust listings with photos)
          </button>
        )}
      </div>
      <input
        required
        placeholder="Title (e.g. Fresh Tomatoes)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 sm:col-span-2"
      />
      <textarea
        required
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 sm:col-span-2"
      />
      <input
        required
        placeholder="Category (e.g. Vegetables)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
      />
      <input
        required
        placeholder="Unit (e.g. kg, ton, dozen)"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
      />
      <input
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Price per unit"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
      />
      <input
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Quantity available"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
      />

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent-500 px-4 py-2 font-semibold text-brand-900 hover:bg-accent-400 disabled:opacity-50 sm:col-span-2"
      >
        {submitting ? "Adding..." : "Add to inventory"}
      </button>
    </form>
  );
}

function InventoryPageContent() {
  const { token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Listing[]>("/api/listings/mine", token)
      .then(setListings)
      .finally(() => setLoading(false));
  }, [token]);

  async function toggleSoldOut(listing: Listing) {
    setActionError(null);
    try {
      const nextStatus = listing.status === "ACTIVE" ? "SOLD_OUT" : "ACTIVE";
      const updated = await api.patch<Listing>(`/api/listings/${listing.id}`, { status: nextStatus }, token);
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function remove(listing: Listing) {
    setActionError(null);
    try {
      await api.del(`/api/listings/${listing.id}`, token);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Your inventory</h1>
      <p className="mt-1 text-sm text-brand-600">List your harvest so buyers can find and order it directly.</p>

      <div className="mt-6">
        <NewListingForm onCreated={(l) => setListings((prev) => [l, ...prev])} />
      </div>

      {actionError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {loading && <p className="text-brand-600">Loading...</p>}
        {!loading && listings.length === 0 && <p className="text-brand-600">No listings yet.</p>}
        {listings.map((listing) => (
          <div key={listing.id} className="flex items-center justify-between rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {listing.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={`${API_URL}${listing.imageUrl}`} alt={listing.title} className="h-14 w-14 rounded-md object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-brand-50 text-xs text-brand-400">
                  No photo
                </div>
              )}
              <div>
                <p className="font-heading font-semibold text-brand-800">{listing.title}</p>
                <p className="text-sm text-brand-600">
                  {listing.quantityAvailable} {listing.unit} available · ${listing.pricePerUnit}/{listing.unit} ·{" "}
                  <span className={listing.status === "ACTIVE" ? "font-medium text-sage-600" : "font-medium text-red-600"}>
                    {listing.status}
                  </span>
                </p>
                {listing.isHidden && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    Hidden by admin — not visible in the marketplace
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSoldOut(listing)}
                className="rounded-md border border-brand-300 px-3 py-1 text-sm text-brand-700 hover:bg-brand-50"
              >
                {listing.status === "ACTIVE" ? "Mark sold out" : "Mark active"}
              </button>
              <button onClick={() => remove(listing)} className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function InventoryPage() {
  return (
    <AuthGuard>
      <main>
        <Navbar />
        <InventoryPageContent />
      </main>
    </AuthGuard>
  );
}
