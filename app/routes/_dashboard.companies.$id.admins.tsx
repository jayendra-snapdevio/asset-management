import { useState } from "react";
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

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER"]);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (!params.id) {
    return data({ error: "Company ID is required", success: false }, { status: 400 });
  }

  if (intent === "add-admin") {
    const email = formData.get("email") as string;

    if (!email) {
      return data({ error: "Email is required", success: false }, { status: 400 });
    }

    const result = await addAdminToCompany(params.id, user.id, email);

    if (result.error) {
      return data({ error: result.error, success: false }, { status: 400 });
    }

    return data({ success: true, message: "Admin added successfully" });
  }

  if (intent === "remove-admin") {
    const userId = formData.get("userId") as string;

    if (!userId) {
      return data({ error: "User ID is required", success: false }, { status: 400 });
    }

    const result = await removeAdminFromCompany(params.id, user.id, userId);

    if (result.error) {
      return data({ error: result.error, success: false }, { status: 400 });
    }

    return data({ success: true, message: "Admin removed successfully" });
  }

  if (intent === "create-admin") {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    if (!email || !password || !firstName || !lastName) {
      return data({ error: "All fields are required", success: false }, { status: 400 });
    }

    if (password.length < 8) {
      return data({ error: "Password must be at least 8 characters", success: false }, { status: 400 });
    }

    // Verify the owner owns this company
    const company = await prisma.company.findFirst({
      where: { id: params.id, ownerId: user.id },
    });

    if (!company) {
      return data({ error: "Company not found or unauthorized", success: false }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return data({ error: "A user with this email already exists", success: false }, { status: 400 });
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

    return data({ success: true, message: "New admin created successfully" });
  }

  return null;
}

export default function CompanyAdminsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { company, availableUsers, search } = loaderData;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/dashboard/companies/${company.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Company
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {company.name} - Manage Admins
          </h1>
          <p className="text-muted-foreground">
            Add or remove administrators for this company
          </p>
        </div>
      </div>

      {actionData && "success" in actionData && actionData.success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {"message" in actionData ? actionData.message : "Operation completed successfully!"}
        </div>
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
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  User Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter user email address"
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting || !selectedEmail}>
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    Create a new user account with admin privileges for this company.
                  </DialogDescription>
                </DialogHeader>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="create-admin" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-firstName">First Name *</Label>
                      <Input id="create-firstName" name="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-lastName">Last Name *</Label>
                      <Input id="create-lastName" name="lastName" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email *</Label>
                    <Input id="create-email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-password">Password *</Label>
                    <Input id="create-password" name="password" type="password" required minLength={8} />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
                        <input type="hidden" name="intent" value="remove-admin" />
                        <input type="hidden" name="userId" value={admin.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          disabled={isSubmitting}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </Form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
