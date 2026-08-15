import webpush from "web-push";
import { prisma } from "../prisma";
import { env } from "../env";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return false;
  webpush.setVapidDetails("mailto:support@farmlink.ai", env.vapidPublicKey, env.vapidPrivateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  link?: string | null;
}

// Sends a browser push notification to every device the user has subscribed on.
// Silently no-ops if push isn't configured, and prunes subscriptions the browser
// has revoked (404/410) so we stop wasting sends on dead endpoints.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Push send failed", statusCode, err);
        }
      }
    })
  );
}

export function getVapidPublicKey(): string {
  return env.vapidPublicKey;
}
