import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";
import { getVapidPublicKey } from "../services/push";

export const pushRouter = Router();

pushRouter.get("/vapid-public-key", (_req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

pushRouter.post("/subscribe", requireAuth, async (req, res) => {
  const body = subscribeSchema.parse(req.body);
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { userId: req.auth!.userId, p256dh: body.keys.p256dh, auth: body.keys.auth },
    create: {
      userId: req.auth!.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
  });
  res.status(204).send();
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

pushRouter.post("/unsubscribe", requireAuth, async (req, res) => {
  const body = unsubscribeSchema.parse(req.body);
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: req.auth!.userId } });
  res.status(204).send();
});
