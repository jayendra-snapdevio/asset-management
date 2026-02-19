import * as jose from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db.server";
import type { User, Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
);

const SESSION_EXPIRY = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  companyId: string | null;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token for a user
 */
export async function createToken(user: User): Promise<string> {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };

  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get user from token payload
 */
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { company: true },
  });

  if (!user || !user.isActive) return null;

  return user;
}

/**
 * Generate a random reset token
 */
export function generateResetToken(): string {
  return crypto.randomUUID();
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user has minimum role level
 * OWNER > ADMIN > USER
 */
export function hasMinimumRole(userRole: Role, minimumRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    USER: 1,
    ADMIN: 2,
    OWNER: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}
