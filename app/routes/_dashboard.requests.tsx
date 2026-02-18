import { useState, useEffect } from "react";
import { toast } from "sonner";
import { data, Form, useNavigation, Link } from "react-router";
import type { Route } from "./+types/_dashboard.requests";
// Server-side imports moved to loader/action to avoid Vite leakage
import type { RequestStatus } from "@prisma/client";
import { requireAdmin } from "../lib/session.server";

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
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  ClipboardCheck,
  PackageCheck,
} from "lucide-react";
import { formatDate } from "~/lib/date";
import { Select, SelectContent, SelectItem } from "~/components/ui/select";
import { SelectTrigger, SelectValue } from "@radix-ui/react-select";

export function meta() {
  return [{ title: "Asset Requests - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { prisma } = await import("../lib/db.server");
  const adminUser = await requireAdmin(request);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const requests = await prisma.assetRequest.findMany({
    where: status ? { status: status as RequestStatus } : {},
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch available assets for fulfillment
  const availableAssets = await prisma.asset.findMany({
    where: {
      status: "AVAILABLE",
      companyId: adminUser.companyId || undefined,
    },
    select: {
      id: true,
      name: true,
      serialNumber: true,
      model: true,
    },
  });

  return { requests, user: adminUser, availableAssets };
}

export async function action({ request }: Route.ActionArgs) {
  const { prisma } = await import("../lib/db.server");
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const requestId = formData.get("requestId") as string;

  // Approve / Reject / Fulfill
  if (intent === "approve" || intent === "reject" || intent === "fulfill") {
    const adminNotes = formData.get("adminNotes") as string;
    let status: RequestStatus;
    if (intent === "approve" || intent === "fulfill") {
      status = "APPROVED";
    } else {
      status = "REJECTED";
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const updateData: any = {
          status,
          adminNotes,
        };

        // If approved/fulfilling with an asset selection, handle asset assignment
        if (status === "APPROVED" && formData.get("assetId")) {
          const assetId = formData.get("assetId") as string;
          const userId = formData.get("userId") as string;

          if (!assetId || !userId) {
            throw new Error("Asset and User are required for fulfillment.");
          }

          // Create assignment
          await tx.assignment.create({
            data: {
              assetId,
              userId,
              status: "ACTIVE",
              notes: `Fulfilled from request: ${requestId}. ${adminNotes || ""}`,
            },
          });

          // Update asset status
          await tx.asset.update({
            where: { id: assetId },
            data: { status: "ASSIGNED" },
          });

          updateData.fulfilledAt = new Date();
        }

        await tx.assetRequest.update({
          where: { id: requestId },
          data: updateData,
        });

        return data({
          success: true,
          message: `Request ${status.toLowerCase()} successfully${formData.get("assetId") ? " and asset assigned" : ""}.`,
        });
      });
    } catch (error: any) {
      return data(
        { error: error.message || "Failed to process request." },
        { status: 400 },
      );
    }
  }

  // Update (edit) a request
  if (intent === "update") {
    const assetName = formData.get("assetName") as string;
    const reason = formData.get("reason") as string;
    const adminNotes = formData.get("adminNotes") as string;
    const status = formData.get("status") as RequestStatus;
    const userId = formData.get("userId") as string;
    const assetId = formData.get("assetId") as string;

    if (!assetName?.trim()) {
      return data({ error: "Asset name is required." }, { status: 400 });
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const oldRequest = await tx.assetRequest.findUnique({
          where: { id: requestId },
        });

        const isNowApprovedWithAsset = status === "APPROVED" && !!assetId;

        if (isNowApprovedWithAsset) {
          if (!assetId || !userId) {
            throw new Error(
              "Asset and User are required to fulfill a request.",
            );
          }

          // Create assignment
          await tx.assignment.create({
            data: {
              assetId,
              userId,
              status: "ACTIVE",
              notes: `Fulfilled from request update: ${requestId}. ${adminNotes || ""}`,
            },
          });

          // Update asset status
          await tx.asset.update({
            where: { id: assetId },
            data: { status: "ASSIGNED" },
          });
        }

        await tx.assetRequest.update({
          where: { id: requestId },
          data: {
            assetName: assetName.trim(),
            reason: reason?.trim() || null,
            adminNotes: adminNotes?.trim() || null,
            status,
            userId,
            fulfilledAt: isNowApprovedWithAsset ? new Date() : undefined,
          },
        });

        return data({
          success: true,
          message: "Request updated successfully.",
        });
      });
    } catch (error: any) {
      return data(
        { error: error.message || "Failed to update request." },
        { status: 400 },
      );
    }
  }

  // Delete a request
  if (intent === "delete") {
    try {
      await prisma.assetRequest.delete({ where: { id: requestId } });
      return data({ success: true, message: "Request deleted successfully." });
    } catch (error) {
      const { handleError } = await import("../lib/errors.server");
      return handleError(error);
    }
  }

  return null;
}

