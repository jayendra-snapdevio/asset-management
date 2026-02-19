import { prisma } from "~/lib/db.server";
import { generateQRCode } from "~/lib/qrcode.server";
import type { Prisma, AssetStatus } from "@prisma/client";
import { unlink } from "fs/promises";
import { join } from "path";

export interface AssetFilters {
  page: number;
  limit: number;
  search?: string;
  status?: AssetStatus;
  category?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  userId?: string; // Filter by user (assigned or created)
  ownerId?: string; // Filter by asset owner (PRIVATE ownership)
}

export interface AssetPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Helper to normalize company filter for Prisma
function normalizeCompanyFilter(
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
): Prisma.AssetWhereInput {
  const cid = companyFilter.companyId;

  // Check if it's an OWNER filter with { in: [...] }
  if (cid && typeof cid === "object" && "in" in cid) {
    return { companyId: cid };
  }

  // For single company (ADMIN/USER), if null then return empty (shouldn't happen for assets)
  return cid ? { companyId: cid as string } : {};
}

/**
 * Get assets with filtering and pagination
 */
export async function getAssets(
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
  filters: AssetFilters,
) {
  const {
    page,
    limit,
    search,
    status,
    category,
    sortBy = "createdAt",
    sortOrder = "desc",
    userId,
    ownerId,
  } = filters;

  const baseFilter = normalizeCompanyFilter(companyFilter);

  const where: Prisma.AssetWhereInput = {
    AND: [
      baseFilter,
      status ? { status } : { status: { not: "RETIRED" } },
      category ? { category } : {},
      ownerId ? { ownerId } : {},
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              {
                serialNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              { category: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
      userId
        ? {
            OR: [
              { assignments: { some: { userId, status: "ACTIVE" } } },
              { createdById: userId },
              { ownerId: userId },
            ],
          }
        : {},
    ],
  };

  // For categories, include all including retired
  const categoryWhere: Prisma.AssetWhereInput = { ...baseFilter };

  const [assets, total, categories] = await Promise.all([
    prisma.asset.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: {
          select: { name: true },
        },

        owner: {
          select: { firstName: true, lastName: true },
        },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          take: 1,
        },
      },
    }),
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where: categoryWhere,
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  return {
    assets,
    categories: categories.map((c) => c.category).filter(Boolean) as string[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    } as AssetPagination,
  };
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(
  assetId: string,
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
  checkAccessForUserId?: string, // Optional: restrict access to this user
) {
  const baseFilter = normalizeCompanyFilter(companyFilter);
  const where: Prisma.AssetWhereInput = {
    id: assetId,
    ...baseFilter,
  };

  if (checkAccessForUserId) {
    where.OR = [
      {
        assignments: {
          some: { userId: checkAccessForUserId, status: "ACTIVE" },
        },
      },
      { createdById: checkAccessForUserId },
      { ownerId: checkAccessForUserId },
    ];
  }

  return prisma.asset.findFirst({
    where,
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      company: {
        select: { id: true, name: true },
      },
      owner: {
        select: { id: true, firstName: true, lastName: true },
      },
      assignments: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });
}

/**
 * Create a new asset
 */
export async function createAsset(
  data: {
    name: string;
    description?: string;
    serialNumber?: string;
    model?: string;
    manufacturer?: string;
    purchaseDate?: Date;
    purchasePrice?: number;
    currentValue?: number;
    location?: string;
    category?: string;
    tags?: string[];
    imageUrl?: string;
    ownershipType?: any;
    ownerId?: string;
    otherOwnership?: string;
  },
  companyId: string,
  createdById: string,
) {
  // Create the asset
  try {
    const asset = await prisma.asset.create({
      data: {
        name: data.name,
        description: data.description || null,
        serialNumber: data.serialNumber || null,
        model: data.model || null,
        manufacturer: data.manufacturer || null,
        purchaseDate: data.purchaseDate || null,
        purchasePrice: data.purchasePrice || null,
        currentValue: data.currentValue || null,
        location: data.location || null,
        category: data.category || null,
        tags: data.tags || [],
        imageUrl: data.imageUrl || null,
        ownershipType: data.ownershipType || "COMPANY",
        ownerId: data.ownershipType === "PRIVATE" ? data.ownerId || null : null,
        otherOwnership:
          data.ownershipType === "OTHER" ? data.otherOwnership || null : null,
        status: "AVAILABLE",
        companyId,
        createdById,
      },
    });

    // Generate QR code
    try {
      const qrCode = await generateQRCode(asset.id);
      await prisma.asset.update({
        where: { id: asset.id },
        data: { qrCode },
      });
    } catch (error) {
      console.error("Failed to generate QR code for asset:", asset.id, error);
    }

    return { asset };
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("serialNumber")
    ) {
      return { error: "Asset with this serial number already exists" };
    }
    throw error;
  }
}

/**
 * Update an existing asset
 */
