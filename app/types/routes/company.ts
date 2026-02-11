import type { Role } from "@prisma/client";

export interface CompanyListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    users: number;
    assets: number;
  };
}

export interface CompanyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface CompanyDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  users: CompanyUser[];
  _count: {
    assets: number;
    users: number;
  };
}
