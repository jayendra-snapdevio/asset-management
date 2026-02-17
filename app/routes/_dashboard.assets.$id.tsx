import { useState } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.assets.$id";
// Server-only imports moved to loader/action to avoid Vite leakage
import type { AssetStatus, AssignmentStatus, OwnershipType } from "@prisma/client";
import { updateAssetSchema } from "../validators/asset.validator";
import { handleError, errorResponse } from "../lib/errors.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FormField } from "~/components/forms/form-field";
import { FormTextarea } from "~/components/forms/form-textarea";
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
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Trash2,
  RotateCcw,
  QrCode,
  Download,
  Edit2,
  Save,
  X,
  User,
  History,
  Package,
} from "lucide-react";
import { ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_CATEGORIES, ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS, OWNERSHIP_TYPE_LABELS, OWNERSHIP_TYPE_OPTIONS } from "~/constants";
// getUsers moved to loader
import { format } from "date-fns";
import { ImageUpload } from "~/components/assets/ImageUpload";
import { formatDuration } from "~/lib/utils";
import { SuccessMessage } from "~/components/ui/success-message";
import { Alert, AlertDescription } from "~/components/ui/alert";
import type { AssetDetail } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  const assetName = data?.asset?.name || "Asset";
  return [{ title: `${assetName} - Asset Management` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { requireAuth } = await import("../lib/session.server");
  const { getCompanyFilter } = await import("../services/company.service.server");
  const { getAssetById } = await import("../services/asset.service.server");
  const { getUsers } = await import("../services/user.service.server");

  const user = await requireAuth(request);
  const companyFilter = await getCompanyFilter(user);

  const asset = await getAssetById(
    params.id!,
    companyFilter,
    user.role === "USER" ? user.id : undefined
  );

  if (!asset) {
    throw redirect("/dashboard/assets");
  }

  const { users } = await getUsers(user, { page: 1, limit: 1000 });
  const userOptions = users.map(u => ({ label: `${u.firstName} ${u.lastName} (${u.email})`, value: u.id }));

  return { user, asset, userOptions };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { requireAuth } = await import("../lib/session.server");
  const { getCompanyFilter } = await import("../services/company.service.server");
  const {
    getAssetById,
    updateAsset,
    deleteAsset,
    restoreAsset,
    regenerateQRCode,
    deleteAssetImage,
  } = await import("../services/asset.service.server");
  const { returnAssignment } = await import("../services/assignment.service.server");

  const user = await requireAuth(request);
  const companyFilter = await getCompanyFilter(user);

  const asset = await getAssetById(params.id!, companyFilter);
  if (!asset) {
    throw redirect("/dashboard/assets");
  }

  const isOwnerOrCreator = asset.ownerId === user.id || asset.createdById === user.id;
  const isAdminOrOwner = user.role === "OWNER" || user.role === "ADMIN";
  const canModify = isAdminOrOwner || isOwnerOrCreator;

  if (!canModify) {
    return errorResponse("You don't have permission to modify this asset.");
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update") {
    const rawData = Object.fromEntries(formData);
    const dataWithId = { ...rawData, id: params.id };
    const result = updateAssetSchema.safeParse(dataWithId);

    if (!result.success) {
      return data(
        { errors: result.error.flatten().fieldErrors, error: undefined, success: false },
        { status: 400 }
      );
    }

    try {
      const updateResult = await updateAsset(
        params.id!,
        {
          name: result.data.name,
          description: result.data.description,
          serialNumber: result.data.serialNumber,
          model: result.data.model,
          manufacturer: result.data.manufacturer,
          purchaseDate: result.data.purchaseDate,
          purchasePrice: result.data.purchasePrice,
          currentValue: result.data.currentValue,
          location: result.data.location,
          status: result.data.status,
          category: result.data.category,
          tags: result.data.tags,
          ownershipType: result.data.ownershipType,
          ownerId: result.data.ownerId,
          otherOwnership: result.data.otherOwnership,
        },
        companyFilter
      );

      if (updateResult.error) {
        return errorResponse(updateResult.error);
      }

      return data({ success: true, error: undefined, errors: undefined });
    } catch (error) {
      return handleError(error);
    }
  }

  if (intent === "delete") {
    try {
      const deleteResult = await deleteAsset(params.id!, companyFilter);

      if (deleteResult.error) {
        return errorResponse(deleteResult.error);
      }

      return redirect("/dashboard/assets");
    } catch (error) {
      return handleError(error);
    }
  }

  if (intent === "restore") {
    try {
      const restoreResult = await restoreAsset(params.id!, companyFilter);

      if (restoreResult.error) {
        return errorResponse(restoreResult.error);
      }

      return data({ success: true, error: undefined, errors: undefined });
    } catch (error) {
      return handleError(error);
    }
  }

  if (intent === "regenerate-qr") {
    try {
      const qrResult = await regenerateQRCode(params.id!, companyFilter);

      if (qrResult.error) {
        return errorResponse(qrResult.error);
      }

      return data({ success: true, error: undefined, errors: undefined });
    } catch (error) {
      return handleError(error);
    }
  }

  if (intent === "delete-image") {
    try {
      await deleteAssetImage(params.id!, companyFilter);
      return data({ success: true, error: undefined, errors: undefined });
    } catch (error) {
      return handleError(error);
    }
  }

  if (intent === "return") {
    const assignmentId = formData.get("assignmentId") as string;
    const notes = formData.get("notes") as string;

    if (!assignmentId) {
      return errorResponse("Assignment ID is required");
    }

    try {
      const result = await returnAssignment(assignmentId, notes || undefined);

      if (result.error) {
        return errorResponse(result.error);
      }

      return data({ success: true, error: undefined, errors: undefined });
    } catch (error) {
      return handleError(error);
    }
  }

  return null;
}

export default function AssetDetailPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, asset, userOptions } = loaderData;
  const typedAsset = asset as unknown as AssetDetail;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [category, setCategory] = useState(typedAsset.category || "");
  const [status, setStatus] = useState(typedAsset.status);
  const [ownershipType, setOwnershipType] = useState(typedAsset.ownershipType);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  const canEdit =
    user.role === "OWNER" ||
    user.role === "ADMIN" ||
    typedAsset.ownerId === user.id ||
    typedAsset.createdBy?.id === user.id;
  const activeAssignment = typedAsset.assignments.find((a) => a.status === ("ACTIVE" as AssignmentStatus));
  const canReturn = activeAssignment && (
    user.role === "OWNER" ||
    user.role === "ADMIN" ||
    activeAssignment.user.id === user.id
  );

  const getStatusBadge = (assetStatus: AssetStatus) => {
    return (
      <Badge className={ASSET_STATUS_COLORS[assetStatus]} variant="secondary">
        {ASSET_STATUS_LABELS[assetStatus]}
      </Badge>
    );
  };

  const getAssignmentStatusBadge = (assignmentStatus: AssignmentStatus) => {
    return (
      <Badge className={ASSIGNMENT_STATUS_COLORS[assignmentStatus]} variant="secondary">
        {ASSIGNMENT_STATUS_LABELS[assignmentStatus]}
      </Badge>
    );
  };

  const handleDownloadQR = () => {
    if (!typedAsset.qrCode) return;
    const link = document.createElement("a");
    link.href = typedAsset.qrCode;
    link.download = `qr-${typedAsset.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.role === "OWNER" || user.role === "ADMIN" ? (
            <Link to="/dashboard/assets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/dashboard/my-assets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">

              <h1 className="text-2xl md:text-3xl font-bold">{typedAsset.name}</h1>
              {getStatusBadge(typedAsset.status)}
            </div>
            <p className="text-muted-foreground text-sm md:text-base">
              {typedAsset.category ? typedAsset.category : "No category"} •
              Added {format(new Date(typedAsset.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-col md:flex-row gap-2">
            {typedAsset.status === "RETIRED" ? (
              <Form method="post">
                <input type="hidden" name="intent" value="restore" />
                <Button type="submit" variant="outline" className="w-full md:w-[180px]" disabled={isSubmitting}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Asset
                </Button>
              </Form>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>

                {canReturn && (
                  <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Return Asset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Return Asset</DialogTitle>
                        <DialogDescription>
                          Mark this asset as returned. It will become available for new assignments.
                        </DialogDescription>
                      </DialogHeader>
                      <Form method="post" className="space-y-4">
                        <input type="hidden" name="intent" value="return" />
                        <input type="hidden" name="assignmentId" value={activeAssignment.id} />
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

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Asset</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete "{typedAsset.name}"? This action can be undone by restoring the asset.
                      </DialogDescription>
                    </DialogHeader>
                    {activeAssignment && (
                      <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                        This asset is currently assigned to{" "}
                        {activeAssignment.user.firstName} {activeAssignment.user.lastName}.
                        Please return the asset before deleting.
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Form method="post" onSubmit={() => setDeleteDialogOpen(false)}>
                        <input type="hidden" name="intent" value="delete" />
                        <Button type="submit" variant="destructive" disabled={!!activeAssignment}>
                          Delete Asset
                        </Button>
                      </Form>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}

      </div>

      {/* Error/Success Messages */}
      {actionData?.error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && actionData.success && (
        <SuccessMessage message="Asset updated successfully!" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Asset Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="update" />

                  <FormField
                    label="Asset Name"
                    name="name"
                    defaultValue={typedAsset.name}
                    required
                    error={actionData && "errors" in actionData ? actionData.errors?.name : undefined}
                  />

                  <FormTextarea
                    label="Description"
                    name="description"
                    defaultValue={typedAsset.description || ""}
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Serial Number"
                      name="serialNumber"
                      defaultValue={typedAsset.serialNumber || ""}
                    />

                    <FormSelect
                      label="Category"
                      name="category"
                      value={category}
                      onValueChange={setCategory}
                      placeholder="Select category"
                      options={ASSET_CATEGORIES}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Model"
                      name="model"
                      defaultValue={typedAsset.model || ""}
                    />

                    <FormField
                      label="Manufacturer"
                      name="manufacturer"
                      defaultValue={typedAsset.manufacturer || ""}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                      label="Status"
                      name="status"
                      value={status}
                      onValueChange={(v) => setStatus(v as AssetStatus)}
                      options={[
                        { label: "Available", value: "AVAILABLE" },
                        { label: "Assigned", value: "ASSIGNED", disabled: !activeAssignment },
                        { label: "Under Maintenance", value: "UNDER_MAINTENANCE" },
                        { label: "Retired", value: "RETIRED" },
                      ]}
                    />

                    <FormSelect
                      label="Ownership Type"
                      name="ownershipType"
                      value={ownershipType}
                      onValueChange={(v) => setOwnershipType(v as OwnershipType)}
                      options={OWNERSHIP_TYPE_OPTIONS}
                    />
                  </div>

                  {ownershipType === "PRIVATE" && (
                    <FormSelect
                      label="Select Owner (User)"
                      name="ownerId"
                      defaultValue={typedAsset.ownerId || ""}
                      placeholder="Select user"
                      required
                      options={userOptions}
                      error={actionData && "errors" in actionData ? actionData.errors?.ownerId : undefined}
                    />
                  )}

                  {ownershipType === "OTHER" && (
                    <FormField
                      label="Ownership Details"
                      name="otherOwnership"
                      defaultValue={typedAsset.otherOwnership || ""}
                      placeholder="e.g., Leased from Company X"
                      required
                      error={actionData && "errors" in actionData ? actionData.errors?.otherOwnership : undefined}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Location"
                      name="location"
                      defaultValue={typedAsset.location || ""}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      label="Purchase Date"
                      name="purchaseDate"
                      type="date"
                      defaultValue={
                        typedAsset.purchaseDate
                          ? format(new Date(typedAsset.purchaseDate), "yyyy-MM-dd")
                          : ""
                      }
                    />

                    <FormField
                      label="Purchase Price"
                      name="purchasePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={typedAsset.purchasePrice || ""}
                    />

                    <FormField
                      label="Current Value"
                      name="currentValue"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={typedAsset.currentValue || ""}
                    />
                  </div>

                  <FormField
                    label="Tags (comma-separated)"
                    name="tags"
                    defaultValue={typedAsset.tags.join(", ")}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              ) : (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Description</dt>
                    <dd className="font-medium">{typedAsset.description || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Serial Number</dt>
                    <dd className="font-medium">{typedAsset.serialNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Model</dt>
                    <dd className="font-medium">{typedAsset.model || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Manufacturer</dt>
                    <dd className="font-medium">{typedAsset.manufacturer || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-medium">{typedAsset.location || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Company</dt>
                    <dd className="font-medium">{typedAsset.company?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Ownership Type</dt>
                    <dd className="font-medium">
                      {OWNERSHIP_TYPE_LABELS[typedAsset.ownershipType] || "—"}
                      {typedAsset.ownershipType === "PRIVATE" && typedAsset.owner && (
                        <span className="text-muted-foreground block text-xs">
                          Owner: {typedAsset.owner.firstName} {typedAsset.owner.lastName}
                        </span>
                      )}
                      {typedAsset.ownershipType === "OTHER" && typedAsset.otherOwnership && (
                        <span className="text-muted-foreground block text-xs">
                          {typedAsset.otherOwnership}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Purchase Date</dt>
                    <dd className="font-medium">
                      {typedAsset.purchaseDate
                        ? format(new Date(typedAsset.purchaseDate), "MMM d, yyyy")
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Purchase Price</dt>
                    <dd className="font-medium">
                      {typedAsset.purchasePrice
                        ? `${typedAsset.purchasePrice.toLocaleString()}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Current Value</dt>
                    <dd className="font-medium">
                      {typedAsset.currentValue
                        ? `${typedAsset.currentValue.toLocaleString()}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tags</dt>
                    <dd className="font-medium">
                      {typedAsset.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {typedAsset.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Created By</dt>
                    <dd className="font-medium">
                      {typedAsset.createdBy
                        ? `${typedAsset.createdBy.firstName} ${typedAsset.createdBy.lastName}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Last Updated</dt>
                    <dd className="font-medium">
                      {format(new Date(typedAsset.updatedAt), "MMM d, yyyy HH:mm")}
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Assignment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Assignment History
              </CardTitle>
              <CardDescription>
                Recent assignment history for this asset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {typedAsset.assignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No assignment history
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Returned Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typedAsset.assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {assignment.user.firstName} {assignment.user.lastName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getAssignmentStatusBadge(assignment.status)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(assignment.assignedDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {assignment.returnDate
                            ? format(new Date(assignment.returnDate), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {assignment.returnDate
                            ? formatDuration(assignment.assignedDate, assignment.returnDate)
                            : formatDuration(assignment.assignedDate, new Date()) + " (ongoing)"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {assignment.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Asset Image */}
          <div>
            <h3 className="text-sm font-medium mb-2">Asset Image</h3>
            <ImageUpload
              assetId={typedAsset.id}
              currentImageUrl={typedAsset.imageUrl}
              canEdit={canEdit}
            />
          </div>

          {/* Current Assignment */}
          {activeAssignment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  Currently Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {activeAssignment.user.firstName} {activeAssignment.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeAssignment.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Since {format(new Date(activeAssignment.assignedDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
              <CardDescription>
                Scan to quickly access this asset
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {typedAsset.qrCode ? (
                <>
                  <img
                    src={typedAsset.qrCode}
                    alt={`QR Code for ${typedAsset.name}`}
                    className="w-48 h-48 border rounded-md"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {canEdit && (
                      <Form method="post">
                        <input type="hidden" name="intent" value="regenerate-qr" />
                        <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </Form>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-48 h-48 border rounded-md flex items-center justify-center bg-muted">
                    <QrCode className="h-12 w-12 text-muted-foreground" />
                  </div>
                  {canEdit && (
                    <Form method="post">
                      <input type="hidden" name="intent" value="regenerate-qr" />
                      <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                        Generate QR Code
                      </Button>
                    </Form>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
