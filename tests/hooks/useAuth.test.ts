import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "~/hooks/useAuth";
import * as reactRouter from "react-router";

vi.mock("react-router", () => ({
  useRouteLoaderData: vi.fn(),
}));

describe("useAuth Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user data when authenticated", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue({
      user: { id: "1", email: "test@test.com", role: "ADMIN" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it("should return null when not authenticated", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue(undefined);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should check role correctly with hasRole", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue({
      user: { id: "1", role: "ADMIN" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole(["ADMIN"])).toBe(true);
    expect(result.current.hasRole(["OWNER"])).toBe(false);
    expect(result.current.hasRole(["ADMIN", "OWNER"])).toBe(true);
  });

  it("should identify OWNER role correctly", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue({
      user: { id: "1", role: "OWNER" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isOwner).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isUser).toBe(false);
  });

  it("should identify USER role correctly", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue({
      user: { id: "1", role: "USER" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isUser).toBe(true);
  });

  it("should return false for hasRole when not authenticated", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue(undefined);

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole(["ADMIN", "OWNER", "USER"])).toBe(false);
  });
});
