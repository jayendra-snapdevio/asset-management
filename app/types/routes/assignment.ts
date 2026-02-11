import type { AssignmentStatus, AssetStatus } from "@prisma/client";

export interface AssignmentListItem {
  id: string;
  status: AssignmentStatus;
  assignedDate: Date;
  returnDate: Date | null;
  notes: string | null;
  assetId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  asset: {
    id: string;
    name: string;
    serialNumber: string | null;
    status: AssetStatus;
    imageUrl: string | null;
  };
}

export interface AssignmentWithRelations extends AssignmentListItem {
  asset: {
    id: string;
    name: string;
    serialNumber: string | null;
    status: AssetStatus;
    imageUrl: string | null;
    category: string | null;
    location: string | null;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
