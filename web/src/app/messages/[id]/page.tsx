"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import type { Socket } from "socket.io-client";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import type { Message } from "@/lib/types";

function ConversationThread({ conversationId }: { conversationId: string }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<Message[]>(`/api/conversations/${conversationId}/messages`, token)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [conversationId, token]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("conversation:join", conversationId));
    socket.on("message:new", (message: Message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !socketRef.current) return;
    socketRef.current.emit("message:send", { conversationId, body: draft });
    setDraft("");
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border border-brand-200 bg-white shadow-sm">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loading && <p className="text-brand-600">Loading...</p>}
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-brand-800 text-white" : "bg-brand-50 text-brand-900"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-brand-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
        <button type="submit" className="rounded-md bg-accent-500 px-4 py-2 font-semibold text-brand-900 hover:bg-accent-400">
          Send
        </button>
      </form>
    </div>
  );
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();

  return (
    <AuthGuard>
      <main>
        <Navbar />
        <section className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold text-brand-800">Conversation</h1>
          <div className="mt-4">
            <ConversationThread conversationId={params.id} />
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
