"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { disablePush, enablePush, getExistingSubscription, isPushSupported } from "@/lib/push";
import type { Notification } from "@/lib/types";

export function NotificationBell() {
  const { token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    if (!token) return;
    api.get<Notification[]>("/api/notifications", token).then(setNotifications);

    const socket = connectSocket(token);
    socketRef.current = socket;
    socket.on("notification:new", (n: Notification) => setNotifications((prev) => [n, ...prev]));

    getExistingSubscription()
      .then((sub) => setPushEnabled(!!sub))
      .catch(() => setPushEnabled(false));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  async function togglePush() {
    setPushBusy(true);
    setPushError(null);
    try {
      if (pushEnabled) {
        await disablePush(token);
        setPushEnabled(false);
      } else {
        const ok = await enablePush(token);
        setPushEnabled(ok);
        if (!ok) setPushError("Couldn't enable notifications — check your browser's notification permission.");
      }
    } catch {
      setPushError("Couldn't enable notifications in this browser.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleOpen() {
    setOpen((prev) => !prev);
  }

  async function handleClick(n: Notification) {
    if (!n.readAt) {
      const updated = await api.post<Notification>(`/api/notifications/${n.id}/read`, {}, token);
      setNotifications((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative rounded p-1.5 text-white hover:bg-white/10" aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded border border-brand-200 bg-white shadow-lg">
          {isPushSupported() && (
            <div className="border-b border-brand-100">
              <button
                onClick={togglePush}
                disabled={pushBusy}
                className="w-full px-3 py-2 text-left text-xs font-medium text-accent-600 hover:bg-brand-50 disabled:opacity-50"
              >
                {pushEnabled ? "Disable" : "Enable"} browser notifications (works when the app is closed)
              </button>
              {pushError && <p className="px-3 pb-2 text-xs text-red-600">{pushError}</p>}
            </div>
          )}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && <p className="p-4 text-sm text-brand-600">No notifications yet.</p>}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`block w-full border-b border-brand-100 p-3 text-left text-sm hover:bg-brand-50 ${
                  n.readAt ? "text-brand-600" : "font-medium text-brand-900"
                }`}
              >
                <p>{n.title}</p>
                <p className="mt-0.5 truncate text-xs text-brand-500">{n.body}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
