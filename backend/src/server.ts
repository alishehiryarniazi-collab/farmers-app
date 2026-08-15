import { createServer } from "http";
import { createApp } from "./app";
import { attachSocket } from "./socket";
import { env } from "./env";
import { processDueRecurringOrders } from "./services/recurringOrders";

const app = createApp();
const httpServer = createServer(app);
attachSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Farmers app API listening on http://localhost:${env.port}`);
});

// Check for due recurring orders every hour.
const RECURRING_ORDER_INTERVAL_MS = 60 * 60 * 1000;
setInterval(() => {
  processDueRecurringOrders().catch((err) => console.error("processDueRecurringOrders failed", err));
}, RECURRING_ORDER_INTERVAL_MS);
