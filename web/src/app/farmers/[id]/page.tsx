"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Stars } from "@/components/Stars";
import type { FarmerProfile, Review } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function EditBio({ initialBio, onSaved }: { initialBio: string | null; onSaved: (bio: string) => void }) {
  const { token } = useAuth();
  const [bio, setBio] = useState(initialBio ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.patch("/api/auth/me", { bio }, token);
      onSaved(bio);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="mt-2 text-sm font-medium text-accent-600 underline">
        {initialBio ? "Edit bio" : "Add a bio"}
      </button>
    );
  }

  return (
    <div className="mt-2">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Tell buyers about your farm..."
        className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-accent-500 px-3 py-1.5 text-sm font-semibold text-brand-900 hover:bg-accent-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="rounded-md border border-brand-300 px-3 py-1.5 text-sm text-brand-700">
          Cancel
        </button>
      </div>
    </div>
  );
}

function FarmerProfileContent({ farmerId }: { farmerId: string }) {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<FarmerProfile>(`/api/farmers/${farmerId}`, token)
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
    api.get<Review[]>(`/api/farmers/${farmerId}/reviews`, token).then(setReviews);
  }, [farmerId, token]);

  if (loading) return <p className="text-brand-600">Loading...</p>;
  if (error || !profile) return <p className="text-red-600">{error ?? "Farmer not found"}</p>;

  const isOwnProfile = user?.id === profile.id;
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" });

  return (
    <>
      <div className="rounded-lg border border-brand-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-800 font-heading text-xl font-bold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-brand-800">{profile.name}</h1>
            <p className="text-sm text-brand-500">Farmer · Member since {joined}</p>
            {profile.reviewCount > 0 ? (
              <div className="mt-1 flex items-center gap-1.5">
                <Stars value={Math.round(profile.avgRating ?? 0)} />
                <span className="text-sm text-brand-600">
                  {profile.avgRating?.toFixed(1)} ({profile.reviewCount} review{profile.reviewCount === 1 ? "" : "s"})
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-brand-400">No reviews yet</p>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-brand-700">{profile.bio || "No bio yet."}</p>
        {isOwnProfile && <EditBio initialBio={profile.bio} onSaved={(bio) => setProfile({ ...profile, bio })} />}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-800">
        {isOwnProfile ? "Your listings" : `${profile.name}'s listings`}
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {profile.listings.length === 0 && <p className="text-brand-600">No active listings right now.</p>}
        {profile.listings.map((listing) => (
          <div key={listing.id} className="flex gap-3 rounded-lg border border-brand-200 bg-white p-3 shadow-sm">
            {listing.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`${API_URL}${listing.imageUrl}`} alt={listing.title} className="h-16 w-16 shrink-0 rounded-md object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs text-brand-400">
                No photo
              </div>
            )}
            <div>
              <p className="font-heading font-semibold text-brand-800">{listing.title}</p>
              <p className="text-sm text-accent-600">
                ${listing.pricePerUnit}/{listing.unit}
              </p>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold text-brand-800">Reviews</h2>
          <div className="mt-3 space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-brand-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-brand-800">{r.buyer?.name}</p>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-1 text-sm text-brand-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function FarmerProfilePage() {
  const params = useParams<{ id: string }>();

  return (
    <AuthGuard>
      <main>
        <Navbar />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <FarmerProfileContent farmerId={params.id} />
        </section>
      </main>
    </AuthGuard>
  );
}
