import { prisma } from "../prisma";
import { getIo } from "../socket";
import { sendPushToUser } from "./push";

export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_STATUS_CHANGED"
  | "NEW_MESSAGE"
  | "SCAN_COMPLETE"
  | "NEW_REVIEW";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });
  getIo()?.to(`user:${userId}`).emit("notification:new", notification);

  // Fire-and-forget: push delivery shouldn't slow down or fail the caller's request.
  sendPushToUser(userId, { title, body, link }).catch((err) => console.error("sendPushToUser failed", err));

  return notification;
}
