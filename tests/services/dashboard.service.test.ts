import { describe, it, expect, vi } from "vitest";
import { prisma } from "~/lib/db.server";
import { getAdminDashboard } from "~/services/dashboard.service.server";
import type { Asset, Assignment, User } from "@prisma/client";

describe("Dashboard Service", () => {
  describe("getAdminDashboard", () => {
    it("should fetch dashboard stats and distributions", async () => {
      vi.mocked(prisma.asset.count).mockResolvedValue(10);
      vi.mocked(prisma.asset.groupBy).mockResolvedValue([
        { status: "AVAILABLE", _count: 6 },
        { status: "ASSIGNED", _count: 4 }
      ] as any);
      vi.mocked(prisma.asset.findMany).mockResolvedValue([] as Asset[] as any);
      vi.mocked(prisma.assignment.findMany).mockResolvedValue([] as Assignment[] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(5);

      const result = await getAdminDashboard({
        id: "admin1",
        role: "ADMIN",
        companyId: "company1"
      });

      expect(result.stats.totalAssets).toBe(10);
      expect(result.stats.availableAssets).toBe(6);
      expect(result.statusDistribution).toHaveLength(2);
    });
  });
});
