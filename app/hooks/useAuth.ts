import { useRouteLoaderData } from "react-router";
import type { Role } from "~/types";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyId: string | null;
}

interface DashboardLoaderData {
  user: AuthUser;
}

/**
 * Hook to access the current authenticated user from the dashboard layout loader.
 * Returns user data and role-checking utilities.
 */
export function useAuth() {
  // Get user from dashboard layout loader
  const data = useRouteLoaderData("routes/_dashboard") as DashboardLoaderData | undefined;
  const user = data?.user ?? null;

  return {
    user,
    isAuthenticated: !!user,
    hasRole: (roles: Role[]) => (user ? roles.includes(user.role) : false),
    isOwner: user?.role === "OWNER",
    isAdmin: user?.role === "ADMIN",
    isUser: user?.role === "USER",
  };
}
