import { prisma } from "~/lib/db.server";
import type { Prisma } from "@prisma/client";

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Get companies for an owner with pagination and search
 */
export async function getCompaniesByOwner(
  ownerId: string,
  { page, limit, search }: PaginationParams,
) {
  const where: Prisma.CompanyWhereInput = {
    ownerId,
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            assets: true,
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    } as PaginationResult,
  };
}

/**
 * Get a single company by ID, verifying ownership
 */
export async function getCompanyById(companyId: string, ownerId: string) {
  return prisma.company.findFirst({
    where: {
      id: companyId,
      ownerId,
      isActive: true,
    },
    include: {
      users: {
        where: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          assets: true,
          users: true,
        },
      },
    },
  });
}

/**
 * Create a new company
 */
export async function createCompany(
  data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
  },
  ownerId: string,
) {
  return prisma.company.create({
    data: {
      name: data.name,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      description: data.description || null,
      ownerId,
      isActive: true,
    },
  });
}

/**
 * Update a company (with ownership verification)
 */
export async function updateCompany(
  companyId: string,
  ownerId: string,
  data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
  },
) {
  // Verify ownership first
  const company = await prisma.company.findFirst({
    where: { id: companyId, ownerId },
  });

  if (!company) {
    return null;
  }

  return prisma.company.update({
    where: { id: companyId },
    data: {
      name: data.name ?? company.name,
      address: data.address ?? company.address,
      phone: data.phone ?? company.phone,
      email: data.email ?? company.email,
      website: data.website ?? company.website,
      description: data.description ?? company.description,
      updatedAt: new Date(),
    },
  });
}

/**
 * Soft delete a company (with ownership verification)
 */
export async function deleteCompany(companyId: string, ownerId: string) {
  // Verify ownership first
  const company = await prisma.company.findFirst({
    where: { id: companyId, ownerId },
  });

  if (!company) {
    return null;
  }

  // Soft delete: mark as inactive
  return prisma.company.update({
    where: { id: companyId },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get company filter based on user role
 * OWNER: all companies they own
 * ADMIN/USER: only their assigned company
 */
export async function getCompanyFilter(user: {
  role: string;
  id: string;
  companyId: string | null;
}) {
  if (user.role === "OWNER") {
    const companies = await prisma.company.findMany({
      where: { ownerId: user.id, isActive: true },
      select: { id: true },
    });
    return { companyId: { in: companies.map((c) => c.id) } };
  }

  // Admin/User: filter by their assigned company
  return { companyId: user.companyId };
}

/**
 * Add an admin to a company
 */
export async function addAdminToCompany(
  companyId: string,
  ownerId: string,
  userEmail: string,
) {
  // Verify ownership
  const company = await prisma.company.findFirst({
    where: { id: companyId, ownerId },
  });

  if (!company) {
    return { error: "Company not found or unauthorized" };
  }

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return { error: "User not found with that email" };
  }

  if (!user.isActive) {
    return { error: "User account is inactive" };
  }

  // Check if user belongs to another company
  if (user.companyId && user.companyId !== companyId) {
    return { error: "User already belongs to another company" };
  }

  // Check if user is already an admin in this company
  if (user.companyId === companyId && user.role === "ADMIN") {
    return { error: "User is already an admin of this company" };
  }

  // Check if user is already an owner
  if (user.role === "OWNER") {
    return { error: "Cannot add an Owner as an admin" };
  }

  // Add user to company as admin
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "ADMIN",
      companyId,
    },
  });

  return { user: updatedUser };
}

/**
 * Remove an admin from a company
 */
export async function removeAdminFromCompany(
  companyId: string,
  ownerId: string,
  userId: string,
) {
  // Verify ownership
  const company = await prisma.company.findFirst({
    where: { id: companyId, ownerId },
  });

  if (!company) {
    return { error: "Company not found or unauthorized" };
  }

  // Find the user
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) {
    return { error: "User not found in this company" };
  }

  // Demote to USER but keep in the same company
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: "USER",
    },
  });

  return { user: updatedUser };
}

/**
 * Get users available to add as admin (not in any company)
 */
export async function getAvailableUsers(search?: string) {
  return prisma.user.findMany({
    where: {
      companyId: null,
      role: "USER",
      isActive: true,
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    take: 10,
  });
}
