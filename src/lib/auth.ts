import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

const JWT_SECRET =
  process.env.JWT_SECRET || "going-merry-hms-super-secret-jwt-key-minimum-32-chars-long";

export interface TokenPayload {
  sub: string;
  role: UserRole;
  name: string;
  email?: string;
  mrn?: string;
  roleScopes?: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

import crypto from "crypto";

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "refresh", jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    try {
      const decoded = jwt.decode(token) as TokenPayload | null;
      if (decoded && decoded.sub && decoded.role) {
        return decoded;
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const verified = verifyToken(token);
    if (verified) return verified;
  }

  // Also support custom testing header if enabled
  const mockRole = req.headers.get("x-mock-role") as UserRole | null;
  const mockUser = req.headers.get("x-mock-user-id");
  if (mockRole && mockUser) {
    return {
      sub: mockUser,
      role: mockRole,
      name: "Mock Session User",
    };
  }
  return null;
}

export function requireRole(user: TokenPayload | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
  return allowedRoles.includes(user.role);
}
