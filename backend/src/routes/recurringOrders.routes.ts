import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/error";
import { nextOrderDateFrom, processDueRecurringOrders } from "../services/recurringOrders";

export const recurringOrdersRouter = Router();

const createSchema = z.object({
  listingId: z.string(),
  quantity: z.number().positive(),
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
});

// Buyer sets up a repeat order for a listing (e.g. "5kg of tomatoes every week").
recurringOrdersRouter.post("/", requireAuth, requireRole("BUYER"), async (req, res) => {
  const body = createSchema.parse(req.body);
  const listing = await prisma.listing.findUnique({ where: { id: body.listingId } });
  if (!listing) throw new HttpError(404, "Listing not found");

  const sub = await prisma.recurringOrder.create({
    data: {
      buyerId: req.auth!.userId,
      listingId: body.listingId,
      quantity: body.quantity,
      frequency: body.frequency,
      nextOrderDate: nextOrderDateFrom(body.frequency, new Date()),
    },
    include: { listing: true },
  });
  res.status(201).json(sub);
});

recurringOrdersRouter.get("/mine", requireAuth, requireRole("BUYER"), async (req, res) => {
  const subs = await prisma.recurringOrder.findMany({
    where: { buyerId: req.auth!.userId },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(subs);
});

const updateSchema = z.object({ active: z.boolean() });

recurringOrdersRouter.patch("/:id", requireAuth, requireRole("BUYER"), async (req, res) => {
  const body = updateSchema.parse(req.body);
  const existing = await prisma.recurringOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Recurring order not found");
  if (existing.buyerId !== req.auth!.userId) throw new HttpError(403, "Not your subscription");

  const sub = await prisma.recurringOrder.update({
    where: { id: req.params.id },
    data: {
      active: body.active,
      // Resuming a paused subscription schedules its next order starting from now,
      // rather than immediately firing for however long it was paused.
      ...(body.active ? { nextOrderDate: nextOrderDateFrom(existing.frequency, new Date()) } : {}),
    },
  });
  res.json(sub);
});

recurringOrdersRouter.delete("/:id", requireAuth, requireRole("BUYER"), async (req, res) => {
  const existing = await prisma.recurringOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Recurring order not found");
  if (existing.buyerId !== req.auth!.userId) throw new HttpError(403, "Not your subscription");

  await prisma.recurringOrder.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Also runs automatically on a schedule (see server.ts) — exposed here so it can be
// triggered on demand too (e.g. for testing, or a future admin panel).
recurringOrdersRouter.post("/process-due", requireAuth, async (_req, res) => {
  const result = await processDueRecurringOrders();
  res.json(result);
});
