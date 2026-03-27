import { describe, it, expect, vi } from "vitest";
import { prisma } from "~/lib/db.server";
import { 
  getCompaniesByOwner, 
  createCompany, 
  getCompanyFilter 
} from "~/services/company.service.server";

describe("Company Service", () => {
  describe("getCompaniesByOwner", () => {
    it("should fetch companies owned by a user", async () => {
      vi.mocked(prisma.company.findMany).mockResolvedValue([{ id: "c1", name: "Company 1" }] as any);
      vi.mocked(prisma.company.count).mockResolvedValue(1);

      const result = await getCompaniesByOwner("owner1", { page: 1, limit: 10 });

      expect(result.companies).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("createCompany", () => {
    it("should create a new company", async () => {
      const mockCompany = { id: "c1", name: "New Company" };
      vi.mocked(prisma.company.create).mockResolvedValue(mockCompany as any);

      const result = await createCompany({ name: "New Company" }, "owner1");

      expect(prisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "New Company", ownerId: "owner1" })
        })
      );
      expect(result.id).toBe("c1");
    });
  });

  describe("getCompanyFilter", () => {
    it("should return correct filter for OWNER role", async () => {
      vi.mocked(prisma.company.findMany).mockResolvedValue([{ id: "c1" }, { id: "c2" }] as any);

      const filter = await getCompanyFilter({
        role: "OWNER",
        id: "owner1",
        companyId: null
      });

      expect(filter).toEqual({ companyId: { in: ["c1", "c2"] } });
    });

    it("should return correct filter for ADMIN role", async () => {
      const filter = await getCompanyFilter({
        role: "ADMIN",
        id: "admin1",
        companyId: "c1"
      });

      expect(filter).toEqual({ companyId: "c1" });
    });
  });
});
