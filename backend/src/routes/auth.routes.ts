import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { toRole } from "../types";

export const authRouter = Router();

const registerSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    password: z.string().min(6),
    role: z.enum(["FARMER", "BUYER"]),
  })
  .refine((data) => data.email || data.phone, {
    message: "Provide an email or a phone number",
  });

authRouter.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [body.email ? { email: body.email } : {}, body.phone ? { phone: body.phone } : {}],
    },
  });
  if (existing) throw new HttpError(409, "An account with this email or phone already exists");

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
      role: body.role,
    },
  });

  const token = signToken({ userId: user.id, role: toRole(user.role) });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
});

const loginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: body.identifier }, { phone: body.identifier }] },
  });
  if (!user) throw new HttpError(401, "Invalid credentials");

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid credentials");

  if (user.isSuspended) throw new HttpError(403, "Your account has been suspended. Contact support for help.");

  const token = signToken({ userId: user.id, role: toRole(user.role) });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth!.userId } });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    bio: user.bio,
  });
});

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const body = updateMeSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.auth!.userId }, data: body });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    bio: user.bio,
  });
});
