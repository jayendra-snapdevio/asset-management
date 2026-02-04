import { createCookie, redirect } from "react-router";
import { getUserFromToken, verifyToken, type JWTPayload } from "./auth.server";
import type { User, Role } from "@prisma/client";

// Session cookie configuration
const sessionCookie = createCookie("__session", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secrets: [process.env.SESSION_SECRET || "fallback-session-secret"],
});

/**
 * Get the session token from the request
 */
export async function getSession(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionCookie.parse(cookieHeader);
  return session?.token || null;
}

/**
 * Create a session cookie with the token
 */
export async function createSession(token: string): Promise<string> {
  return sessionCookie.serialize({ token });
}

/**
 * Destroy the session cookie
 */
export async function destroySession(): Promise<string> {
  return sessionCookie.serialize(null, { maxAge: 0 });
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser(request: Request): Promise<User | null> {
  const token = await getSession(request);
  if (!token) return null;

  return getUserFromToken(token);
}

/**
 * Get the JWT payload from the session
 * Faster than getCurrentUser as it doesn't query the database
 */
export async function getSessionPayload(
  request: Request
): Promise<JWTPayload | null> {
  const token = await getSession(request);
  if (!token) return null;

  return verifyToken(token);
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(request: Request): Promise<User> {
  const user = await getCurrentUser(request);

  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  return user;
}

/**
 * Require specific roles - throws 403 if user doesn't have required role
 */
export async function requireRole(
  request: Request,
  roles: Role[]
): Promise<User> {
  const user = await requireAuth(request);

  if (!roles.includes(user.role)) {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}

/**
 * Require minimum role level
 */
export async function requireMinimumRole(
  request: Request,
  minimumRole: Role
): Promise<User> {
  const roleHierarchy: Record<Role, number> = {
    USER: 1,
    ADMIN: 2,
    OWNER: 3,
  };

  const user = await requireAuth(request);

  if (roleHierarchy[user.role] < roleHierarchy[minimumRole]) {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}

/**
 * Check if user is authenticated without throwing
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user !== null;
}
