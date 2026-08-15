import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/error";
import { notify } from "../services/notifications";
import { createOrder } from "../services/orders";

export const ordersRouter = Router();

const createOrderSchema = z.object({
  listingId: z.string(),
  quantity: z.number().positive(),
});

// Buyer places an order against a listing.
ordersRouter.post("/", requireAuth, requireRole("BUYER"), async (req, res) => {
  const body = createOrderSchema.parse(req.body);
  const order = await createOrder(req.auth!.userId, body.listingId, body.quantity);
  res.status(201).json(order.created);
});

// A buyer's own orders.
ordersRouter.get("/mine", requireAuth, requireRole("BUYER"), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.auth!.userId },
    include: { listing: true, review: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// Orders placed on a farmer's own listings.
ordersRouter.get("/received", requireAuth, requireRole("FARMER"), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { listing: { farmerId: req.auth!.userId } },
    include: { listing: true, buyer: { select: { id: true, name: true, phone: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// A single order — for receipt display. Viewable by either party to the order.
ordersRouter.get("/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      listing: { include: { farmer: { select: { id: true, name: true, phone: true, email: true } } } },
      buyer: { select: { id: true, name: true, phone: true, email: true } },
      review: true,
    },
  });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.buyerId !== req.auth!.userId && order.listing.farmerId !== req.auth!.userId) {
    throw new HttpError(403, "Not your order");
  }
  res.json(order);
});

const updateOrderSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]),
});

// Farmer updates the status of an order placed on their listing.
ordersRouter.patch("/:id", requireAuth, requireRole("FARMER"), async (req, res) => {
  const body = updateOrderSchema.parse(req.body);
  const existing = await prisma.order.findUnique({ where: { id: req.params.id }, include: { listing: true } });
  if (!existing) throw new HttpError(404, "Order not found");
  if (existing.listing.farmerId !== req.auth!.userId) throw new HttpError(403, "Not your order to manage");

  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: body.status } });

  await notify(
    order.buyerId,
    "ORDER_STATUS_CHANGED",
    `Order ${body.status.toLowerCase()}`,
    `Your order for ${existing.listing.title} is now ${body.status.toLowerCase()}.`,
    "/orders"
  );

  res.json(order);
});

// Farmer marks Cash-on-Delivery payment as received.
const updatePaymentSchema = z.object({ paymentStatus: z.enum(["PAID"]) });

ordersRouter.patch("/:id/payment", requireAuth, requireRole("FARMER"), async (req, res) => {
  const body = updatePaymentSchema.parse(req.body);
  const existing = await prisma.order.findUnique({ where: { id: req.params.id }, include: { listing: true } });
  if (!existing) throw new HttpError(404, "Order not found");
  if (existing.listing.farmerId !== req.auth!.userId) throw new HttpError(403, "Not your order to manage");

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { paymentStatus: body.paymentStatus },
  });

  await notify(
    order.buyerId,
    "ORDER_STATUS_CHANGED",
    "Payment confirmed",
    `Your payment for ${existing.listing.title} has been marked as received.`,
    "/orders"
  );

  res.json(order);
});

// Farmer updates the delivery stage of an order.
const updateDeliverySchema = z.object({
  deliveryStatus: z.enum(["PACKED", "OUT_FOR_DELIVERY", "DELIVERED"]),
});

ordersRouter.patch("/:id/delivery", requireAuth, requireRole("FARMER"), async (req, res) => {
  const body = updateDeliverySchema.parse(req.body);
  const existing = await prisma.order.findUnique({ where: { id: req.params.id }, include: { listing: true } });
  if (!existing) throw new HttpError(404, "Order not found");
  if (existing.listing.farmerId !== req.auth!.userId) throw new HttpError(403, "Not your order to manage");

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { deliveryStatus: body.deliveryStatus },
  });

  const label = body.deliveryStatus.replace(/_/g, " ").toLowerCase();
  await notify(
    order.buyerId,
    "ORDER_STATUS_CHANGED",
    "Delivery update",
    `Your order for ${existing.listing.title} is now ${label}.`,
    "/orders"
  );

  res.json(order);
});
