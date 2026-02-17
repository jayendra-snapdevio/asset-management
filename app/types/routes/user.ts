import type { Role, AssignmentStatus, AssetStatus } from "@prisma/client";

export interface UserFilters {
  search?: string;
  role?: Role;
  companyId?: string;
  isActive?: boolean;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  companyId: string | null;
  company: { id: string; name: string } | null;
  _count: { assignments: number };
}

export interface UserAssignment {
  id: string;
  assignedDate: Date;
  returnDate: Date | null;
  status: AssignmentStatus;
  notes: string | null;
  asset: {
    id: string;
    name: string;
    serialNumber: string | null;
    category: string | null;
    ownershipType: string | null;
    owner: { firstName: string; lastName: string } | null;
  };
}

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  companyId: string | null;
  company: { id: string; name: string } | null;
  assignments: UserAssignment[];
  ownedAssets: {
    id: string;
    name: string;
    serialNumber: string | null;
    status: AssetStatus;
    category: string | null;
    ownershipType: string | null;
  }[];
}
