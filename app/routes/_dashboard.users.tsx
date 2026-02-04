import { useState } from "react";
import { data, redirect, Form, useSearchParams, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.users";
import { requireRole } from "~/lib/session.server";
import { handleError, errorResponse } from "~/lib/errors.server";
import { getUsers, createUser } from "~/services/user.service.server";
import { getCompaniesByOwner } from "~/services/company.service.server";
import { createUserSchema } from "~/validators/user.validator";
import { prisma } from "~/lib/db.server";
import type { Role } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import { Badge } from "~/components/ui/badge";
import {
  Users,
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Crown,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";

type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  companyId: string | null;
  company: { id: string; name: string } | null;
  _count: { assignments: number };
};

export function meta() {
  return [{ title: "Users - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const roleFilter = url.searchParams.get("role") as Role | undefined;
  const isActiveFilter = url.searchParams.get("isActive");
  const limit = 10;

  const { users, pagination } = await getUsers(user, {
    page,
    limit,
    search: search || undefined,
    role: roleFilter || undefined,
    isActive: isActiveFilter !== null ? isActiveFilter === "true" : undefined,
  });

  // For OWNER, get all their companies so they can assign users to them
  let companies: { id: string; name: string }[] = [];
  if (user.role === "OWNER") {
    const result = await getCompaniesByOwner(user.id, { page: 1, limit: 100, search: "" });
    companies = result.companies.map((c) => ({ id: c.id, name: c.name }));
  } else if (user.companyId) {
    // For ADMIN, just get their company
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, name: true },
    });
    if (company) {
      companies = [company];
    }
  }

  return { currentUser: user, users, pagination, search, roleFilter, isActiveFilter, companies };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  const result = createUserSchema.safeParse(rawData);
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors, error: undefined, success: false }, { status: 400 });
  }

  // Get companyId from form (for OWNER) or from user (for ADMIN)
  let companyId = user.companyId;
  
  if (user.role === "OWNER") {
    const selectedCompanyId = formData.get("companyId") as string;
    if (!selectedCompanyId) {
      return data(
        { error: "Please select a company for this user", errors: undefined, success: false },
        { status: 400 }
      );
    }
    // Verify the owner actually owns this company
    const company = await prisma.company.findFirst({
      where: { id: selectedCompanyId, ownerId: user.id },
    });
    if (!company) {
      return data(
        { error: "You don't have permission to add users to this company", errors: undefined, success: false },
        { status: 403 }
      );
    }
    companyId = selectedCompanyId;
  }

  if (!companyId) {
    return data(
      { error: "You must be associated with a company to create users", errors: undefined, success: false },
      { status: 400 }
    );
  }

  try {
    const createResult = await createUser(
      {
        email: result.data.email,
        password: result.data.password,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        role: result.data.role,
      },
      { ...user, companyId } // Pass the selected companyId
    );

    if (createResult.error) {
      return errorResponse(createResult.error);
    }

    return redirect(`/dashboard/users/${createResult.user!.id}`);
  } catch (error) {
    return handleError(error);
  }
}

export default function UsersPage({ loaderData, actionData }: Route.ComponentProps) {
  const { currentUser, users, pagination, search, roleFilter, isActiveFilter, companies } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>(
    companies.length === 1 ? companies[0].id : ""
  );
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const typedUsers = users as UserListItem[];

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <Badge variant="default" className="gap-1 bg-purple-600">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "USER":
        return (
          <Badge variant="secondary" className="gap-1">
            <User className="h-3 w-3" />
            User
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const hasFilters = search || roleFilter || isActiveFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage users in your organization
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <Form method="post" onSubmit={() => setIsDialogOpen(false)}>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" required />
                    {actionData && "errors" in actionData && actionData.errors?.firstName && (
                      <p className="text-sm text-destructive">{actionData.errors.firstName[0]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" required />
                    {actionData && "errors" in actionData && actionData.errors?.lastName && (
                      <p className="text-sm text-destructive">{actionData.errors.lastName[0]}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required />
                  {actionData && "errors" in actionData && actionData.errors?.email && (
                    <p className="text-sm text-destructive">{actionData.errors.email[0]}</p>
                  )}
                  {actionData && "error" in actionData && actionData.error && (
                    <p className="text-sm text-destructive">{actionData.error}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" name="password" type="password" required />
                  {actionData && "errors" in actionData && actionData.errors?.password && (
                    <p className="text-sm text-destructive">{actionData.errors.password[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="USER">
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      {currentUser.role === "OWNER" && (
                        <SelectItem value="OWNER">Owner</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Selector (for OWNER with multiple companies) */}
                {currentUser.role === "OWNER" && companies.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company *</Label>
                    <Select
                      value={selectedCompany}
                      onValueChange={setSelectedCompany}
                      name="companyId"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="companyId" value={selectedCompany} />
                  </div>
                )}
                {/* Hidden companyId for OWNER with single company */}
                {currentUser.role === "OWNER" && companies.length === 1 && (
                  <input type="hidden" name="companyId" value={companies[0].id} />
                )}

                {/* Hidden companyId for single company */}
                {(currentUser.role !== "OWNER" || companies.length === 1) && (
                  <input type="hidden" name="companyId" value={companies[0]?.id || ""} />
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
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
                  placeholder="Search by name or email..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) => handleFilterChange("role", value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={isActiveFilter || "all"}
              onValueChange={(value) => handleFilterChange("isActive", value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {typedUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {hasFilters ? "No users found" : "No users yet"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Add users to your organization to assign assets."}
            </p>
            {!hasFilters && (
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first user
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              {pagination.total} {pagination.total === 1 ? "user" : "users"} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Active Assets</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" />
                        {user._count.assignments}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/dashboard/users/${user.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
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
