import { prisma } from "../prisma";
import { HttpError } from "../middleware/error";
import { notify } from "./notifications";
import { createOrder } from "./orders";

const FREQUENCY_DAYS: Record<string, number> = { WEEKLY: 7, MONTHLY: 30 };

export function nextOrderDateFrom(frequency: string, from: Date): Date {
  const days = FREQUENCY_DAYS[frequency] ?? 7;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

// Finds every recurring order that's due and places a real order for each.
// If a listing is unavailable (sold out, deactivated) the subscription is paused
// rather than retried forever, and the buyer is notified either way.
export async function processDueRecurringOrders(): Promise<{ processed: number; failed: number }> {
  const due = await prisma.recurringOrder.findMany({
    where: { active: true, nextOrderDate: { lte: new Date() } },
    include: { listing: true },
  });

  let processed = 0;
  let failed = 0;

  for (const sub of due) {
    try {
      const order = await createOrder(sub.buyerId, sub.listingId, sub.quantity);
      await prisma.recurringOrder.update({
        where: { id: sub.id },
        data: { lastOrderId: order.created.id, nextOrderDate: nextOrderDateFrom(sub.frequency, new Date()) },
      });
      processed++;
    } catch (err) {
      failed++;
      await prisma.recurringOrder.update({ where: { id: sub.id }, data: { active: false } });
      await notify(
        sub.buyerId,
        "ORDER_STATUS_CHANGED",
        "Recurring order paused",
        err instanceof HttpError
          ? `Couldn't place your recurring order for ${sub.listing.title}: ${err.message}. The subscription has been paused.`
          : `Couldn't place your recurring order for ${sub.listing.title}. The subscription has been paused.`,
        "/recurring-orders"
      );
    }
  }

  return { processed, failed };
}
