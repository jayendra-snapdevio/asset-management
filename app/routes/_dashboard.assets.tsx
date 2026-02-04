import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/_dashboard.assets";
import { requireRole } from "~/lib/session.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { getAssets } from "~/services/asset.service.server";
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
import { Badge } from "~/components/ui/badge";
import {
  Package,
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  User,
} from "lucide-react";
import { ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_CATEGORIES } from "~/constants";
import { format } from "date-fns";

type AssetListItem = {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  category: string | null;
  status: AssetStatus;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  createdAt: Date;
  createdBy: { id: string; firstName: string; lastName: string; email: string } | null;
  assignments: {
    id: string;
    status: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  }[];
};

export function meta() {
  return [{ title: "Assets - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN", "USER"]);
  const companyFilter = await getCompanyFilter(user);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") as AssetStatus | undefined;
  const category = url.searchParams.get("category") || undefined;
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = (url.searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const limit = 10;

  const { assets, categories, pagination } = await getAssets(companyFilter, {
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    category,
    sortBy,
    sortOrder,
  });

  return {
    user,
    assets,
    categories,
    pagination,
    filters: { search, status, category, sortBy, sortOrder },
  };
}

export default function AssetsPage({ loaderData }: Route.ComponentProps) {
  const { user, assets, categories, pagination, filters } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageAssets = user.role === "OWNER" || user.role === "ADMIN";

  const typedAssets = assets as AssetListItem[];

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

  const hasFilters = filters.search || filters.status || filters.category;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">
            Manage your organization's assets
          </p>
        </div>
        {canManageAssets && (
          <Link to="/dashboard/assets/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-1">
          <div className="flex flex-wrap gap-4">
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

            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-[180px]">
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

            <Select
              value={filters.category || "all"}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger className="w-[180px]">
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

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
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
          <CardContent className="p-0">
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
                  <TableHead className="text-right">Actions</TableHead>
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
                        <Link to={`/dashboard/assets/${asset.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} assets
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
