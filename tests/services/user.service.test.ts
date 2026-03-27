import { describe, it, expect, vi } from "vitest";
import { prisma } from "~/lib/db.server";
import { 
  getUsers, 
  createUser, 
  toggleUserStatus 
} from "~/services/user.service.server";
import { createMockUser } from "../setup";

describe("User Service", () => {
  describe("getUsers", () => {
    it("should fetch users within company context", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([createMockUser({ id: "u1" })] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await getUsers(
        { id: "admin1", role: "ADMIN", companyId: "company1" },
        { page: 1, limit: 10 }
      );

      expect(result.users).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("createUser", () => {
    it("should hash password and create user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({ id: "new-user", email: "new@test.com" } as any);

      const result = await createUser(
        {
          email: "new@test.com",
          password: "password123",
          firstName: "New",
          lastName: "User"
        },
        { id: "admin1", role: "ADMIN", companyId: "company1" }
      );

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.user?.id).toBe("new-user");
    });
  });

  describe("toggleUserStatus", () => {
    it("should flip the isActive status", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "u1", isActive: true } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1", isActive: false } as any);

      const result = await toggleUserStatus(
        "u1",
        { id: "admin1", role: "ADMIN", companyId: "company1" }
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false })
        })
      );
      expect(result.user?.isActive).toBe(false);
    });
  });
});
