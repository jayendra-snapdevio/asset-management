import { useState, useEffect } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.companies.$id.admins";
import { requireRole } from "~/lib/session.server";
import {
  getCompanyById,
  addAdminToCompany,
  removeAdminFromCompany,
  getAvailableUsers,
} from "~/services/company.service.server";
import { hashPassword } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/forms/form-field";
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
import { Badge } from "~/components/ui/badge";
import {
  Building2,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Shield,
  User,
  Mail,
  Search,
} from "lucide-react";
import { PasswordToggleField } from "~/components/forms/password-input";
import { SuccessMessage } from "~/components/ui/success-message";

type CompanyUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
};

type AvailableUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function meta({ data }: Route.MetaArgs) {
  const companyName = data?.company?.name || "Company";
  return [{ title: `Manage Admins - ${companyName} - Asset Management` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER"]);

  const company = await getCompanyById(params.id, user.id);

  if (!company) {
    throw redirect("/unauthorized");
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const availableUsers = await getAvailableUsers(search || undefined);

  return { user, company, availableUsers, search };
}

interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER"]);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (!params.id) {
    return data<ActionResponse>(
      { error: "Company ID is required", success: false },
      { status: 400 },
    );
  }

  if (intent === "add-admin") {
    const email = formData.get("email") as string;

    if (!email) {
      return data<ActionResponse>(
        { error: "Email is required", success: false },
        { status: 400 },
      );
    }

    const result = await addAdminToCompany(params.id, user.id, email);

    if (result.error) {
      return data<ActionResponse>(
        { error: result.error, success: false },
        { status: 400 },
      );
    }

    return data<ActionResponse>({
      success: true,
      message: "Admin added successfully",
    });
  }

  if (intent === "remove-admin") {
    const userId = formData.get("userId") as string;

    if (!userId) {
      return data<ActionResponse>(
        { error: "User ID is required", success: false },
        { status: 400 },
      );
    }

    const result = await removeAdminFromCompany(params.id, user.id, userId);

    if (result.error) {
      return data<ActionResponse>(
        { error: result.error, success: false },
        { status: 400 },
      );
    }

    return data<ActionResponse>({
      success: true,
      message: "Admin removed successfully",
    });
  }

  if (intent === "create-admin") {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    const errors: Record<string, string[]> = {};
    if (!email) errors.email = ["Email is required"];
    if (!password) {
      errors.password = ["Password is required"];
    } else if (password.length < 8) {
      errors.password = ["Password must be at least 8 characters"];
    }
    if (!firstName) errors.firstName = ["First name is required"];
    if (!lastName) errors.lastName = ["Last name is required"];

    if (Object.keys(errors).length > 0) {
      return data<ActionResponse>(
        { errors, success: false, error: "Please correct the errors below" },
        { status: 400 },
      );
    }

    // Verify the owner owns this company
    const company = await prisma.company.findFirst({
      where: { id: params.id, ownerId: user.id },
    });

    if (!company) {
      return data<ActionResponse>(
        { error: "Company not found or unauthorized", success: false },
        { status: 403 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return data<ActionResponse>(
        {
          error: "A user with this email already exists",
          success: false,
          errors: { email: ["This email is already taken"] },
        },
        { status: 400 },
      );
    }

    // Create the new admin user
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "ADMIN",
        companyId: params.id,
        isActive: true,
      },
    });

    return data<ActionResponse>({
      success: true,
      message: "New admin created successfully",
    });
  }

  return null;
}

export default function CompanyAdminsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { company, availableUsers, search } = loaderData;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Close create dialog and clear selection on succes
  useEffect(() => {
    if (actionData?.success) {
      setIsCreateDialogOpen(false);
      setSelectedEmail("");
    }
  }, [actionData]);

  const errors = actionData?.errors as Record<string, string[]> | undefined;
  const users = company.users as CompanyUser[];
  const admins = users.filter((u) => u.role === "ADMIN");
  const regularUsers = users.filter((u) => u.role === "USER");
  const typedAvailableUsers = availableUsers as AvailableUser[];

  const getRoleBadge = (role: string) => {
    switch (role) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link to={`/dashboard/companies/${company.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="truncate">{company.name}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Add or remove administrators for this company
          </p>
        </div>
      </div>

      {actionData && "success" in actionData && actionData.success && (
        <SuccessMessage
          message={
            "message" in actionData
              ? actionData.message
              : "Operation completed successfully!"
          }
        />
      )}
      {actionData && "error" in actionData && actionData.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {actionData.error}
        </div>
      )}

      {/* Add Admin Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Administrator
          </CardTitle>
          <CardDescription>
            Add a new administrator by their email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="add-admin" />
            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                label="User Email"
                name="email"
                type="email"
                placeholder="Enter user email address"
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                required
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || !selectedEmail}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Adding..." : "Add Admin"}
                </Button>
              </div>
            </div>
          </Form>

          {/* Available Users Suggestions */}
          {typedAvailableUsers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Available users (not assigned to any company):
              </p>
              <div className="flex flex-wrap gap-2">
                {typedAvailableUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEmail(user.email)}
                    className="text-xs"
                  >
                    {user.firstName} {user.lastName} ({user.email})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Admin Option */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              User doesn't exist yet?
            </p>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New Admin User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin</DialogTitle>
                  <DialogDescription>
                    Create a new user account with admin privileges for this
                    company.
                  </DialogDescription>
                </DialogHeader>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="create-admin" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="First Name"
                      name="firstName"
                      required
                      error={errors?.firstName}
                    />
                    <FormField
                      label="Last Name"
                      name="lastName"
                      required
                      error={errors?.lastName}
                    />
                  </div>
                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    required
                    error={errors?.email}
                  />
                  <PasswordToggleField
                    name="password"
                    label="Password"
                    errors={errors?.password}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Admin"}
                    </Button>
                  </DialogFooter>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Administrators ({admins.length})
          </CardTitle>
          <CardDescription>
            Users with admin privileges for this company
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No administrators yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.firstName} {admin.lastName}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{getRoleBadge(admin.role)}</TableCell>
                      <TableCell className="text-right">
                        <Form method="post" className="inline">
                          <input
                            type="hidden"
                            name="intent"
                            value="remove-admin"
                          />
                          <input type="hidden" name="userId" value={admin.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove Admin
                          </Button>
                        </Form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regular Users */}
      {regularUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Regular Users ({regularUsers.length})
            </CardTitle>
            <CardDescription>
              Users assigned to this company without admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-right">
                        <Form method="post" className="inline">
                          <input
                            type="hidden"
                            name="intent"
                            value="add-admin"
                          />
                          <input
                            type="hidden"
                            name="email"
                            value={user.email}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            disabled={isSubmitting}
                          >
                            <Shield className="h-4 w-4 mr-1 text-primary" />
                            Promote as Admin
                          </Button>
                        </Form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
