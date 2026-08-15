import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/error";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/stats", async (_req, res) => {
  const [
    totalUsers,
    totalFarmers,
    totalBuyers,
    suspendedUsers,
    totalListings,
    activeListings,
    hiddenListings,
    totalOrders,
    completedOrders,
    revenue,
    totalReviews,
    hiddenReviews,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
    prisma.user.count({ where: { role: "FARMER" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "ACTIVE", isHidden: false } }),
    prisma.listing.count({ where: { isHidden: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalPrice: true } }),
    prisma.review.count(),
    prisma.review.count({ where: { isHidden: true } }),
  ]);

  res.json({
    totalUsers,
    totalFarmers,
    totalBuyers,
    suspendedUsers,
    totalListings,
    activeListings,
    hiddenListings,
    totalOrders,
    completedOrders,
    totalRevenue: revenue._sum.totalPrice ?? 0,
    totalReviews,
    hiddenReviews,
  });
});

adminRouter.get("/users", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

  const where = {
    ...(role ? { role } : {}),
    ...(search
      ? { OR: [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }] }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        _count: { select: { listings: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

const suspendSchema = z.object({ isSuspended: z.boolean() });

adminRouter.patch("/users/:id", async (req, res) => {
  const body = suspendSchema.parse(req.body);
  if (req.params.id === req.auth!.userId) {
    throw new HttpError(400, "You can't suspend your own account");
  }
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "User not found");
  if (existing.role === "ADMIN") throw new HttpError(400, "Admin accounts can't be suspended here");

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isSuspended: body.isSuspended },
    select: { id: true, name: true, email: true, phone: true, role: true, isSuspended: true, createdAt: true },
  });
  res.json(user);
});

adminRouter.get("/listings", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

  const where = search ? { title: { contains: search } } : {};

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { farmer: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({ listings, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

const hideListingSchema = z.object({ isHidden: z.boolean() });

adminRouter.patch("/listings/:id", async (req, res) => {
  const body = hideListingSchema.parse(req.body);
  const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Listing not found");

  const listing = await prisma.listing.update({ where: { id: req.params.id }, data: { isHidden: body.isHidden } });
  res.json(listing);
});

adminRouter.get("/reviews", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
        farmer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count(),
  ]);

  res.json({ reviews, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

const hideReviewSchema = z.object({ isHidden: z.boolean() });

adminRouter.patch("/reviews/:id", async (req, res) => {
  const body = hideReviewSchema.parse(req.body);
  const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Review not found");

  const review = await prisma.review.update({ where: { id: req.params.id }, data: { isHidden: body.isHidden } });
  res.json(review);
});
