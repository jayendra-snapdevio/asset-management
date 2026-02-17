import { prisma } from "~/lib/db.server";
import { hashPassword } from "~/lib/auth.server";
import type { Prisma, Role } from "@prisma/client";
import { getCompanyFilter } from "./company.service.server";

export interface UserPaginationParams {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Get users with pagination and filtering based on user's company access
 */
export async function getUsers(
  currentUser: { id: string; role: string; companyId: string | null },
  { page, limit, search, role, isActive }: UserPaginationParams
) {
  const companyFilter = await getCompanyFilter(currentUser);

  const where: Prisma.UserWhereInput = {
    ...companyFilter,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        companyId: true,
        company: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            assignments: { where: { status: "ACTIVE" } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    } as PaginationResult,
  };
}

/**
 * Get a single user by ID with company access verification
 */
export async function getUserById(
  userId: string,
  currentUser: { id: string; role: string; companyId: string | null }
) {
  const companyFilter = await getCompanyFilter(currentUser);

  return prisma.user.findFirst({
    where: {
      id: userId,
      ...companyFilter,
    },
    include: {
      company: {
        select: { id: true, name: true },
      },
      assignments: {
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
              status: true,
              category: true,
              ownershipType: true,
              owner: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { assignedDate: "desc" },
      },
      ownedAssets: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          status: true,
          category: true,
          ownershipType: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Create a new user
 */
export async function createUser(
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
  },
  currentUser: { id: string; role: string; companyId: string | null }
) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { error: "Email already exists" };
  }

  // Admin cannot create OWNER role
  if (currentUser.role === "ADMIN" && data.role === "OWNER") {
    return { error: "Admins cannot create owner accounts" };
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || "USER",
      companyId: currentUser.companyId,
      isActive: true,
    },
  });

  return { user };
}

/**
 * Update a user
 */
export async function updateUser(
  userId: string,
  currentUser: { id: string; role: string; companyId: string | null },
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: Role;
  }
) {
  const companyFilter = await getCompanyFilter(currentUser);

  // Verify access
  const user = await prisma.user.findFirst({
    where: { id: userId, ...companyFilter },
  });

  if (!user) {
    return { error: "User not found or unauthorized" };
  }

  // Check email uniqueness if changing
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return { error: "Email already exists" };
    }
  }

  // Admin cannot promote to OWNER
  if (currentUser.role === "ADMIN" && data.role === "OWNER") {
    return { error: "Admins cannot create owner accounts" };
  }

  // Cannot change own role
  if (userId === currentUser.id && data.role && data.role !== user.role) {
    return { error: "Cannot change your own role" };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      email: data.email ?? user.email,
      firstName: data.firstName ?? user.firstName,
      lastName: data.lastName ?? user.lastName,
      role: data.role ?? user.role,
      updatedAt: new Date(),
    },
  });

  return { user: updatedUser };
}

// delete users

export async function deleteUser(userId: string, currentUser: { id: string; role: string; companyId: string | null }) {
  const companyFilter = await getCompanyFilter(currentUser);

  // Verify access
  const user = await prisma.user.findFirst({
    where: { id: userId, ...companyFilter },
  });

  if (!user) {
    return { error: "User not found or unauthorized" };
  }

  // Cannot delete yourself
  if (userId === currentUser.id) {
    return { error: "Cannot delete your own account" };
  }

  // Cannot delete an OWNER (only another OWNER can)
  if (user.role === "OWNER" && currentUser.role !== "OWNER") {
    return { error: "Only owners can delete owner accounts" };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(
  userId: string,
  currentUser: { id: string; role: string; companyId: string | null }
) {
  const companyFilter = await getCompanyFilter(currentUser);

  // Verify access
  const user = await prisma.user.findFirst({
    where: { id: userId, ...companyFilter },
  });

  if (!user) {
    return { error: "User not found or unauthorized" };
  }

  // Cannot deactivate yourself
  if (userId === currentUser.id) {
    return { error: "Cannot deactivate your own account" };
  }

  // Cannot deactivate an OWNER (only another OWNER can)
  if (user.role === "OWNER" && currentUser.role !== "OWNER") {
    return { error: "Only owners can deactivate owner accounts" };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: !user.isActive,
      updatedAt: new Date(),
    },
  });

  return { user: updatedUser };
}

/**
 * Reset user password (admin function)
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string,
  currentUser: { id: string; role: string; companyId: string | null }
) {
  const companyFilter = await getCompanyFilter(currentUser);

  // Verify access
  const user = await prisma.user.findFirst({
    where: { id: userId, ...companyFilter },
  });

  if (!user) {
    return { error: "User not found or unauthorized" };
  }

  // Cannot reset OWNER password unless you're an OWNER
  if (user.role === "OWNER" && currentUser.role !== "OWNER") {
    return { error: "Only owners can reset owner passwords" };
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Get available companies for user assignment (OWNER only)
 */
export async function getAvailableCompanies(ownerId: string) {
  return prisma.company.findMany({
    where: {
      ownerId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Assign user to a company (OWNER only)
 */
export async function assignUserToCompany(
  userId: string,
  companyId: string | null,
  ownerId: string
) {
  // If assigning to a company, verify ownership
  if (companyId) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, ownerId },
    });

    if (!company) {
      return { error: "Company not found or unauthorized" };
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      companyId,
      updatedAt: new Date(),
    },
  });

  return { user };
}
