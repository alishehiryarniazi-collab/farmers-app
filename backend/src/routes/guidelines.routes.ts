import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError } from "../middleware/error";

export const guidelinesRouter = Router();

guidelinesRouter.get("/", requireAuth, async (_req, res) => {
  const guidelines = await prisma.guideline.findMany({ orderBy: [{ category: "asc" }, { createdAt: "asc" }] });
  res.json(guidelines);
});

const guidelineSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  body: z.string().min(1),
});

guidelinesRouter.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const body = guidelineSchema.parse(req.body);
  const guideline = await prisma.guideline.create({ data: body });
  res.status(201).json(guideline);
});

guidelinesRouter.patch("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const body = guidelineSchema.partial().parse(req.body);
  const existing = await prisma.guideline.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Guideline not found");
  const guideline = await prisma.guideline.update({ where: { id: req.params.id }, data: body });
  res.json(guideline);
});

guidelinesRouter.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const existing = await prisma.guideline.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Guideline not found");
  await prisma.guideline.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
