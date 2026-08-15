"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Conversation } from "@/lib/types";

function MessagesPageContent() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Conversation[]>("/api/conversations", token)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Messages</h1>

      <div className="mt-6 space-y-2">
        {loading && <p className="text-brand-600">Loading...</p>}
        {!loading && conversations.length === 0 && (
          <p className="text-brand-600">No conversations yet — message a farmer from a listing to start one.</p>
        )}
        {conversations.map((c) => {
          const other = c.farmerId === user?.id ? c.buyer : c.farmer;
          const last = c.messages?.[0];
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="block rounded-lg border border-brand-200 bg-white p-4 shadow-sm transition-colors hover:border-accent-300"
            >
              <p className="font-heading font-semibold text-brand-800">
                {other.name} <span className="font-normal text-brand-500">({other.role})</span>
              </p>
              <p className="mt-1 truncate text-sm text-brand-600">{last ? last.body : "No messages yet"}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <main>
        <Navbar />
        <MessagesPageContent />
      </main>
    </AuthGuard>
  );
}
