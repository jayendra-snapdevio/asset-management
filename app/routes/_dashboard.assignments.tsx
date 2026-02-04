import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/_dashboard.assignments";
import { requireRole } from "~/lib/session.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { getAssignments } from "~/services/assignment.service.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
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
import { ClipboardList, Plus, Eye, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { AssignmentStatus } from "@prisma/client";
import { Input } from "~/components/ui/input";

export function meta() {
  return [{ title: "Assignments - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const companyFilter = await getCompanyFilter(user);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as AssignmentStatus | null;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 10;

  const { assignments, pagination } = await getAssignments(
    companyFilter,
    { page, limit },
    { status: status || undefined }
  );

  return { user, assignments, pagination };
}

function getStatusBadge(status: AssignmentStatus) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case "RETURNED":
      return <Badge variant="secondary">Returned</Badge>;
    case "TRANSFERRED":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Transferred</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AssignmentsPage({ loaderData }: Route.ComponentProps) {
  const { assignments, pagination } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "";
  const currentSearch = searchParams.get("search") || "";

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("page");
    setSearchParams(params);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage asset assignments</p>
        </div>
        <Link to="/dashboard/assignments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-1">
          <div className="flex flex-col sm:flex-row justify-evenly gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by asset name, serial number, or user..."
                  defaultValue={currentSearch}
                  className="pl-9 pr-9"
                />
                {currentSearch && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select value={currentStatus || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(currentSearch || currentStatus) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {currentSearch && (
                <Badge variant="secondary" className="gap-1">
                  Search: {currentSearch}
                  <button onClick={clearSearch} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentStatus && (
                <Badge variant="secondary" className="gap-1">
                  Status: {currentStatus}
                  <button 
                    onClick={() => handleStatusChange("all")} 
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No assignments found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {currentStatus
                ? "No assignments match the current filter."
                : "Assign assets to users to track who has what equipment."}
            </p>
            <Link to="/dashboard/assignments/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first assignment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Assignment List</CardTitle>
            <CardDescription>
              Showing {assignments.length} of {pagination.total} assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.asset.name}</div>
                        {assignment.asset.serialNumber && (
                          <div className="text-sm text-muted-foreground">
                            SN: {assignment.asset.serialNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>{formatDate(assignment.assignedDate)}</TableCell>
                    <TableCell>{formatDate(assignment.returnDate)}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/dashboard/assignments/${assignment.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
