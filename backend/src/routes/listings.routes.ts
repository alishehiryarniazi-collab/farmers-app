import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/error";
import { upload } from "../upload";

export const listingsRouter = Router();

const SORT_OPTIONS = {
  newest: { createdAt: "desc" as const },
  price_asc: { pricePerUnit: "asc" as const },
  price_desc: { pricePerUnit: "desc" as const },
};

// Public browse/search — any logged-in user (buyer or farmer) can view active listings.
// Paginated (default 20/page, capped at 50) so the endpoint stays fast as listings grow.
listingsRouter.get("/", requireAuth, async (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
  const sort = typeof req.query.sort === "string" && req.query.sort in SORT_OPTIONS ? req.query.sort : "newest";
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

  const where = {
    status: "ACTIVE",
    isHidden: false,
    ...(category ? { category } : {}),
    ...(search ? { title: { contains: search } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { pricePerUnit: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {}),
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { farmer: { select: { id: true, name: true, phone: true, email: true } } },
      orderBy: SORT_OPTIONS[sort as keyof typeof SORT_OPTIONS],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({ listings, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

// Distinct categories currently listed — powers the marketplace filter dropdown.
listingsRouter.get("/categories", requireAuth, async (_req, res) => {
  const rows = await prisma.listing.findMany({
    where: { status: "ACTIVE", isHidden: false },
    select: { category: true },
    distinct: ["category"],
  });
  res.json(rows.map((r) => r.category).sort());
});

// A farmer's own inventory, including sold-out items.
listingsRouter.get("/mine", requireAuth, requireRole("FARMER"), async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { farmerId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
});

listingsRouter.get("/:id", requireAuth, async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { farmer: { select: { id: true, name: true, phone: true, email: true } } },
  });
  if (!listing) throw new HttpError(404, "Listing not found");
  res.json(listing);
});

// Numeric fields use z.coerce because multipart/form-data (used when a photo is attached)
// always sends field values as strings.
const createListingSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  pricePerUnit: z.coerce.number().positive(),
  quantityAvailable: z.coerce.number().positive(),
});

listingsRouter.post("/", requireAuth, requireRole("FARMER"), upload.single("image"), async (req, res) => {
  const body = createListingSchema.parse(req.body);
  const listing = await prisma.listing.create({
    data: {
      ...body,
      farmerId: req.auth!.userId,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    },
  });
  res.status(201).json(listing);
});

const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(["ACTIVE", "SOLD_OUT"]).optional(),
});

listingsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("FARMER"),
  upload.single("image"),
  async (req, res) => {
    const body = updateListingSchema.parse(req.body);
    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Listing not found");
    if (existing.farmerId !== req.auth!.userId) throw new HttpError(403, "Not your listing");

    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: { ...body, ...(req.file ? { imageUrl: `/uploads/${req.file.filename}` } : {}) },
    });
    res.json(listing);
  }
);

listingsRouter.delete("/:id", requireAuth, requireRole("FARMER"), async (req, res) => {
  const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Listing not found");
  if (existing.farmerId !== req.auth!.userId) throw new HttpError(403, "Not your listing");

  const orderCount = await prisma.order.count({ where: { listingId: req.params.id } });
  if (orderCount > 0) {
    throw new HttpError(
      409,
      "This listing has existing orders and can't be deleted. Mark it sold out instead to keep order history intact."
    );
  }

  await prisma.listing.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
