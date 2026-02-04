import type { ReactNode } from "react";
import type { Role } from "~/types";
import { useAuth } from "~/hooks/useAuth";

interface RoleGateProps {
  /**
   * Roles that are allowed to see the children content
   */
  allowedRoles: Role[];
  /**
   * Content to render if user has the required role
   */
  children: ReactNode;
  /**
   * Optional fallback content to render if user doesn't have the required role
   */
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user role.
 * If the user's role is in allowedRoles, children are rendered.
 * Otherwise, fallback is rendered (defaults to null).
 *
 * @example
 * <RoleGate allowedRoles={["OWNER", "ADMIN"]}>
 *   <Button>Admin Only Action</Button>
 * </RoleGate>
 */
export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { hasRole } = useAuth();

  if (hasRole(allowedRoles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
