import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthTokenPayload } from "../utils/jwt";
import { HttpError } from "./error";
import type { Role } from "../types";
import { prisma } from "../prisma";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or invalid Authorization header");
  }
  let payload: AuthTokenPayload;
  try {
    payload = verifyToken(header.slice("Bearer ".length));
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  // Checked on every request (not just at login) so a suspension takes effect immediately,
  // even for a user holding an already-issued token.
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isSuspended: true } });
  if (!user) throw new HttpError(401, "Invalid or expired token");
  if (user.isSuspended) throw new HttpError(403, "Your account has been suspended. Contact support for help.");

  req.auth = payload;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) {
      throw new HttpError(403, `Requires ${role} role`);
    }
    next();
  };
}
