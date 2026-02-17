import { useState } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.users.$id";
import { requireRole } from "~/lib/session.server";
import {
  getUserById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from "~/services/user.service.server";
import { updateUserSchema } from "~/validators/user.validator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/forms/form-field";
import { FormSelect } from "~/components/forms/form-select";
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
import { formatDuration } from "~/lib/utils";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Shield,
  Crown,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  KeyRound,
  UserX,
  UserCheck,
} from "lucide-react";
import { formatDate } from "~/lib/date";
import { SuccessMessage } from "~/components/ui/success-message";
import type { UserDetail } from "~/types";
import { OWNERSHIP_TYPE_LABELS } from "~/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

export function meta({ data }: Route.MetaArgs) {
  const userName = data?.user
    ? `${data.user.firstName} ${data.user.lastName}`
    : "User";
  return [{ title: `${userName} - Asset Management` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const currentUser = await requireRole(request, ["OWNER", "ADMIN"]);

  const user = await getUserById(params.id, currentUser);

  if (!user) {
    throw redirect("/unauthorized");
  }

  return { currentUser, user };
}

export async function action({ request, params }: Route.ActionArgs) {
  const currentUser = await requireRole(request, ["OWNER", "ADMIN"]);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update") {
    const rawData = Object.fromEntries(formData);
    rawData.id = params.id;

    const result = updateUserSchema.safeParse(rawData);
    if (!result.success) {
      return data(
        { errors: result.error.flatten().fieldErrors, success: false },
        { status: 400 },
      );
    }

    const updateResult = await updateUser(params.id, currentUser, {
      email: result.data.email,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      role: result.data.role,
    });

    if (updateResult.error) {
      return data(
        { error: updateResult.error, success: false },
        { status: 400 },
      );
    }

    return data({ success: true, message: "User updated successfully" });
  }

  if (intent === "toggle-status") {
    const toggleResult = await toggleUserStatus(params.id, currentUser);

    if (toggleResult.error) {
      return data(
        { error: toggleResult.error, success: false },
        { status: 400 },
      );
    }

    return data({
      success: true,
      message: toggleResult.user!.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
    });
  }

  if (intent === "reset-password") {
    const newPassword = formData.get("newPassword") as string;

    if (!newPassword || newPassword.length < 8) {
      return data(
        { error: "Password must be at least 8 characters", success: false },
        { status: 400 },
      );
    }

    const resetResult = await resetUserPassword(
      params.id,
      newPassword,
      currentUser,
    );

    if (resetResult.error) {
      return data(
        { error: resetResult.error, success: false },
        { status: 400 },
      );
    }

    return data({ success: true, message: "Password reset successfully" });
  }

  if (intent === "delete") {
    const deleteResult = await deleteUser(params.id, currentUser);

    if (deleteResult.error) {
      return data(
        { error: deleteResult.error, success: false },
        { status: 400 },
      );
    }

    return redirect("/dashboard/users");
  }

  return null;
}

export default function UserDetailPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { currentUser, user } = loaderData;
  const typedUser = user as UserDetail;
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const activeAssignments = typedUser.assignments.filter(
    (a) => a.status === "ACTIVE",
  );
  const pastAssignments = typedUser.assignments.filter(
    (a) => a.status !== "ACTIVE",
  );

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>;
      case "RETURNED":
        return <Badge variant="secondary">Returned</Badge>;
      case "TRANSFERRED":
        return <Badge variant="outline">Transferred</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canModify =
    currentUser.role === "OWNER" ||
    (currentUser.role === "ADMIN" && typedUser.role !== "OWNER");
  const isSelf = currentUser.id === typedUser.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="default" size="sm">
            <Link to="/dashboard/users">
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Link>
          </Button>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              <h1> {typedUser.firstName} {typedUser.lastName}</h1>
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
             <Tooltip>
               <TooltipTrigger asChild>
                 <button> {getRoleBadge(typedUser.role)}</button>
               </TooltipTrigger>
               <TooltipContent>
                 {typedUser.email}
               </TooltipContent>
            </Tooltip>
              {typedUser.isActive ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-600"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-col md:flex-row md:flex-nowrap">
          {canModify && !isSelf && (
            <>
              <Dialog
                open={isResetPasswordOpen}
                onOpenChange={setIsResetPasswordOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full md:w-[180px]">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <Form
                    method="post"
                    onSubmit={() => setIsResetPasswordOpen(false)}
                  >
                    <input type="hidden" name="intent" value="reset-password" />
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Set a new password for {typedUser.firstName}{" "}
                        {typedUser.lastName}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <FormField
                        label="New Password"
                        name="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        required
                        helperText="Minimum 8 characters"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        className="w-full md:w-[180px]"
                        variant="outline"
                        onClick={() => setIsResetPasswordOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                      </Button>
                    </DialogFooter>
                  </Form>
                </DialogContent>
              </Dialog>

              <Form method="post" className="w-full">
                <input type="hidden" name="intent" value="toggle-status" />
                <Button
                  type="submit"
                  className="w-full md:w-[180px]"
                  variant={typedUser.isActive ? "destructive" : "default"}
                  disabled={isSubmitting}
                >
                  {typedUser.isActive ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
              </Form>

              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full md:w-[180px]">
                    <UserX className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete {typedUser.firstName}{" "}
                      {typedUser.lastName}? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <Form method="post" onSubmit={() => setIsDeleteDialogOpen(false)}>
                    <input type="hidden" name="intent" value="delete" />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive" disabled={isSubmitting}>
                        {isSubmitting ? "Deleting..." : "Delete User"}
                      </Button>
                    </DialogFooter>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Assignments
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typedUser.assignments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owned Assets</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typedUser.ownedAssets.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(typedUser.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            {canModify ? "Update user information" : "View user information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="update" />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="First Name"
                name="firstName"
                defaultValue={typedUser.firstName}
                disabled={!canModify}
                error={actionData && "errors" in actionData ? actionData.errors?.firstName : undefined}
              />

              <FormField
                label="Last Name"
                name="lastName"
                defaultValue={typedUser.lastName}
                disabled={!canModify}
                error={actionData && "errors" in actionData ? actionData.errors?.lastName : undefined}
              />

              <FormField
                label="Email"
                name="email"
                type="email"
                defaultValue={typedUser.email}
                disabled={!canModify}
                error={actionData && "errors" in actionData ? actionData.errors?.email : undefined}
              />

              <FormSelect
                label="Role"
                name="role"
                defaultValue={typedUser.role}
                disabled={!canModify || isSelf}
                options={[
                  { label: "User", value: "USER" },
                  { label: "Admin", value: "ADMIN" },
                  ...(currentUser.role === "OWNER" ? [{ label: "Owner", value: "OWNER" }] : []),
                ]}
              />
            </div>

            {typedUser.company && (
              <FormField
                label="Company"
                value={typedUser.company.name}
                disabled
              />
            )}

            {canModify && (
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </Form>
        </CardContent>
      </Card>

      {/* Active Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Active Assignments ({activeAssignments.length})
          </CardTitle>
          <CardDescription>
            Assets currently assigned to this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No active assets
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/dashboard/assets/${assignment.asset.id}`}
                        className="hover:underline text-primary"
                      >
                        {assignment.asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {assignment.asset.serialNumber || "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {assignment.asset.category || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {assignment.asset.ownershipType ? (
                          <Badge variant="outline" className="w-fit">
                            {OWNERSHIP_TYPE_LABELS[assignment.asset.ownershipType as keyof typeof OWNERSHIP_TYPE_LABELS] || assignment.asset.ownershipType}
                          </Badge>
                        ) : "-"}
                        {assignment.asset.ownershipType === "PRIVATE" && assignment.asset.owner && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            Owner: {assignment.asset.owner.firstName} {assignment.asset.owner.lastName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(assignment.assignedDate)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(assignment.assignedDate, new Date())}{" "}
                      (ongoing)
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Owned Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Owned Assets ({typedUser.ownedAssets.length})
          </CardTitle>
          <CardDescription>
            Assets where this user is the registered owner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typedUser.ownedAssets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No owned assets
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedUser.ownedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/dashboard/assets/${asset.id}`}
                        className="hover:underline text-primary"
                      >
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {asset.serialNumber || "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {asset.category || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {asset.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment History */}
      {pastAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Assignment History ({pastAssignments.length})
            </CardTitle>
            <CardDescription>Past asset assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      <Link to={`/dashboard/assets/${assignment.asset.id}`} className="hover:underline text-primary">
                        {assignment.asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {assignment.asset.serialNumber || "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {assignment.asset.category || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {assignment.asset.ownershipType ? (
                          <Badge variant="outline" className="w-fit">
                            {OWNERSHIP_TYPE_LABELS[assignment.asset.ownershipType as keyof typeof OWNERSHIP_TYPE_LABELS] || assignment.asset.ownershipType}
                          </Badge>  
                        ) : "-"}
                        {assignment.asset.ownershipType === "PRIVATE" && assignment.asset.owner && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            Owner: {assignment.asset.owner.firstName} {assignment.asset.owner.lastName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(assignment.assignedDate)}</TableCell>
                    <TableCell>
                      {assignment.returnDate
                        ? formatDate(assignment.returnDate)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.returnDate
                        ? formatDuration(
                            assignment.assignedDate,
                            assignment.returnDate,
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
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
