import type { Role, AssetStatus, AssignmentStatus } from "@prisma/client";
import type { SelectOption } from "~/types";

// Role labels and options
export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  USER: "User",
};

export const ROLE_OPTIONS: SelectOption[] = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "USER", label: "User" },
];

// Asset status labels and options
export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  UNDER_MAINTENANCE: "Under Maintenance",
  RETIRED: "Retired",
};

export const ASSET_STATUS_OPTIONS: SelectOption[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "RETIRED", label: "Retired" },
];

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  UNDER_MAINTENANCE: "bg-yellow-100 text-yellow-800",
  RETIRED: "bg-gray-100 text-gray-800",
};

// Assignment status labels and options
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  ACTIVE: "Active",
  RETURNED: "Returned",
  TRANSFERRED: "Transferred",
};

export const ASSIGNMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "RETURNED", label: "Returned" },
  { value: "TRANSFERRED", label: "Transferred" },
];

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  RETURNED: "bg-gray-100 text-gray-800",
  TRANSFERRED: "bg-blue-100 text-blue-800",
};

// Common asset categories
export const ASSET_CATEGORIES: SelectOption[] = [
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "vehicles", label: "Vehicles" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software" },
  { value: "tools", label: "Tools" },
  { value: "other", label: "Other" },
];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date formats
export const DATE_FORMAT = "MMM dd, yyyy";
export const DATETIME_FORMAT = "MMM dd, yyyy HH:mm";

// Navigation items
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  roles?: Role[];
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Assets", href: "/dashboard/assets", icon: "Package", roles: ["OWNER", "ADMIN"] },
  { label: "Users", href: "/dashboard/users", icon: "Users", roles: ["OWNER", "ADMIN"] },
  { label: "Companies", href: "/dashboard/companies", icon: "Building2", roles: ["OWNER"] },
  { label: "Assignments", href: "/dashboard/assignments", icon: "ClipboardList", roles: ["OWNER", "ADMIN"] },
  { label: "My Assets", href: "/dashboard/my-assets", icon: "Laptop" },
  { label: "Profile", href: "/dashboard/profile", icon: "User" },
];
