import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/error";

export const conversationsRouter = Router();

const participantSelect = { select: { id: true, name: true, role: true } } as const;

conversationsRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ farmerId: userId }, { buyerId: userId }] },
    include: {
      farmer: participantSelect,
      buyer: participantSelect,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(conversations);
});

// A buyer starts (or resumes) a conversation with the farmer behind a listing.
const startSchema = z.object({ listingId: z.string() });

conversationsRouter.post("/", requireAuth, requireRole("BUYER"), async (req, res) => {
  const body = startSchema.parse(req.body);
  const listing = await prisma.listing.findUnique({ where: { id: body.listingId } });
  if (!listing) throw new HttpError(404, "Listing not found");

  const conversation = await prisma.conversation.upsert({
    where: { farmerId_buyerId: { farmerId: listing.farmerId, buyerId: req.auth!.userId } },
    update: {},
    create: { farmerId: listing.farmerId, buyerId: req.auth!.userId, listingId: listing.id },
    include: { farmer: participantSelect, buyer: participantSelect },
  });
  res.status(201).json(conversation);
});

conversationsRouter.get("/:id/messages", requireAuth, async (req, res) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  if (conversation.farmerId !== req.auth!.userId && conversation.buyerId !== req.auth!.userId) {
    throw new HttpError(403, "Not a participant in this conversation");
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    include: { sender: participantSelect },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});
