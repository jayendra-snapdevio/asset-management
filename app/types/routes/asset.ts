import type { AssetStatus, AssignmentStatus, OwnershipType } from "@prisma/client";

export interface AssetFilters {
  search?: string;
  status?: AssetStatus;
  category?: string;
  companyId?: string;
}

export interface AssetListItem {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  category: string | null;
  status: AssetStatus;
  ownershipType: OwnershipType;
  ownerId: string | null;
  otherOwnership: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  createdAt: Date;
  createdBy: { id: string; firstName: string; lastName: string; email: string } | null;
  owner: { id: string; firstName: string; lastName: string; email: string } | null;
  assignments: {
    id: string;
    status: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  }[];
}

export interface AssetDetail {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  category: string | null;
  status: AssetStatus;
  ownershipType: OwnershipType;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  currentValue: number | null;
  location: string | null;
  tags: string[];
  qrCode: string | null;
  imageUrl: string | null;
  ownerId: string | null;
  otherOwnership: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; firstName: string; lastName: string; email: string } | null;
  owner: { id: string; firstName: string; lastName: string; email: string } | null;
  company: { id: string; name: string } | null;
  assignments: {
    id: string;
    status: AssignmentStatus;
    assignedDate: Date;
    returnDate: Date | null;
    dueDate: Date | null;
    notes: string | null;
    user: { id: string; firstName: string; lastName: string; email: string };
  }[];
}
