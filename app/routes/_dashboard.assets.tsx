import { useState } from "react";
import { data, Form, Link, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/_dashboard.assets";
// Server-only imports moved to loader/action to avoid Vite leakage
import type { AssetStatus } from "@prisma/client";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Pagination } from "~/components/shared/Pagination";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import {
  Package,
  Plus,
  Search,
  Eye,
  ArrowUpDown,
  User,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_CATEGORIES, OWNERSHIP_TYPE_LABELS } from "~/constants";
import { format } from "date-fns";
import type { AssetListItem } from "~/types";

export function meta() {
  return [{ title: "Assets - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireRole } = await import("../lib/session.server");
  const { getCompanyFilter } = await import("../services/company.service.server");
  const { getAssets } = await import("../services/asset.service.server");
  const { getUsers } = await import("../services/user.service.server");

  const user = await requireRole(request, ["OWNER", "ADMIN", "USER"]);
  const companyFilter = await getCompanyFilter(user);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") as AssetStatus | undefined;
  const category = url.searchParams.get("category") || undefined;
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = (url.searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const ownerId = url.searchParams.get("ownerId") || undefined;

  const { assets, categories, pagination } = await getAssets(companyFilter, {
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    category,
    sortBy,
    sortOrder,
    ownerId,
    userId: user.role === "USER" ? user.id : undefined,
  });

  // Fetch potential owners for the filter (only for admins/owners)
  let potentialOwners: any[] = [];
  if (user.role === "ADMIN" || user.role === "OWNER") {
    const { users } = await getUsers(user, {
      page: 1,
      limit: 100, // Reasonable limit for dropdown
      isActive: true,
    });
    potentialOwners = users;
  }

  return {
    user,
    assets,
    categories,
    pagination,
    potentialOwners,
    filters: { search, status, category, sortBy, sortOrder, ownerId },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireRole } = await import("../lib/session.server");
  const { getCompanyFilter } = await import("../services/company.service.server");
  const { deleteAsset } = await import("../services/asset.service.server");

  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const companyFilter = await getCompanyFilter(user);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const assetId = formData.get("assetId") as string;
    if (!assetId) {
      return data({ error: "Asset ID is required", success: false }, { status: 400 });
    }
    
    try {
      const result = await deleteAsset(assetId, companyFilter);
      if (result.error) {
        return data({ error: result.error, success: false }, { status: 400 });
      }
      return data({ success: true, message: "Asset retired successfully" });
    } catch (error) {
      console.error("Delete asset error:", error);
      return data({ error: "Failed to delete asset", success: false }, { status: 500 });
    }
  }

  return null;
}

export default function AssetsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, assets, categories, pagination, filters, potentialOwners } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageAssets = user.role === "OWNER" || user.role === "ADMIN";

  const typedAssets = assets as unknown as AssetListItem[];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    const params = new URLSearchParams(searchParams);
    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const toggleSort = (column: string) => {
    const params = new URLSearchParams(searchParams);
    if (filters.sortBy === column) {
      params.set("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", column);
      params.set("sortOrder", "asc");
    }
    setSearchParams(params);
  };

  const getStatusBadge = (status: AssetStatus) => {
    return (
      <Badge className={ASSET_STATUS_COLORS[status]} variant="secondary">
        {ASSET_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const hasFilters = filters.search || filters.status || filters.category || filters.ownerId;

  const [ownerSearch, setOwnerSearch] = useState("");

  const filteredOwners = potentialOwners.filter((owner: any) =>
    `${owner.firstName} ${owner.lastName}`.toLowerCase().includes(ownerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {actionData && "error" in actionData && actionData.error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && actionData.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
          {"message" in actionData ? actionData.message : "Action completed successfully"}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">
            Manage your organization's assets
          </p>
        </div>
        <Link to={canManageAssets ? "/dashboard/assets/new" : "/dashboard/user/assets/new"}>
          <Button className="w-full md:w-[180px]">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-1">
          <div className="flex flex-wrap gap-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by name or serial number..."
                  defaultValue={filters.search}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            {/* Status Select */}
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="md:w-[180px] w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Select */}
            <Select
              value={filters.category || "all"}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger className="md:w-[180px] w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                {ASSET_CATEGORIES.filter(
                  (c) => !categories.includes(c.value)
                ).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Owner Filter (Admin/Owner only) */}
            {canManageAssets && potentialOwners.length > 0 && (
              <Select
                value={filters.ownerId || "all"}
                onValueChange={(value) => handleFilterChange("ownerId", value)}
              >
                <SelectTrigger className="md:w-[180px] w-full">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-2 sticky top-0 bg-popover z-10 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search owners..."
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        className="h-8 pl-7 text-xs"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <SelectItem value="all">All Owners</SelectItem>
                  {filteredOwners.length === 0 ? (
                    <p className="p-2 text-xs text-center text-muted-foreground">
                      No owners found
                    </p>
                  ) : (
                    filteredOwners.map((owner: any) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.firstName} {owner.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}

            {hasFilters && (
              <Button variant="ghost" size="sm" className="md:w-[180px] w-full" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      {typedAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No assets found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {hasFilters
                ? "Try adjusting your filters to find assets."
                : "Start by adding your first asset to track and manage."}
            </p>
            {!hasFilters && canManageAssets && (
              <Link to="/dashboard/assets/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first asset
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort("name")}
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort("createdAt")}
                    >
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedAssets.map((asset) => {
                  const activeAssignment = asset.assignments[0];
                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/dashboard/assets/${asset.id}`}
                          className="hover:underline"
                        >
                          {asset.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {asset.serialNumber || "—"}
                      </TableCell>
                      <TableCell>
                        {asset.category ? (
                          <Badge variant="outline">{asset.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {asset.ownershipType ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-800 w-fit cursor-help">
                                  {OWNERSHIP_TYPE_LABELS[asset.ownershipType as keyof typeof OWNERSHIP_TYPE_LABELS] || asset.ownershipType}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {asset.ownershipType === "PRIVATE" && asset.owner && (
                                  <span>Owner: {asset.owner.firstName} {asset.owner.lastName}</span>
                                )}
                                {asset.ownershipType === "OTHER" && asset.otherOwnership && (
                                  <span>Details: {asset.otherOwnership}</span>
                                )}
                                {asset.ownershipType === "COMPANY" && (
                                  <span>Company Owned Asset</span>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        {activeAssignment ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {activeAssignment.user.firstName}{" "}
                              {activeAssignment.user.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(asset.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-start gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="View details">
                            <Link to={`/dashboard/assets/${asset.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          
                          {canManageAssets && (
                            <>
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edit asset">
                                <Link to={`/dashboard/assets/${asset.id}`}>
                                  <Edit2 className="h-3 w-3" />
                                </Link>
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete asset">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Asset</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to retire {asset.name}? This will set its status to RETIRED. 
                                      {asset.status === "ASSIGNED" && " Note: This asset is currently assigned."}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="mt-4">
                                    <Form method="post">
                                      <input type="hidden" name="intent" value="delete" />
                                      <input type="hidden" name="assetId" value={asset.id} />
                                      <div className="flex gap-2 justify-end">
                                        <DialogTrigger asChild>
                                          <Button type="button" variant="outline">Cancel</Button>
                                        </DialogTrigger>
                                        <Button type="submit" variant="destructive" disabled={isSubmitting}>
                                          {isSubmitting ? "Deleting..." : "Delete Asset"}
                                        </Button>
                                      </div>
                                    </Form>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>

          <Pagination
            pagination={pagination}
            onPageChange={goToPage}
            onLimitChange={(value) => handleFilterChange("limit", value)}
            itemName="assets"
          />
        </Card>
      )}
    </div>
  );
}