// ─── Status Badge Helper ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RequestStatus }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="flex w-fit items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
        >
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="flex w-fit items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
        >
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="flex w-fit items-center gap-1 bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
        >
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type RequestRow = {
  id: string;
  assetName: string;
  reason: string | null;
  status: RequestStatus;
  adminNotes: string | null;
  createdAt: Date;
  fulfilledAt: Date | null;
  user: { id: string; firstName: string; lastName: string; email: string };
};

// ─── Edit Dialog ─────────────────────────────────────────────────────────────
function EditRequestDialog({
  req,
  isSubmitting,
  availableAssets,
}: {
  req: RequestRow;
  isSubmitting: boolean;
  availableAssets: any[];
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(req.status);
  const [userId] = useState<string>(req.user.id);
  const [assetId, setAssetId] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
          <DialogDescription>
            Update the details of this asset request from{" "}
            <span className="font-medium">
              {req.user.firstName} {req.user.lastName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <Form
          method="post"
          className="space-y-4"
          onSubmit={() => setOpen(false)}
        >
          <input type="hidden" name="requestId" value={req.id} />
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="assetId" value={assetId} />

          <div className="space-y-2">
            <Label htmlFor={`edit-assetName-${req.id}`}>Asset Name</Label>
            <Input
              id={`edit-assetName-${req.id}`}
              name="assetName"
              defaultValue={req.assetName}
              placeholder="e.g. Laptop, Mouse, Keyboard"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-status-${req.id}`}>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id={`edit-status-${req.id}`} className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor={`edit-asset-selection-${req.id}`}>
              Available Asset{" "}
            </Label>
            <Select
              value={assetId}
              onValueChange={(val) => {
                setAssetId(val);
                // Auto-set status to APPROVED when an asset is selected
                if (val && val !== "none") {
                  setStatus("APPROVED");
                }
              }}
            >
              <SelectTrigger
                id={`edit-asset-selection-${req.id}`}
                className="w-full text-left border rounded px-3 py-2 flex items-center justify-between font-normal"
              >
                <SelectValue placeholder="Select Available asset (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}{" "}
                    {asset.serialNumber ? `(${asset.serialNumber})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-reason-${req.id}`}>Reason (Optional)</Label>
            <Textarea
              id={`edit-reason-${req.id}`}
              name="reason"
              defaultValue={req.reason ?? ""}
              placeholder="Reason for the request..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-adminNotes-${req.id}`}>
              Admin Notes (Optional)
            </Label>
            <Textarea
              id={`edit-adminNotes-${req.id}`}
              name="adminNotes"
              defaultValue={req.adminNotes ?? ""}
              placeholder="Internal notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────
function DeleteRequestDialog({
  req,
  isSubmitting,
}: {
  req: RequestRow;
  isSubmitting: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="h-8 gap-1">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Request
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete the request for{" "}
            <span className="font-semibold">"{req.assetName}"</span> from{" "}
            <span className="font-semibold">
              {req.user.firstName} {req.user.lastName}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <Form
          method="post"
          className="space-y-4"
          onSubmit={() => setOpen(false)}
        >
          <input type="hidden" name="requestId" value={req.id} />
          <input type="hidden" name="intent" value="delete" />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Handle (Approve / Reject) Dialog ────────────────────────────────────────
function HandleRequestDialog({
  req,
  isSubmitting,
}: {
  req: RequestRow;
  isSubmitting: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <ClipboardCheck className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Handle Request</DialogTitle>
          <DialogDescription>
            Approve or reject the request from {req.user.firstName}.
          </DialogDescription>
        </DialogHeader>
        <Form
          method="post"
          className="space-y-4"
          onSubmit={() => setOpen(false)}
        >
          <input type="hidden" name="requestId" value={req.id} />
          <div className="space-y-2">
            <Label>Asset: {req.assetName}</Label>
            <p className="text-sm text-muted-foreground italic">
              "{req.reason || "No reason provided"}"
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`adminNotes-${req.id}`}>
              Admin Notes (Optional)
            </Label>
            <Textarea
              id={`adminNotes-${req.id}`}
              name="adminNotes"
              placeholder="Add notes for the user..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              name="intent"
              value="reject"
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </Button>
            <Button
              type="submit"
              name="intent"
              value="approve"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Approve
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fulfill Dialog ───────────────────────────────────────────────────────────
function FulfillRequestDialog({
  req,
  isSubmitting,
  availableAssets,
}: {
  req: RequestRow;
  isSubmitting: boolean;
  availableAssets: any[];
}) {
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState<string>("");
  const [userId] = useState<string>(req.user.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-8 gap-1">
          <PackageCheck className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fulfill Request</DialogTitle>
          <DialogDescription>
            Mark this request as fulfilled by assigning an asset to a user.
          </DialogDescription>
        </DialogHeader>
        <Form
          method="post"
          className="space-y-4"
          onSubmit={() => setOpen(false)}
        >
          <input type="hidden" name="requestId" value={req.id} />
          <input type="hidden" name="intent" value="fulfill" />
          <input type="hidden" name="assetId" value={assetId} />
          <input type="hidden" name="userId" value={userId} />

          <div className="space-y-2">
            <Label htmlFor="assetId">Assign Asset</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger id="assetId" className="w-full">
                <SelectValue placeholder="Select available asset" />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available assets
                  </SelectItem>
                ) : (
                  availableAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}{" "}
                      {asset.serialNumber ? `(${asset.serialNumber})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Requested:{" "}
              <span className="font-medium text-foreground">
                {req.assetName}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`adminNotes-fulfill-${req.id}`}>
              Final Notes (Optional)
            </Label>
            <Textarea
              id={`adminNotes-fulfill-${req.id}`}
              name="adminNotes"
              placeholder="Add final notes for the assignment..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || availableAssets.length === 0}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign & Fulfill
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssetRequestsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { requests, availableAssets } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData) {
      if ((actionData as any).success) {
        toast.success(
          (actionData as any).message || "Action completed successfully.",
        );
      } else if ((actionData as any).error) {
        toast.error((actionData as any).error);
      }
    }
  }, [actionData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Asset Requests</h1>
        <p className="text-muted-foreground">
          Manage employee requests for new assets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>{requests.length} total requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No asset requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Asset Requested</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <RequestTableRow
                    key={req.id}
                    req={req as RequestRow}
                    availableAssets={availableAssets}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RequestTableRow({
  req,
  availableAssets,
}: {
  req: RequestRow;
  availableAssets: any[];
}) {
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("requestId") === req.id;

  return (
    <TableRow key={req.id}>
      {/* User */}
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {req.user.firstName} {req.user.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            {req.user.email}
          </span>
        </div>
      </TableCell>

      {/* Asset */}
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{req.assetName}</span>
          {req.reason && (
            <span
              className="text-xs text-muted-foreground truncate max-w-[180px]"
              title={req.reason}
            >
              {req.reason}
            </span>
          )}
        </div>
      </TableCell>

      {/* Date */}
      <TableCell className="text-sm">{formatDate(req.createdAt)}</TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge status={req.status} />
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center flex-row justify-end gap-2 ">
          {/* Workflow actions */}
          {req.status === "PENDING" && (
            <HandleRequestDialog req={req} isSubmitting={isSubmitting} />
          )}
          {req.status === "APPROVED" && (
            <FulfillRequestDialog
              req={req}
              isSubmitting={isSubmitting}
              availableAssets={availableAssets}
            />
          )}

          {/* Edit */}
          <EditRequestDialog
            req={req}
            isSubmitting={isSubmitting}
            availableAssets={availableAssets}
          />

          {/* Delete */}
          <DeleteRequestDialog req={req} isSubmitting={isSubmitting} />
        </div>
      </TableCell>
    </TableRow>
  );
}
