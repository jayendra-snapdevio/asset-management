import { useState, useEffect } from "react";
import { toast } from "sonner";
import { data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.my-assets";
// Server-only imports moved to loader to avoid Vite leakage
import type { AssetStatus, AssignmentStatus } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Laptop,
  History,
  RotateCcw,
  Loader2,
  Package,
  Eye,
  Shield,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { formatDuration } from "~/lib/utils";
import { formatDate } from "~/lib/date";
// AssignmentStatus moved to top level type imports

export function meta() {
  return [{ title: "My Assets - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("../lib/session.server");
  const { prisma } = await import("../lib/db.server");
  const user = await requireAuth(request);

  const [currentAssets, history, ownedAssets, myRequests] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            model: true,
            manufacturer: true,
            category: true,
            status: true,
            imageUrl: true,
            ownershipType: true,
            otherOwnership: true,
            owner: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { assignedDate: "desc" },
    }),
    prisma.assignment.findMany({
      where: { userId: user.id, status: { not: "ACTIVE" } },
      include: {
        asset: true,
      },
      orderBy: { returnDate: "desc" },
      take: 10,
    }),
    prisma.asset.findMany({
      where: { ownerId: user.id },
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: { user: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assetRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { currentAssets, history, ownedAssets, myRequests, user };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("../lib/session.server");
  const { prisma } = await import("../lib/db.server");
  const user = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "return") {
    const { returnAssignment } =
      await import("../services/assignment.service.server");
    const assignmentId = formData.get("assignmentId") as string;
    const notes = formData.get("notes") as string;

    try {
      const result = await returnAssignment(
        assignmentId,
        notes || undefined,
        user.id,
      );

      if (result.error) {
        return data({ error: result.error }, { status: 400 });
      }

      return data({ success: true });
    } catch (error) {
      const { handleError } = await import("../lib/errors.server");
      return handleError(error);
    }
  }

  if (intent === "request") {
    const assetName = formData.get("assetName") as string;
    const reason = formData.get("reason") as string;

    if (!assetName) {
      return data({ error: "Asset name is required" }, { status: 400 });
    }

    try {
      await prisma.assetRequest.create({
        data: {
          userId: user.id,
          assetName,
          reason,
          status: "PENDING",
        },
      });
      return data({ success: true, message: "Request submitted successfully" });
    } catch (error) {
      const { handleError } = await import("../lib/errors.server");
      return handleError(error);
    }
  }

  // Update own PENDING request
  if (intent === "updateRequest") {
    const requestId = formData.get("requestId") as string;
    const assetName = formData.get("assetName") as string;
    const reason = formData.get("reason") as string;

    if (!assetName?.trim()) {
      return data({ error: "Asset name is required." }, { status: 400 });
    }

    try {
      // Verify ownership and PENDING status before updating
      const existing = await prisma.assetRequest.findUnique({
        where: { id: requestId },
      });
      if (!existing || existing.userId !== user.id) {
        return data({ error: "Request not found." }, { status: 404 });
      }
      if (existing.status !== "PENDING") {
        return data(
          { error: "Only pending requests can be edited." },
          { status: 400 },
        );
      }
      await prisma.assetRequest.update({
        where: { id: requestId },
        data: { assetName: assetName.trim(), reason: reason?.trim() || null },
      });
      return data({ success: true, message: "Request updated successfully." });
    } catch (error) {
      const { handleError } = await import("../lib/errors.server");
      return handleError(error);
    }
  }

  // Cancel (delete) own PENDING request
  if (intent === "cancelRequest") {
    const requestId = formData.get("requestId") as string;

    try {
      const existing = await prisma.assetRequest.findUnique({
        where: { id: requestId },
      });
      if (!existing || existing.userId !== user.id) {
        return data({ error: "Request not found." }, { status: 404 });
      }
      if (existing.status !== "PENDING") {
        return data(
          { error: "Only pending requests can be cancelled." },
          { status: 400 },
        );
      }
      await prisma.assetRequest.delete({ where: { id: requestId } });
      return data({
        success: true,
        message: "Request cancelled successfully.",
      });
    } catch (error) {
      const { handleError } = await import("../lib/errors.server");
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

export default function MyAssetsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { currentAssets, history, ownedAssets, myRequests } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [returnDialogOpen, setReturnDialogOpen] = useState<string | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (actionData) {
      if ((actionData as any).success) {
        toast.success(
          (actionData as any).message || "Action completed successfully",
        );
        setReturnDialogOpen(null);
        setRequestDialogOpen(false);
        setEditRequestId(null);
        setCancelRequestId(null);
      } else if ((actionData as any).error) {
        toast.error((actionData as any).error);
      }
    }
  }, [actionData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">My Assets</h1>
          <p className="text-muted-foreground">
            Assets currently assigned to you and your history
          </p>
        </div>
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-[180px]">
              <PlusCircle className="h-4 w-4" />
              Request Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request New Asset</DialogTitle>
              <DialogDescription>
                Need a new asset? Submit a request to the admin.
              </DialogDescription>
            </DialogHeader>
            <Form
              method="post"
              className="space-y-4"
              onSubmit={() => setRequestDialogOpen(false)}
            >
              <input type="hidden" name="intent" value="request" />

              <div className="space-y-2">
                <Label htmlFor="assetName">
                  Asset Needed (e.g., Mouse, Keyboard, Laptop)
                </Label>
                <Input
                  id="assetName"
                  name="assetName"
                  placeholder="Enter the name of the asset you need"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Request (Optional)</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Explain why you need this asset..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Request
                </Button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Currently Assigned Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Currently Assigned ({currentAssets.length})
          </CardTitle>
          <CardDescription>Assets you are responsible for</CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Laptop className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                You don't have any assets assigned to you at the moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentAssets.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="border-l-4 border-l-green-500"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {assignment.asset.name}
                      </CardTitle>
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Assigned
                      </Badge>
                    </div>
                    <CardDescription>
                      {assignment.asset.category || "Uncategorized"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      {assignment.asset.serialNumber && (
                        <p>
                          <span className="text-muted-foreground">Serial:</span>{" "}
                          {assignment.asset.serialNumber}
                        </p>
                      )}
                      {assignment.asset.model && (
                        <p>
                          <span className="text-muted-foreground">Model:</span>{" "}
                          {assignment.asset.model}
                        </p>
                      )}
                      <p>
                        <span className="text-muted-foreground">Assigned:</span>{" "}
                        {formatDate(assignment.assignedDate)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Duration:</span>{" "}
                        {formatDuration(assignment.assignedDate, new Date())}
                      </p>
                      {assignment.dueDate && (
                        <p>
                          <span className="text-muted-foreground">Due:</span>{" "}
                          {formatDate(assignment.dueDate)}
                        </p>
                      )}
                      <p>
                        <span className="text-muted-foreground">
                          Ownership:
                        </span>{" "}
                        <span className="capitalize">
                          {assignment.asset.ownershipType?.toLowerCase()}
                        </span>
                        {assignment.asset.ownershipType === "PRIVATE" &&
                          assignment.asset.owner && (
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({assignment.asset.owner.firstName}{" "}
                              {assignment.asset.owner.lastName})
                            </span>
                          )}
                        {assignment.asset.ownershipType === "OTHER" &&
                          assignment.asset.otherOwnership && (
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({assignment.asset.otherOwnership})
                            </span>
                          )}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link to={`/dashboard/assets/${assignment.asset.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>

                      <Dialog
                        open={returnDialogOpen === assignment.id}
                        onOpenChange={(open) =>
                          setReturnDialogOpen(open ? assignment.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Return
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Return Asset</DialogTitle>
                            <DialogDescription>
                              Return "{assignment.asset.name}" and make it
                              available for other users.
                            </DialogDescription>
                          </DialogHeader>
                          <Form method="post" className="space-y-4">
                            <input type="hidden" name="intent" value="return" />
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.id}
                            />

                            <div className="space-y-2">
                              <Label htmlFor={`notes-${assignment.id}`}>
                                Notes (Optional)
                              </Label>
                              <Textarea
                                id={`notes-${assignment.id}`}
                                name="notes"
                                placeholder="Add any notes about the condition or return..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setReturnDialogOpen(null)}
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owned Assets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            My Owned Assets ({ownedAssets.length})
          </CardTitle>
          <CardDescription>
            Assets where you are the registered owner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownedAssets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No owned assets found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/dashboard/assets/${asset.id}`}
                        className="hover:underline text-primary"
                      >
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>{asset.serialNumber || "-"}</TableCell>
                    <TableCell className="capitalize">
                      {asset.category || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{asset.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* My Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Asset Requests ({myRequests.length})
          </CardTitle>
          <CardDescription>Status of your asset requests</CardDescription>
        </CardHeader>
        <CardContent>
          {myRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't made any asset requests yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Notes</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.assetName}
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      {request.status === "PENDING" && (
                        <Badge
                          variant="outline"
                          className="flex w-fit items-center gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                      {request.status === "APPROVED" && (
                        <Badge className="bg-green-500 hover:bg-green-600 flex w-fit items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved
                        </Badge>
                      )}
                      {request.status === "REJECTED" && (
                        <Badge
                          variant="destructive"
                          className="flex w-fit items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                      {request.status === "FULFILLED" && (
                        <Badge
                          variant="secondary"
                          className="flex w-fit items-center gap-1"
                        >
                          <Package className="h-3 w-3" />
                          Fulfilled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={request.adminNotes || ""}
                    >
                      {request.adminNotes || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {request.status === "PENDING" && (
                        <div className="flex justify-center gap-2">
                          {/* Edit dialog */}
                          <Dialog
                            open={editRequestId === request.id}
                            onOpenChange={(open) =>
                              setEditRequestId(open ? request.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Request</DialogTitle>
                                <DialogDescription>
                                  Update your pending asset request.
                                </DialogDescription>
                              </DialogHeader>
                              <Form method="post" className="space-y-4">
                                <input
                                  type="hidden"
                                  name="intent"
                                  value="updateRequest"
                                />
                                <input
                                  type="hidden"
                                  name="requestId"
                                  value={request.id}
                                />
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-asset-${request.id}`}>
                                    Asset Needed
                                  </Label>
                                  <Input
                                    id={`edit-asset-${request.id}`}
                                    name="assetName"
                                    defaultValue={request.assetName}
                                    placeholder="e.g. Mouse, Keyboard, Laptop"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-reason-${request.id}`}>
                                    Reason (Optional)
                                  </Label>
                                  <Textarea
                                    id={`edit-reason-${request.id}`}
                                    name="reason"
                                    defaultValue={request.reason ?? ""}
                                    placeholder="Explain why you need this asset..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditRequestId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Save Changes
                                  </Button>
                                </div>
                              </Form>
                            </DialogContent>
                          </Dialog>

                          {/* Cancel dialog */}
                          <Dialog
                            open={cancelRequestId === request.id}
                            onOpenChange={(open) =>
                              setCancelRequestId(open ? request.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  Cancel Request
                                </DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to cancel your request
                                  for{" "}
                                  <span className="font-semibold">
                                    "{request.assetName}"
                                  </span>
                                  ? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <Form method="post" className="space-y-4">
                                <input
                                  type="hidden"
                                  name="intent"
                                  value="cancelRequest"
                                />
                                <input
                                  type="hidden"
                                  name="requestId"
                                  value={request.id}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCancelRequestId(null)}
                                  >
                                    Keep Request
                                  </Button>
                                  <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Yes, Cancel
                                  </Button>
                                </div>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
          </CardTitle>
          <CardDescription>
            Your past asset assignments (last 20)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No previous assignments
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/dashboard/assets/${assignment.asset.id}`}
                        className="hover:underline text-primary"
                      >
                        {assignment.asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>{assignment.asset.category || "-"}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
