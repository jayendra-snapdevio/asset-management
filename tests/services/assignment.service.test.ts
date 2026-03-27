import { describe, it, expect, vi } from "vitest";
import { prisma } from "~/lib/db.server";
import { 
  getAssignments, 
  createAssignment, 
  returnAssignment 
} from "~/services/assignment.service.server";

describe("Assignment Service", () => {
  describe("getAssignments", () => {
    it("should fetch assignments for a company", async () => {
      vi.mocked(prisma.assignment.findMany).mockResolvedValue([
        { id: "a1", userId: "u1", assetId: "as1", status: "ACTIVE" }
      ] as any);
      vi.mocked(prisma.assignment.count).mockResolvedValue(1);
      vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: "u1", firstName: "Test" }] as any);
      vi.mocked(prisma.asset.findMany).mockResolvedValue([{ id: "as1", name: "Asset 1" }] as any);

      const result = await getAssignments(
        { companyId: "company1" },
        { page: 1, limit: 10 }
      );

      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].user.firstName).toBe("Test");
    });
  });

  describe("createAssignment", () => {
    it("should create assignment and update asset status in transaction", async () => {
      const mockAssignment = { id: "a1", status: "ACTIVE" };
      vi.mocked(prisma.$transaction).mockResolvedValue([mockAssignment] as any);

      const result = await createAssignment({
        assetId: "asset1",
        userId: "user1",
        notes: "Test assignment"
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe("a1");
    });
  });

  describe("returnAssignment", () => {
    it("should mark assignment as returned", async () => {
      vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
        id: "a1",
        assetId: "as1",
        status: "ACTIVE"
      } as any);

      const result = await returnAssignment("a1", "Returning asset");

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
