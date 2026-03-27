import { describe, it, expect, vi } from "vitest";
import { prisma } from "~/lib/db.server";
import { 
  getAssets, 
  getAssetById, 
  createAsset 
} from "~/services/asset.service.server";
import { createMockAsset } from "../setup";
import type { Asset } from "@prisma/client";

describe("Asset Service", () => {
  describe("getAssets", () => {
    it("should fetch assets with company filter", async () => {
      const mockAssets = [createMockAsset({ id: "1" }), createMockAsset({ id: "2" })] as Asset[];
      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets as any);
      vi.mocked(prisma.asset.count).mockResolvedValue(2);

      const result = await getAssets(
        { companyId: "company1" },
        { page: 1, limit: 10 }
      );

      expect(prisma.asset.findMany).toHaveBeenCalled();
      expect(result.assets).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe("getAssetById", () => {
    it("should fetch a single asset by ID", async () => {
      const mockAsset = createMockAsset({ id: "asset1" }) as Asset;
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset as any);

      const result = await getAssetById("asset1", { companyId: "company1" });

      expect(prisma.asset.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "asset1" })
        })
      );
      expect(result?.id).toBe("asset1");
    });
  });

  describe("createAsset", () => {
    it("should create a new asset and generate QR code", async () => {
      const mockAsset = createMockAsset({ id: "new-asset" }) as Asset;
      vi.mocked(prisma.asset.create).mockResolvedValue(mockAsset as any);
      vi.mocked(prisma.asset.update).mockResolvedValue(mockAsset as any);

      const result = await createAsset(
        {
          name: "New Asset",
          category: "LAPTOP",
          ownershipType: "COMPANY",
        },
        "company1",
        "user1"
      );

      expect(prisma.asset.create).toHaveBeenCalled();
      expect(prisma.asset.update).toHaveBeenCalled(); // For QR code
      expect(result.asset?.id).toBe("new-asset");
    });
  });
});
