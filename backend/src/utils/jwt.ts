import jwt from "jsonwebtoken";
import { env } from "../env";
import type { Role } from "../types";

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
