"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { Order } from "@/lib/types";

function ReceiptContent({ orderId }: { orderId: string }) {
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Order>(`/api/orders/${orderId}`, token)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [orderId, token]);

  if (loading) return <p className="text-brand-600">Loading...</p>;
  if (error || !order) return <p className="text-red-600">{error ?? "Order not found"}</p>;

  const date = new Date(order.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg border border-brand-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
      <div className="flex items-start justify-between border-b border-brand-200 pb-4">
        <div>
          <p className="font-heading text-xl font-bold text-brand-800">FarmLink.AI</p>
          <p className="text-sm text-brand-500">Order receipt</p>
        </div>
        <div className="text-right text-sm text-brand-600">
          <p>Order #{order.id.slice(-8).toUpperCase()}</p>
          <p>{date}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">Sold by</p>
          <p className="mt-1 font-medium text-brand-800">{order.listing.farmer?.name}</p>
          <p className="text-sm text-brand-500">{order.listing.farmer?.email ?? order.listing.farmer?.phone}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">Bought by</p>
          <p className="mt-1 font-medium text-brand-800">{order.buyer?.name}</p>
          <p className="text-sm text-brand-500">{order.buyer?.email ?? order.buyer?.phone}</p>
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-brand-200 text-left text-brand-500">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 font-medium">Quantity</th>
            <th className="pb-2 text-right font-medium">Unit price</th>
            <th className="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-brand-100">
            <td className="py-3 text-brand-800">{order.listing.title}</td>
            <td className="py-3 text-brand-700">
              {order.quantity} {order.listing.unit}
            </td>
            <td className="py-3 text-right text-brand-700">${order.listing.pricePerUnit.toFixed(2)}</td>
            <td className="py-3 text-right font-medium text-brand-800">${order.totalPrice.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-48">
          <div className="flex justify-between border-t border-brand-200 pt-2 font-heading font-bold text-brand-800">
            <span>Total</span>
            <span>${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-1 text-sm text-brand-500">
        <p>
          Order status: <span className="font-medium text-brand-700">{order.status}</span>
        </p>
        <p>
          Payment ({order.paymentMethod}):{" "}
          <span className="font-medium text-brand-700">{order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</span>
        </p>
        <p>
          Delivery: <span className="font-medium text-brand-700">{order.deliveryStatus.replace(/_/g, " ")}</span>
        </p>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-8 rounded-md bg-accent-500 px-4 py-2 font-semibold text-brand-900 hover:bg-accent-400 print:hidden"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();

  return (
    <AuthGuard>
      <main>
        <div className="print:hidden">
          <Navbar />
        </div>
        <section className="mx-auto max-w-2xl px-4 py-10">
          <ReceiptContent orderId={params.id} />
        </section>
      </main>
    </AuthGuard>
  );
}