export async function updateAsset(
  assetId: string,
  data: {
    name?: string;
    description?: string;
    serialNumber?: string;
    model?: string;
    manufacturer?: string;
    purchaseDate?: Date;
    purchasePrice?: number;
    currentValue?: number;
    location?: string;
    status?: AssetStatus;
    category?: string;
    tags?: string[];
    imageUrl?: string;
    ownershipType?: any;
    ownerId?: string;
    otherOwnership?: string;
  },
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
) {
  const baseFilter = normalizeCompanyFilter(companyFilter);
  // Verify asset exists and belongs to the company
  const existingAsset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ...baseFilter,
    },
  });

  if (!existingAsset) {
    return { error: "Asset not found or unauthorized" };
  }

  // If changing status from ASSIGNED, check active assignments
  if (
    data.status &&
    data.status !== "ASSIGNED" &&
    existingAsset.status === "ASSIGNED"
  ) {
    const activeAssignment = await prisma.assignment.findFirst({
      where: { assetId, status: "ACTIVE" },
    });
    if (activeAssignment) {
      return {
        error:
          "Cannot change status of an assigned asset. Please return the asset first.",
      };
    }
  }

  try {
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.serialNumber !== undefined && {
          serialNumber: data.serialNumber || null,
        }),
        ...(data.model !== undefined && { model: data.model || null }),
        ...(data.manufacturer !== undefined && {
          manufacturer: data.manufacturer || null,
        }),
        ...(data.purchaseDate !== undefined && {
          purchaseDate: data.purchaseDate || null,
        }),
        ...(data.purchasePrice !== undefined && {
          purchasePrice: data.purchasePrice || null,
        }),
        ...(data.currentValue !== undefined && {
          currentValue: data.currentValue || null,
        }),
        ...(data.location !== undefined && { location: data.location || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.ownershipType !== undefined && {
          ownershipType: data.ownershipType,
        }),
        // If ownershipType is provided, clear irrelevant fields.
        // If not provided but ownerId/otherOwnership are, they will be updated as requested.
        ...(data.ownershipType !== undefined
          ? {
              ownerId:
                data.ownershipType === "PRIVATE" ? data.ownerId || null : null,
              otherOwnership:
                data.ownershipType === "OTHER"
                  ? data.otherOwnership || null
                  : null,
            }
          : {
              ...(data.ownerId !== undefined && {
                ownerId: data.ownerId || null,
              }),
              ...(data.otherOwnership !== undefined && {
                otherOwnership: data.otherOwnership || null,
              }),
            }),
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return { asset: updatedAsset };
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("serialNumber")
    ) {
      return { error: "Asset with this serial number already exists" };
    }
    throw error;
  }
}

/**
 * Delete an asset (sets status to RETIRED)
 */
export async function deleteAsset(
  assetId: string,
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
) {
  const baseFilter = normalizeCompanyFilter(companyFilter);
  // Verify asset exists and belongs to the company
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ...baseFilter,
    },
  });

  if (!asset) {
    return { error: "Asset not found or unauthorized" };
  }

  // Check for active assignments
  const activeAssignment = await prisma.assignment.findFirst({
    where: { assetId, status: "ACTIVE" },
  });

  if (activeAssignment) {
    return {
      error:
        "Cannot delete an asset that is currently assigned. Please return the asset first.",
    };
  }

  // Set status to RETIRED instead of soft delete
  await prisma.asset.update({
    where: { id: assetId },
    data: { status: "RETIRED" },
  });

  return { success: true };
}

/**
 * Restore a retired asset (sets status to AVAILABLE)
 */
export async function restoreAsset(
  assetId: string,
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
) {
  const baseFilter = normalizeCompanyFilter(companyFilter);
  // Verify asset exists and belongs to the company
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ...baseFilter,
      status: "RETIRED",
    },
  });

  if (!asset) {
    return { error: "Asset not found, unauthorized, or not retired" };
  }

  await prisma.asset.update({
    where: { id: assetId },
    data: { status: "AVAILABLE" },
  });

  return { success: true };
}

/**
 * Regenerate QR code for an asset
 */
export async function regenerateQRCode(
  assetId: string,
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
) {
  const baseFilter = normalizeCompanyFilter(companyFilter);
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ...baseFilter,
    },
  });

  if (!asset) {
    return { error: "Asset not found or unauthorized" };
  }

  const qrCode = await generateQRCode(assetId);
  await prisma.asset.update({
    where: { id: assetId },
    data: { qrCode },
  });

  return { qrCode };
}

/**
 * Delete asset image and unlink file
 */
export async function deleteAssetImage(
  assetId: string,
  companyFilter: { companyId: string | null } | { companyId: { in: string[] } },
) {
  const baseFilter = normalizeCompanyFilter(companyFilter);
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ...baseFilter,
    },
  });

  if (!asset?.imageUrl) {
    return { success: true };
  }

  try {
    const filePath = join(process.cwd(), "public", asset.imageUrl);
    await unlink(filePath);
  } catch (error) {
    console.error("Failed to unlink image:", error);
    // Continue anyway to clear it from DB
  }

  await prisma.asset.update({
    where: { id: assetId },
    data: { imageUrl: null },
  });

  return { success: true };
}
