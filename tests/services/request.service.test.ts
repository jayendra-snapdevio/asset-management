import { describe, it, expect, vi } from "vitest";
import { prisma } from "~/lib/db.server";
import { 
  createAssetRequest, 
  getAssetRequests, 
  updateRequestStatus 
} from "~/services/request.service.server";
import type { AssetRequest, User } from "@prisma/client";

describe("Request Service", () => {
  describe("createAssetRequest", () => {
    it("should create a request with PENDING status", async () => {
      const mockRequest = { id: "r1", assetName: "MacBook", status: "PENDING" } as AssetRequest;
      vi.mocked(prisma.assetRequest.create).mockResolvedValue(mockRequest as any);

      const result = await createAssetRequest({
        userId: "user1",
        assetName: "MacBook",
        reason: "Work"
      });

      expect(prisma.assetRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PENDING" })
        })
      );
      expect(result.id).toBe("r1");
    });
  });

  describe("getAssetRequests", () => {
    it("should fetch requests with filters", async () => {
      const mockRequests = [
        { id: "r1", user: { firstName: "Test" } }
      ];
      vi.mocked(prisma.assetRequest.findMany).mockResolvedValue(mockRequests as any);

      const result = await getAssetRequests({ userId: "user1" });

      expect(prisma.assetRequest.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe("updateRequestStatus", () => {
    it("should update status and optional admin notes", async () => {
      vi.mocked(prisma.assetRequest.update).mockResolvedValue({ id: "r1", status: "APPROVED" } as any);

      const result = await updateRequestStatus("r1", "APPROVED", "Request granted");

      expect(prisma.assetRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "r1" },
          data: expect.objectContaining({ status: "APPROVED", adminNotes: "Request granted" })
        })
      );
      expect(result.status).toBe("APPROVED");
    });
  });
});
