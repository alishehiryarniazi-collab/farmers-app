import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/error";
import { notify } from "../services/notifications";

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

reviewsRouter.post("/", requireAuth, requireRole("BUYER"), async (req, res) => {
  const body = createReviewSchema.parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
    include: { listing: true },
  });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.buyerId !== req.auth!.userId) throw new HttpError(403, "Not your order");
  if (order.status !== "COMPLETED") throw new HttpError(400, "You can only review completed orders");

  const existing = await prisma.review.findUnique({ where: { orderId: order.id } });
  if (existing) throw new HttpError(409, "You've already reviewed this order");

  const review = await prisma.review.create({
    data: {
      orderId: order.id,
      buyerId: req.auth!.userId,
      farmerId: order.listing.farmerId,
      rating: body.rating,
      comment: body.comment,
    },
  });

  await notify(
    order.listing.farmerId,
    "NEW_REVIEW",
    "New review received",
    `${"★".repeat(body.rating)}${"☆".repeat(5 - body.rating)} on ${order.listing.title}`,
    `/farmers/${order.listing.farmerId}`
  );

  res.status(201).json(review);
});
