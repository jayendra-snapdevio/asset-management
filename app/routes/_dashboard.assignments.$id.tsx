import { redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.assignments.$id";
import { requireAuth } from "~/lib/session.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { handleError, errorResponse } from "~/lib/errors.server";
import {
  getAssignmentById,
  returnAssignment,
  transferAssignment,
  getActiveUsers,
} from "~/services/assignment.service.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FormSelect } from "~/components/forms/form-select";
import { FormTextarea } from "~/components/forms/form-textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  RotateCcw,
  ArrowRightLeft,
  Package,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import type { AssignmentStatus } from "@prisma/client";
import { useState } from "react";
import type { AssignmentWithRelations } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: data?.assignment
        ? `Assignment: ${data.assignment.asset.name} - Asset Management`
        : "Assignment Details - Asset Management",
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const companyFilter = await getCompanyFilter(user);

  const assignment = await getAssignmentById(params.id!, companyFilter);

  if (!assignment) {
    throw redirect("/dashboard/assignments");
  }

  // Restrict access for USER role
  if (user.role === "USER" && assignment.userId !== user.id) {
    throw new Response("You do not have permission to view this assignment", {
      status: 403,
    });
  }

  // Get users for transfer (admin/owner only)
  let transferUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }> = [];

  if (user.role === "OWNER" || user.role === "ADMIN") {
    transferUsers = await getActiveUsers(companyFilter);
    // Exclude the current assignee
    transferUsers = transferUsers.filter((u) => u.id !== assignment.userId);
  }

  return {
    user,
    assignment: assignment as AssignmentWithRelations,
    transferUsers,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const companyFilter = await getCompanyFilter(user);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Get the assignment first
  const assignment = await getAssignmentById(params.id!, companyFilter);

  if (!assignment) {
    throw redirect("/dashboard/assignments");
  }

  if (intent === "return") {
    const notes = formData.get("notes") as string;
    try {
      const result = await returnAssignment(
        params.id!,
        notes || undefined,
        user.role === "USER" ? user.id : undefined,
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      return redirect("/dashboard/assignments");
    } catch (error) {
      return handleError(error);
    }
  }

  if (intent === "transfer") {
    // Only admin/owner can transfer
    if (user.role === "USER") {
      return errorResponse("Only administrators can transfer assets", 403);
    }

    const newUserId = formData.get("newUserId") as string;
    const notes = formData.get("notes") as string;

    if (!newUserId) {
      return errorResponse("Please select a user to transfer to");
    }

    try {
      const result = await transferAssignment(
        params.id!,
        newUserId,
        notes || undefined,
      );

      if (result.error) {
        return errorResponse(result.error);
      }

      return redirect("/dashboard/assignments");
    } catch (error) {
      return handleError(error);
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
    month: "long",
    day: "numeric",
  });
}

export default function AssignmentDetailPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user, assignment, transferUsers } = loaderData;
  const typedAssignment = assignment as AssignmentWithRelations;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const canReturn =
    typedAssignment.status === "ACTIVE" &&
    (user.role === "OWNER" ||
      user.role === "ADMIN" ||
      typedAssignment.userId === user.id);

  const canTransfer =
    typedAssignment.status === "ACTIVE" &&
    (user.role === "OWNER" || user.role === "ADMIN");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/assignments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Assignment Details</h1>
            <p className="text-muted-foreground">
              View and manage this assignment
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {canReturn && (
            <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-[180px]">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Return Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Return Asset</DialogTitle>
                  <DialogDescription>
                    Mark this asset as returned. The asset will become available
                    for new assignments.
                  </DialogDescription>
                </DialogHeader>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="return" />
                  {actionData?.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{actionData.error}</AlertDescription>
                    </Alert>
                  )}
                  <FormTextarea
                    label="Notes (Optional)"
                    name="notes"
                    placeholder="Add any notes about the return..."
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReturnDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirm Return
                    </Button>
                  </div>
                </Form>
              </DialogContent>
            </Dialog>
          )}

          {canTransfer && transferUsers.length > 0 && (
            <Dialog
              open={transferDialogOpen}
              onOpenChange={setTransferDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Asset</DialogTitle>
                  <DialogDescription>
                    Transfer this asset to another user. The current assignment
                    will be marked as transferred.
                  </DialogDescription>
                </DialogHeader>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="transfer" />
                  <FormSelect
                    label="Transfer To"
                    name="newUserId"
                    required
                    placeholder="Select a user"
                    options={transferUsers.map((u) => ({
                      label: `${u.firstName} ${u.lastName} (${u.email})`,
                      value: u.id,
                    }))}
                  />
                  <FormTextarea
                    label="Notes (Optional)"
                    name="notes"
                    placeholder="Add any notes about the transfer..."
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTransferDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirm Transfer
                    </Button>
                  </div>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {actionData?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assignment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assignment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge(typedAssignment.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assigned Date</span>
              <span className="font-medium">
                {formatDate(typedAssignment.assignedDate)}
              </span>
            </div>
            {typedAssignment.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">
                  {formatDate(typedAssignment.dueDate)}
                </span>
              </div>
            )}
            {typedAssignment.returnDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return Date</span>
                <span className="font-medium">
                  {formatDate(typedAssignment.returnDate)}
                </span>
              </div>
            )}
            {typedAssignment.notes && (
              <div className="pt-4 border-t">
                <span className="text-muted-foreground text-sm">Notes</span>
                <p className="mt-1 whitespace-pre-wrap">
                  {typedAssignment.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground text-sm">Name</span>
              <p className="font-medium text-lg">
                {typedAssignment.asset.name}
              </p>
            </div>
            {typedAssignment.asset.serialNumber && (
              <div>
                <span className="text-muted-foreground text-sm">
                  Serial Number
                </span>
                <p className="font-medium">
                  {typedAssignment.asset.serialNumber}
                </p>
              </div>
            )}
            {typedAssignment.asset.category && (
              <div>
                <span className="text-muted-foreground text-sm">Category</span>
                <p className="font-medium">{typedAssignment.asset.category}</p>
              </div>
            )}
            {typedAssignment.asset.location && (
              <div>
                <span className="text-muted-foreground text-sm">Location</span>
                <p className="font-medium">{typedAssignment.asset.location}</p>
              </div>
            )}
            <div className="pt-4">
              <Link to={`/dashboard/assets/${typedAssignment.asset.id}`}>
                <Button variant="outline" size="sm">
                  View Asset Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigned User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground text-sm">Name</span>
              <p className="font-medium text-lg">
                {typedAssignment.user.firstName} {typedAssignment.user.lastName}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Email</span>
              <p className="font-medium">{typedAssignment.user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />

              <div className="relative">
                <div className="absolute -left-4 w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <span className="text-sm font-medium">Assigned</span>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(typedAssignment.assignedDate)}
                  </p>
                </div>
              </div>

              {typedAssignment.dueDate && (
                <div className="relative">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <span className="text-sm font-medium">Due Date</span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(typedAssignment.dueDate)}
                    </p>
                  </div>
                </div>
              )}

              {typedAssignment.returnDate && (
                <div className="relative">
                  <div className="absolute -left-4 w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <span className="text-sm font-medium">
                      {typedAssignment.status === "TRANSFERRED"
                        ? "Transferred"
                        : "Returned"}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(typedAssignment.returnDate)}
                    </p>
                  </div>
                </div>
              )}

              {typedAssignment.status === "ACTIVE" &&
                !typedAssignment.returnDate && (
                  <div className="relative">
                    <div className="absolute -left-4 w-3 h-3 rounded-full border-2 border-muted-foreground bg-background" />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Currently Assigned
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
