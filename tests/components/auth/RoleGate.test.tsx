import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoleGate } from "~/components/auth/RoleGate";
import * as useAuthModule from "~/hooks/useAuth";

vi.mock("~/hooks/useAuth");

describe("RoleGate Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children for allowed role", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: "1", role: "ADMIN" } as any,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes("ADMIN"),
      isOwner: false,
      isAdmin: true,
      isUser: false,
    });

    render(
      <RoleGate allowedRoles={["ADMIN"]}>
        <div data-testid="admin-content">Admin Content</div>
      </RoleGate>
    );

    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
  });

  it("should not render children for disallowed role", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: "1", role: "USER" } as any,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes("USER"),
      isOwner: false,
      isAdmin: false,
      isUser: true,
    });

    render(
      <RoleGate allowedRoles={["ADMIN"]}>
        <div data-testid="admin-content">Admin Content</div>
      </RoleGate>
    );

    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  it("should render fallback for disallowed role", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: "1", role: "USER" } as any,
      isAuthenticated: true,
      hasRole: () => false,
      isOwner: false,
      isAdmin: false,
      isUser: true,
    });

    render(
      <RoleGate
        allowedRoles={["ADMIN"]}
        fallback={<div data-testid="fallback">Access Denied</div>}
      >
        <div data-testid="admin-content">Admin Content</div>
      </RoleGate>
    );

    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("should allow multiple roles", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: "1", role: "OWNER" } as any,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes("OWNER"),
      isOwner: true,
      isAdmin: false,
      isUser: false,
    });

    render(
      <RoleGate allowedRoles={["ADMIN", "OWNER"]}>
        <div data-testid="content">Protected Content</div>
      </RoleGate>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });
});
