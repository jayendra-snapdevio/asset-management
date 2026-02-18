import { useState } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.companies.$id";
import { requireRole } from "~/lib/session.server";
import {
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "~/services/company.service.server";
import { updateCompanySchema } from "~/validators/company.validator";
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
  Save,
  Trash2,
  Users,
  Package,
  UserPlus,
  Shield,
  User,
} from "lucide-react";
import { formatDate } from "~/lib/date";
import { SuccessMessage } from "~/components/ui/success-message";
import type { CompanyDetail } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  const companyName = data?.company?.name || "Company";
  return [{ title: `${companyName} - Asset Management` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER"]);

  const company = await getCompanyById(params.id, user.id);

  if (!company) {
    throw redirect("/unauthorized");
  }

  return { user, company };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER"]);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update") {
    const rawData = Object.fromEntries(formData);
    rawData.id = params.id;

    const result = updateCompanySchema.safeParse(rawData);
    if (!result.success) {
      return data(
        { errors: result.error.flatten().fieldErrors, success: false },
        { status: 400 },
      );
    }

    const updated = await updateCompany(params.id, user.id, result.data);
    if (!updated) {
      return data(
        { error: "Company not found", success: false },
        { status: 404 },
      );
    }

    return data({ success: true, message: "Company updated successfully" });
  }

  if (intent === "delete") {
    const deleted = await deleteCompany(params.id, user.id);
    if (!deleted) {
      return data(
        { error: "Company not found", success: false },
        { status: 404 },
      );
    }

    return redirect("/dashboard/companies");
  }

  return null;
}

export default function CompanyDetailPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { company } = loaderData;
  const typedCompany = company as CompanyDetail;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="default" size="sm">
            <Link to="/dashboard/companies">
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {company.name}
            </h1>
            <p className="text-muted-foreground">
              Manage company details and users
            </p>
          </div>
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{company.name}"? This action
                will deactivate the company and all associated data. This cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Form method="post">
                <input type="hidden" name="intent" value="delete" />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete Company"}
                </Button>
              </Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.assets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Company Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Update company information</CardDescription>
        </CardHeader>
        <CardContent>
          {actionData && "success" in actionData && actionData.success && (
            <SuccessMessage
              message={
                "message" in actionData
                  ? actionData.message
                  : "Company updated successfully!"
              }
            />
          )}
          {actionData && "error" in actionData && actionData.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {actionData.error}
            </div>
          )}

          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="update" />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Company Name"
                name="name"
                defaultValue={company.name}
                required
                error={
                  actionData && "errors" in actionData
                    ? actionData.errors?.name
                    : undefined
                }
              />

              <FormField
                label="Email"
                name="email"
                type="email"
                defaultValue={company.email || ""}
                error={
                  actionData && "errors" in actionData
                    ? actionData.errors?.email
                    : undefined
                }
              />

              <FormField
                label="Phone"
                name="phone"
                defaultValue={company.phone || ""}
                error={
                  actionData && "errors" in actionData
                    ? actionData.errors?.phone
                    : undefined
                }
              />

              <FormField
                label="Website"
                name="website"
                type="url"
                defaultValue={company.website || ""}
                error={
                  actionData && "errors" in actionData
                    ? actionData.errors?.website
                    : undefined
                }
              />
            </div>

            <FormField
              label="Address"
              name="address"
              defaultValue={company.address || ""}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Company Users</CardTitle>
            <CardDescription>Users assigned to this company</CardDescription>
          </div>
          <Button asChild>
            <Link to={`/dashboard/companies/${company.id}/admins`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Admins
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {company.users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No users in this company yet.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to={`/dashboard/companies/${company.id}/admins`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Users
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedCompany.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/dashboard/users/${user.id}`}
                        className="hover:underline text-primary"
                      >
                        {user.firstName} {user.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/dashboard/users/${user.id}`}
                        className="hover:underline text-primary"
                      >
                        {user.email}
                      </Link>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
