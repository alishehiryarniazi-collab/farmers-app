import "express-async-errors";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { env } from "./env";
import { authRouter } from "./routes/auth.routes";
import { listingsRouter } from "./routes/listings.routes";
import { ordersRouter } from "./routes/orders.routes";
import { conversationsRouter } from "./routes/conversations.routes";
import { notificationsRouter } from "./routes/notifications.routes";
import { scannerRouter } from "./routes/scanner.routes";
import { guidelinesRouter } from "./routes/guidelines.routes";
import { farmersRouter } from "./routes/farmers.routes";
import { reviewsRouter } from "./routes/reviews.routes";
import { recurringOrdersRouter } from "./routes/recurringOrders.routes";
import { pushRouter } from "./routes/push.routes";
import { adminRouter } from "./routes/admin.routes";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { UPLOADS_DIR } from "./upload";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.use("/api/auth", authRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/scanner", scannerRouter);
  app.use("/api/guidelines", guidelinesRouter);
  app.use("/api/farmers", farmersRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/recurring-orders", recurringOrdersRouter);
  app.use("/api/push", pushRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);

  // zod validation errors -> 400 instead of falling through to the generic 500 handler
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.flatten() });
      return;
    }
    next(err);
  });

  app.use(errorHandler);

  return app;
}
