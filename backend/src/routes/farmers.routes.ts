import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../middleware/error";

export const farmersRouter = Router();

farmersRouter.get("/:id", requireAuth, async (req, res) => {
  const farmer = await prisma.user.findFirst({
    where: { id: req.params.id, role: "FARMER" },
    select: { id: true, name: true, bio: true, createdAt: true },
  });
  if (!farmer) throw new HttpError(404, "Farmer not found");

  const [listings, ratingAgg] = await Promise.all([
    prisma.listing.findMany({
      where: { farmerId: farmer.id, status: "ACTIVE", isHidden: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.aggregate({
      where: { farmerId: farmer.id, isHidden: false },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  res.json({
    ...farmer,
    listings,
    avgRating: ratingAgg._avg.rating,
    reviewCount: ratingAgg._count,
  });
});

farmersRouter.get("/:id/reviews", requireAuth, async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { farmerId: req.params.id, isHidden: false },
    include: { buyer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
});
