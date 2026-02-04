import { useState } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.users.$id";
import { requireRole } from "~/lib/session.server";
import {
  getUserById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
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

type UserAssignment = {
  id: string;
  assignedDate: Date;
  returnDate: Date | null;
  status: string;
  notes: string | null;
  asset: {
    id: string;
    name: string;
    serialNumber: string | null;
    status: string;
  };
};

type UserDetail = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  companyId: string | null;
  company: { id: string; name: string } | null;
  assignments: UserAssignment[];
};

export function meta({ data }: Route.MetaArgs) {
  const userName = data?.user ? `${data.user.firstName} ${data.user.lastName}` : "User";
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
        { status: 400 }
      );
    }

    const updateResult = await updateUser(params.id, currentUser, {
      email: result.data.email,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      role: result.data.role,
    });

    if (updateResult.error) {
      return data({ error: updateResult.error, success: false }, { status: 400 });
    }

    return data({ success: true, message: "User updated successfully" });
  }

  if (intent === "toggle-status") {
    const toggleResult = await toggleUserStatus(params.id, currentUser);

    if (toggleResult.error) {
      return data({ error: toggleResult.error, success: false }, { status: 400 });
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
        { status: 400 }
      );
    }

    const resetResult = await resetUserPassword(params.id, newPassword, currentUser);

    if (resetResult.error) {
      return data({ error: resetResult.error, success: false }, { status: 400 });
    }

    return data({ success: true, message: "Password reset successfully" });
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
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const activeAssignments = typedUser.assignments.filter((a) => a.status === "ACTIVE");
  const pastAssignments = typedUser.assignments.filter((a) => a.status !== "ACTIVE");

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

  const canModify = currentUser.role === "OWNER" || 
    (currentUser.role === "ADMIN" && typedUser.role !== "OWNER");
  const isSelf = currentUser.id === typedUser.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/users">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              {typedUser.firstName} {typedUser.lastName}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {typedUser.email}
              {getRoleBadge(typedUser.role)}
              {typedUser.isActive ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canModify && !isSelf && (
            <>
              <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <Form method="post" onSubmit={() => setIsResetPasswordOpen(false)}>
                    <input type="hidden" name="intent" value="reset-password" />
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Set a new password for {typedUser.firstName} {typedUser.lastName}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          placeholder="Enter new password"
                          required
                          minLength={8}
                        />
                        <p className="text-sm text-muted-foreground">
                          Minimum 8 characters
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsResetPasswordOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                      </Button>
                    </DialogFooter>
                  </Form>
                </DialogContent>
              </Dialog>

              <Form method="post">
                <input type="hidden" name="intent" value="toggle-status" />
                <Button
                  type="submit"
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
            </>
          )}
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typedUser.assignments.length}</div>
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
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={typedUser.firstName}
                  disabled={!canModify}
                />
                {actionData && "errors" in actionData && actionData.errors?.firstName && (
                  <p className="text-sm text-destructive">{actionData.errors.firstName[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={typedUser.lastName}
                  disabled={!canModify}
                />
                {actionData && "errors" in actionData && actionData.errors?.lastName && (
                  <p className="text-sm text-destructive">{actionData.errors.lastName[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={typedUser.email}
                  disabled={!canModify}
                />
                {actionData && "errors" in actionData && actionData.errors?.email && (
                  <p className="text-sm text-destructive">{actionData.errors.email[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  defaultValue={typedUser.role}
                  disabled={!canModify || isSelf}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            {typedUser.company && (
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={typedUser.company.name} disabled />
              </div>
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

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Active Assignments ({activeAssignments.length})
          </CardTitle>
          <CardDescription>Assets currently assigned to this user</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No active assignments
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Notes</TableHead>
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
                    <TableCell>{assignment.asset.serialNumber || "-"}</TableCell>
                    <TableCell>
                      {formatDate(assignment.assignedDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(assignment.assignedDate, new Date())} (ongoing)
                    </TableCell>
                    <TableCell>{assignment.notes || "-"}</TableCell>
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
                      {assignment.asset.name}
                    </TableCell>
                    <TableCell>{assignment.asset.serialNumber || "-"}</TableCell>
                    <TableCell>
                      {formatDate(assignment.assignedDate)}
                    </TableCell>
                    <TableCell>
                      {assignment.returnDate
                        ? formatDate(assignment.returnDate)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.returnDate
                        ? formatDuration(assignment.assignedDate, assignment.returnDate)
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
