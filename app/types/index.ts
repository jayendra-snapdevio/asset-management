import type {
  User,
  Company,
  Asset,
  Assignment,
  Role,
  AssetStatus,
  AssignmentStatus,
} from "@prisma/client";

// Re-export Prisma types
export type {
  User,
  Company,
  Asset,
  Assignment,
  Role,
  AssetStatus,
  AssignmentStatus,
};

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

// Route-specific types
export * from "./routes";
export type { AssetDetail } from "./routes/asset";
