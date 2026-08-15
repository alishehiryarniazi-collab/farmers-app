"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Stars } from "@/components/Stars";
import type { DeliveryStatus, Order, OrderStatus, Review } from "@/lib/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "text-accent-600",
  CONFIRMED: "text-blue-600",
  COMPLETED: "text-sage-600",
  CANCELLED: "text-red-600",
};

const DELIVERY_STAGES: { value: DeliveryStatus; label: string }[] = [
  { value: "NOT_PACKED", label: "Not packed" },
  { value: "PACKED", label: "Packed" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
];

function DeliveryStepper({ status }: { status: DeliveryStatus }) {
  const currentIndex = DELIVERY_STAGES.findIndex((s) => s.value === status);
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {DELIVERY_STAGES.map((stage, i) => (
        <div key={stage.value} className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              i <= currentIndex ? "bg-accent-100 text-accent-700" : "bg-brand-50 text-brand-400"
            }`}
          >
            {stage.label}
          </div>
          {i < DELIVERY_STAGES.length - 1 && <div className={`h-px w-3 ${i < currentIndex ? "bg-accent-300" : "bg-brand-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function ReviewForm({ order, onSubmitted }: { order: Order; onSubmitted: (review: Review) => void }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const review = await api.post<Review>("/api/reviews", { orderId: order.id, rating, comment }, token);
      onSubmitted(review);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-3">
      <p className="text-sm font-medium text-brand-700">Rate this order</p>
      <div className="mt-1">
        <Stars value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment..."
        rows={2}
        className="mt-2 w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm focus:border-accent-400 focus:outline-none"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="mt-2 rounded-md bg-accent-500 px-3 py-1 text-sm font-semibold text-brand-900 hover:bg-accent-400 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </div>
  );
}

function OrdersPageContent() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const isFarmer = user?.role === "FARMER";
  const endpoint = isFarmer ? "/api/orders/received" : "/api/orders/mine";

  useEffect(() => {
    api
      .get<Order[]>(endpoint, token)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [token, endpoint]);

  async function updateStatus(order: Order, status: OrderStatus) {
    const updated = await api.patch<Order>(`/api/orders/${order.id}`, { status }, token);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
  }

  async function markPaid(order: Order) {
    const updated = await api.patch<Order>(`/api/orders/${order.id}/payment`, { paymentStatus: "PAID" }, token);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, paymentStatus: updated.paymentStatus } : o)));
  }

  async function advanceDelivery(order: Order) {
    const currentIndex = DELIVERY_STAGES.findIndex((s) => s.value === order.deliveryStatus);
    const next = DELIVERY_STAGES[currentIndex + 1];
    if (!next) return;
    const updated = await api.patch<Order>(`/api/orders/${order.id}/delivery`, { deliveryStatus: next.value }, token);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, deliveryStatus: updated.deliveryStatus } : o)));
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">{isFarmer ? "Orders received" : "Your orders"}</h1>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-brand-600">Loading...</p>}
        {!loading && orders.length === 0 && <p className="text-brand-600">No orders yet.</p>}
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading font-semibold text-brand-800">{order.listing.title}</p>
                <p className="text-sm text-brand-600">
                  {order.quantity} {order.listing.unit} · ${order.totalPrice.toFixed(2)}
                </p>
                {isFarmer && order.buyer && (
                  <p className="text-xs text-brand-500">
                    Buyer: {order.buyer.name} ({order.buyer.email ?? order.buyer.phone})
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                <p className={`text-xs font-medium ${order.paymentStatus === "PAID" ? "text-sage-600" : "text-brand-400"}`}>
                  {order.paymentMethod} · {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                </p>
                <Link
                  href={`/orders/${order.id}/receipt`}
                  className="mt-1 block text-xs font-medium text-accent-600 hover:underline"
                >
                  View receipt
                </Link>
              </div>
            </div>

            {(order.status === "CONFIRMED" || order.status === "COMPLETED") && (
              <DeliveryStepper status={order.deliveryStatus} />
            )}

            {isFarmer && (order.status === "CONFIRMED" || order.status === "COMPLETED") && (
              <div className="mt-3 flex flex-wrap gap-2">
                {order.paymentStatus === "UNPAID" && (
                  <button
                    onClick={() => markPaid(order)}
                    className="rounded-md border border-sage-400 px-3 py-1 text-sm text-sage-700 hover:bg-sage-50"
                  >
                    Mark payment received
                  </button>
                )}
                {order.deliveryStatus !== "DELIVERED" && (
                  <button
                    onClick={() => advanceDelivery(order)}
                    className="rounded-md border border-brand-300 px-3 py-1 text-sm text-brand-700 hover:bg-brand-50"
                  >
                    Advance to{" "}
                    {DELIVERY_STAGES[DELIVERY_STAGES.findIndex((s) => s.value === order.deliveryStatus) + 1]?.label}
                  </button>
                )}
              </div>
            )}

            {isFarmer && order.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => updateStatus(order, "CONFIRMED")}
                  className="rounded-md bg-accent-500 px-3 py-1 text-sm font-semibold text-brand-900 hover:bg-accent-400"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateStatus(order, "CANCELLED")}
                  className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            )}
            {isFarmer && order.status === "CONFIRMED" && (
              <div className="mt-3">
                <button
                  onClick={() => updateStatus(order, "COMPLETED")}
                  className="rounded-md bg-accent-500 px-3 py-1 text-sm font-semibold text-brand-900 hover:bg-accent-400"
                >
                  Mark completed
                </button>
              </div>
            )}

            {!isFarmer && order.status === "COMPLETED" && (
              <>
                {order.review ? (
                  <div className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-3">
                    <Stars value={order.review.rating} />
                    {order.review.comment && <p className="mt-1 text-sm text-brand-700">{order.review.comment}</p>}
                  </div>
                ) : (
                  <ReviewForm
                    order={order}
                    onSubmitted={(review) =>
                      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, review } : o)))
                    }
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard>
      <main>
        <Navbar />
        <OrdersPageContent />
      </main>
    </AuthGuard>
  );
}
