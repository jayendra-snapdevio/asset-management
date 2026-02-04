import { data } from "react-router";
import type { Route } from "./+types/api.upload";
import { requireRole } from "~/lib/session.server";
import { uploadFile } from "~/lib/upload.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { prisma } from "~/lib/db.server";
import { unlink } from "fs/promises";
import { join } from "path";

/**
 * Resource route for handling asset image uploads
 * POST /api/upload - Upload an image for an asset
 */
export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["ADMIN", "OWNER"]);
  
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const assetId = formData.get("assetId") as string | null;

  if (!file || !assetId) {
    return data(
      { error: "File and assetId are required", success: false, imageUrl: null },
      { status: 400 }
    );
  }

  // Verify the asset exists and user has access
  const companyFilter = await getCompanyFilter(user);
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ...normalizeCompanyFilter(companyFilter),
    },
  });

  if (!asset) {
    return data(
      { error: "Asset not found or unauthorized", success: false, imageUrl: null },
      { status: 404 }
    );
  }

  // Delete old image if exists
  if (asset.imageUrl) {
    try {
      const oldPath = join(process.cwd(), "public", asset.imageUrl);
      await unlink(oldPath);
    } catch {
      // Ignore errors if file doesn't exist
    }
  }

  // Upload new file
  const result = await uploadFile(file, "assets");

  if (!result.success) {
    return data(
      { error: result.error || "Upload failed", success: false, imageUrl: null },
      { status: 400 }
    );
  }

  // Update asset with new image URL
  await prisma.asset.update({
    where: { id: assetId },
    data: { imageUrl: result.url },
  });

  return data({ success: true, imageUrl: result.url, error: null });
}

// Helper to normalize company filter for Prisma
function normalizeCompanyFilter(
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } }
): { companyId?: string | { in: string[] } } {
  const cid = companyFilter.companyId;
  
  // Check if it's an OWNER filter with { in: [...] }
  if (cid && typeof cid === "object" && "in" in cid) {
    return { companyId: cid };
  }
  
  // For single company (ADMIN/USER)
  return cid ? { companyId: cid as string } : {};
}
