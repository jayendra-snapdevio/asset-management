import { data, Form, Link, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/_dashboard.assignments";
import { requireRole } from "~/lib/session.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { getAssignments, deleteAssignment } from "~/services/assignment.service.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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
import { Pagination } from "~/components/shared/Pagination";
import {
  ClipboardList,
  Plus,
  Eye,
  Search,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import type { AssignmentStatus } from "@prisma/client";
import { Input } from "~/components/ui/input";
import type { AssignmentListItem } from "~/types";

export function meta() {
  return [{ title: "Assignments - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN", "USER"]);
  const companyFilter = await getCompanyFilter(user);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as AssignmentStatus | null;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const { assignments, pagination } = await getAssignments(
    companyFilter,
    { page, limit },
    {
      status: status || undefined,
      userId: user.role === "USER" ? user.id : undefined,
    },
  );

  return {
    user, assignments, pagination,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const companyFilter = await getCompanyFilter(user);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const assignmentId = formData.get("assignmentId") as string;
    if (!assignmentId) {
      return data({ error: "Assignment ID is required", success: false }, { status: 400 });
    }

    try {
      const result = await deleteAssignment(assignmentId, companyFilter);
      if (result.error) {
        return data({ error: result.error, success: false }, { status: 400 });
      }
      return data({ success: true, message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Delete assignment error:", error);
      return data({ error: "Failed to delete assignment", success: false }, { status: 500 });
    }
  }

  return null;
}

function getStatusBadge(status: AssignmentStatus) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case "RETURNED":
      return <Badge variant="secondary">Returned</Badge>;
    case "TRANSFERRED":
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">Transferred</Badge>
      );
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

export default function AssignmentsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, assignments, pagination } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const typedAssignments = assignments as AssignmentListItem[];
  // ... existing state hooks ...
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "";
  const currentSearch = searchParams.get("search") || "";
  const canManageAssignments = user.role === "OWNER" || user.role === "ADMIN";

  // ... handlers ...
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
      {actionData && "error" in actionData && actionData.error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
          {actionData.error as string}
        </div>
      )}
      {actionData && "success" in actionData && actionData.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
          {"message" in actionData ? (actionData.message as string) : "Action completed successfully"}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage asset assignments</p>
        </div>
        <Link to={canManageAssignments ? "/dashboard/assignments/new" : "/dashboard/user/assignments/new"}>
          <Button className="w-full md:w-[180px]">
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
              <Select
                value={currentStatus || "all"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
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
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {currentSearch && (
                <Badge variant="secondary" className="gap-1">
                  Search: {currentSearch}
                  <button
                    onClick={clearSearch}
                    className="ml-1 hover:text-destructive"
                  >
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <Link
                          to={`/dashboard/assets/${assignment.asset.id}`}
                          className="font-medium hover:underline"
                        >
                          {assignment.asset.name}
                        </Link>
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
                      <div className="flex justify-start gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="View details">
                          <Link to={`/dashboard/assignments/${assignment.id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>

                        {canManageAssignments && (
                          <>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edit assignment">
                              <Link to={`/dashboard/assignments/${assignment.id}`}>
                                <Edit2 className="h-3 w-3" />
                              </Link>
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete assignment">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Assignment</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this assignment for {assignment.asset.name}?
                                    {assignment.status === "ACTIVE" && " This will return the asset status to AVAILABLE."}
                                    This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="mt-4">
                                  <Form method="post">
                                    <input type="hidden" name="intent" value="delete" />
                                    <input type="hidden" name="assignmentId" value={assignment.id} />
                                    <div className="flex gap-2 justify-end">
                                      <DialogTrigger asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                      </DialogTrigger>
                                      <Button type="submit" variant="destructive" disabled={isSubmitting}>
                                        {isSubmitting ? "Deleting..." : "Delete Assignment"}
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
                ))}
              </TableBody>
            </Table>

            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={(value) => {
                const params = new URLSearchParams(searchParams);
                params.set("limit", value);
                params.set("page", "1");
                setSearchParams(params);
              }}
              itemName="assignments"
              className="mt-4"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
