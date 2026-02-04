import { prisma } from "~/lib/db.server";
import type { AssignmentStatus, Prisma } from "@prisma/client";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssignmentFilters {
  status?: AssignmentStatus;
  assetId?: string;
  userId?: string;
}

interface CompanyFilter {
  companyId: string | { in: string[] } | null;
}

// Helper to normalize company filter for asset queries
function normalizeAssetCompanyFilter(
  companyFilter: CompanyFilter
): Prisma.AssetWhereInput {
  if (companyFilter.companyId && typeof companyFilter.companyId === "object" && "in" in companyFilter.companyId) {
    return { companyId: companyFilter.companyId as { in: string[] } };
  }
  const id = companyFilter.companyId as string | null;
  return id ? { companyId: id } : {};
}

// Helper to normalize company filter for user queries
function normalizeUserCompanyFilter(
  companyFilter: CompanyFilter
): Prisma.UserWhereInput {
  if (companyFilter.companyId && typeof companyFilter.companyId === "object" && "in" in companyFilter.companyId) {
    return { companyId: { in: companyFilter.companyId.in } };
  }
  const id = companyFilter.companyId as string | null;
  return id ? { companyId: id } : {};
}

/**
 * Get assignments with pagination and filters
 */
export async function getAssignments(
  companyFilter: CompanyFilter,
  { page, limit }: PaginationParams,
  filters: AssignmentFilters = {}
) {
  const where: any = {
    asset: companyFilter,
    ...(filters.status && { status: filters.status }),
    ...(filters.assetId && { assetId: filters.assetId }),
    ...(filters.userId && { userId: filters.userId }),
  };

  // Get assignments first
  const [rawAssignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        assignedDate: true,
        returnDate: true,
        notes: true,
        assetId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.assignment.count({ where }),
  ]);

  // Get unique user and asset IDs
  const userIds = [...new Set(rawAssignments.map(a => a.userId))];
  const assetIds = [...new Set(rawAssignments.map(a => a.assetId))];

  // Fetch users and assets
  const [users, assets] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, name: true, serialNumber: true, status: true, imageUrl: true },
    }),
  ]);

  const userMap = new Map(users.map(u => [u.id, u]));
  const assetMap = new Map(assets.map(a => [a.id, a]));

  // Filter assignments with valid user and asset, then map
  const assignments = rawAssignments
    .filter(a => userMap.has(a.userId) && assetMap.has(a.assetId))
    .map(a => ({
      ...a,
      user: userMap.get(a.userId)!,
      asset: assetMap.get(a.assetId)!,
    }));

  return {
    assignments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    } as PaginationResult,
  };
}

/**
 * Get a single assignment by ID
 */
export async function getAssignmentById(
  assignmentId: string,
  companyFilter: CompanyFilter
) {
  const assetFilter = normalizeAssetCompanyFilter(companyFilter);
  return prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      asset: assetFilter,
    },
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          status: true,
          imageUrl: true,
          category: true,
          location: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get available assets for assignment (status = AVAILABLE)
 */
export async function getAvailableAssets(companyFilter: CompanyFilter) {
  const assetFilter = normalizeAssetCompanyFilter(companyFilter);
  return prisma.asset.findMany({
    where: {
      ...assetFilter,
      status: "AVAILABLE",
    },
    select: {
      id: true,
      name: true,
      serialNumber: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get active users for assignment
 */
export async function getActiveUsers(companyFilter: CompanyFilter) {
  const userFilter = normalizeUserCompanyFilter(companyFilter);
  return prisma.user.findMany({
    where: {
      ...userFilter,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: { firstName: "asc" },
  });
}

/**
 * Validate asset for assignment
 */
export async function validateAssetForAssignment(
  assetId: string,
  companyFilter: CompanyFilter
) {
  const assetWhere = normalizeAssetCompanyFilter(companyFilter);
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ...assetWhere,
    },
  });

  if (!asset) {
    return { valid: false, error: "Asset not found" };
  }

  if (asset.status !== "AVAILABLE") {
    return { valid: false, error: "Asset is not available for assignment" };
  }

  return { valid: true, asset };
}

/**
 * Validate user for assignment
 */
export async function validateUserForAssignment(
  userId: string,
  companyFilter: CompanyFilter
) {
  const userWhere = normalizeUserCompanyFilter(companyFilter);
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      ...userWhere,
      isActive: true,
    },
  });

  if (!user) {
    return { valid: false, error: "User not found or inactive" };
  }

  return { valid: true, user };
}

/**
 * Create a new assignment
 */
export async function createAssignment(data: {
  assetId: string;
  userId: string;
  notes?: string;
  dueDate?: Date;
}) {
  // Use transaction to create assignment and update asset status
  const [assignment] = await prisma.$transaction([
    prisma.assignment.create({
      data: {
        assetId: data.assetId,
        userId: data.userId,
        status: "ACTIVE",
        notes: data.notes,
        dueDate: data.dueDate,
      },
      include: {
        asset: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.asset.update({
      where: { id: data.assetId },
      data: { status: "ASSIGNED" },
    }),
  ]);

  return assignment;
}

/**
 * Return an assignment
 */
export async function returnAssignment(
  assignmentId: string,
  notes?: string
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    return { error: "Assignment not found" };
  }

  if (assignment.status !== "ACTIVE") {
    return { error: "Assignment is not active" };
  }

  // Use transaction to update assignment and asset status
  await prisma.$transaction([
    prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: "RETURNED",
        returnDate: new Date(),
        notes: notes || assignment.notes,
      },
    }),
    prisma.asset.update({
      where: { id: assignment.assetId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return { success: true };
}

/**
 * Transfer an assignment to a new user
 */
export async function transferAssignment(
  assignmentId: string,
  newUserId: string,
  notes?: string
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    return { error: "Assignment not found" };
  }

  if (assignment.status !== "ACTIVE") {
    return { error: "Assignment is not active" };
  }

  if (newUserId === assignment.userId) {
    return { error: "Cannot transfer to the same user" };
  }

  // Use transaction to mark old assignment as transferred and create new one
  await prisma.$transaction([
    // Mark current assignment as transferred
    prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: "TRANSFERRED",
        returnDate: new Date(),
        notes: notes ? `${assignment.notes || ""}\nTransfer notes: ${notes}`.trim() : assignment.notes,
      },
    }),
    // Create new assignment for the new user
    prisma.assignment.create({
      data: {
        assetId: assignment.assetId,
        userId: newUserId,
        status: "ACTIVE",
        notes: `Transferred from previous user${notes ? `: ${notes}` : ""}`,
      },
    }),
  ]);

  return { success: true };
}

/**
 * Get assignment history for an asset
 */
export async function getAssetAssignmentHistory(assetId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      assignedDate: true,
      returnDate: true,
      notes: true,
      userId: true,
      createdAt: true,
    },
  });

  // Fetch valid users
  const userIds = [...new Set(assignments.map(a => a.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  // Filter and map assignments with valid users
  return assignments
    .filter(a => userMap.has(a.userId))
    .map(a => ({
      ...a,
      user: userMap.get(a.userId)!,
    }));
}

/**
 * Get assignments for a specific user
 */
export async function getUserAssignments(
  userId: string,
  status?: AssignmentStatus
) {
  return prisma.assignment.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          status: true,
          imageUrl: true,
          category: true,
        },
      },
    },
  });
}
