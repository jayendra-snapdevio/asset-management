import type { User, Company, Asset, Assignment, Role, AssetStatus, AssignmentStatus } from "@prisma/client";

// Re-export Prisma types
export type { User, Company, Asset, Assignment, Role, AssetStatus, AssignmentStatus };

// User with relations
export type UserWithCompany = User & {
  company: Company | null;
};

export type UserWithAssignments = User & {
  assignments: (Assignment & {
    asset: Asset;
  })[];
};

// Asset with relations
export type AssetWithRelations = Asset & {
  company: Company;
  createdBy: User;
  assignments: Assignment[];
};

export type AssetWithCurrentAssignment = Asset & {
  company: Company;
  createdBy: User;
  assignments: (Assignment & {
    user: User;
  })[];
};

// Assignment with relations
export type AssignmentWithRelations = Assignment & {
  asset: Asset;
  user: User;
};

// Dashboard stats
export interface DashboardStats {
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  underMaintenance: number;
  totalUsers: number;
  totalCompanies: number;
  recentAssignments: AssignmentWithRelations[];
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search/Filter params
export interface AssetFilters {
  search?: string;
  status?: AssetStatus;
  category?: string;
  companyId?: string;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  companyId?: string;
  isActive?: boolean;
}

// Form action results
export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

// Select options
export interface SelectOption {
  value: string;
  label: string;
}
