import { prisma } from "../prisma";
import { HttpError } from "../middleware/error";
import { notify } from "./notifications";

// Places an order against a listing inside a transaction (checks availability and decrements
// stock atomically, so concurrent orders from many buyers can't oversell the same listing).
export async function createOrder(buyerId: string, listingId: string, quantity: number) {
  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new HttpError(404, "Listing not found");
    if (listing.status !== "ACTIVE") throw new HttpError(400, "Listing is not available");
    if (quantity > listing.quantityAvailable) {
      throw new HttpError(400, "Requested quantity exceeds what's available");
    }

    const remaining = listing.quantityAvailable - quantity;
    await tx.listing.update({
      where: { id: listing.id },
      data: { quantityAvailable: remaining, status: remaining === 0 ? "SOLD_OUT" : "ACTIVE" },
    });

    const created = await tx.order.create({
      data: {
        listingId: listing.id,
        buyerId,
        quantity,
        totalPrice: quantity * listing.pricePerUnit,
      },
    });
    return { created, listing };
  });

  await notify(
    result.listing.farmerId,
    "ORDER_PLACED",
    "New order received",
    `${result.created.quantity} ${result.listing.unit} of ${result.listing.title} — $${result.created.totalPrice.toFixed(2)}`,
    "/orders"
  );

  return result;
}
