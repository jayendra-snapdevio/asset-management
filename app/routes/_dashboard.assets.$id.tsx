import { useState } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.assets.$id";
import { requireRole, requireAuth } from "~/lib/session.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { handleError, errorResponse } from "~/lib/errors.server";
import { getAssetById, updateAsset, deleteAsset, restoreAsset, regenerateQRCode } from "~/services/asset.service.server";
import { updateAssetSchema } from "~/validators/asset.validator";
import { prisma } from "~/lib/db.server";
import { unlink } from "fs/promises";
import { join } from "path";
import type { AssetStatus, AssignmentStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import { ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_CATEGORIES, ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS } from "~/constants";
import { format } from "date-fns";
import { ImageUpload } from "~/components/assets/ImageUpload";
import { formatDuration } from "~/lib/utils";

type AssetWithRelations = {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  category: string | null;
  status: AssetStatus;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  currentValue: number | null;
  location: string | null;
  tags: string[];
  qrCode: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; firstName: string; lastName: string; email: string } | null;
  company: { id: string; name: string } | null;
  assignments: {
    id: string;
    status: AssignmentStatus;
    assignedDate: Date;
    returnDate: Date | null;
    dueDate: Date | null;
    notes: string | null;
    user: { id: string; firstName: string; lastName: string; email: string };
  }[];
};

export function meta({ data }: Route.MetaArgs) {
  const assetName = data?.asset?.name || "Asset";
  return [{ title: `${assetName} - Asset Management` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const companyFilter = await getCompanyFilter(user);

  const asset = await getAssetById(params.id!, companyFilter);

  if (!asset) {
    throw redirect("/dashboard/assets");
  }

  return { user, asset };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const companyFilter = await getCompanyFilter(user);
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
    const asset = await prisma.asset.findUnique({ where: { id: params.id } });
    if (asset?.imageUrl) {
      try {
        await unlink(join(process.cwd(), "public", asset.imageUrl));
      } catch {
        // Ignore if file doesn't exist
      }
      await prisma.asset.update({
        where: { id: params.id },
        data: { imageUrl: null },
      });
    }
    return data({ success: true, error: undefined, errors: undefined });
  }

  return null;
}

export default function AssetDetailPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, asset } = loaderData;
  const typedAsset = asset as AssetWithRelations;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [category, setCategory] = useState(typedAsset.category || "");
  const [status, setStatus] = useState(typedAsset.status);

  const canEdit = user.role === "OWNER" || user.role === "ADMIN";
  const activeAssignment = typedAsset.assignments.find((a) => a.status === "ACTIVE");

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{typedAsset.name}</h1>
              {getStatusBadge(typedAsset.status)}
            </div>
            <p className="text-muted-foreground">
              {typedAsset.category ? typedAsset.category : "No category"} • 
              Added {format(new Date(typedAsset.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {typedAsset.status === "RETIRED" ? (
              <Form method="post">
                <input type="hidden" name="intent" value="restore" />
                <Button type="submit" variant="outline" disabled={isSubmitting}>
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
        <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
          Asset updated successfully!
        </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="name">Asset Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={typedAsset.name}
                      required
                    />
                    {actionData && "errors" in actionData && actionData.errors?.name && (
                      <p className="text-sm text-destructive">{actionData.errors.name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={typedAsset.description || ""}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        name="serialNumber"
                        defaultValue={typedAsset.serialNumber || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="category" value={category} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        name="model"
                        defaultValue={typedAsset.model || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        name="manufacturer"
                        defaultValue={typedAsset.manufacturer || ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as AssetStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="ASSIGNED" disabled={!activeAssignment}>
                            Assigned
                          </SelectItem>
                          <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="status" value={status} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        defaultValue={typedAsset.location || ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input
                        id="purchaseDate"
                        name="purchaseDate"
                        type="date"
                        defaultValue={
                          typedAsset.purchaseDate
                            ? format(new Date(typedAsset.purchaseDate), "yyyy-MM-dd")
                            : ""
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                      <Input
                        id="purchasePrice"
                        name="purchasePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={typedAsset.purchasePrice || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentValue">Current Value ($)</Label>
                      <Input
                        id="currentValue"
                        name="currentValue"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={typedAsset.currentValue || ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      defaultValue={typedAsset.tags.join(", ")}
                    />
                  </div>

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
                        ? `$${typedAsset.purchasePrice.toLocaleString()}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Current Value</dt>
                    <dd className="font-medium">
                      {typedAsset.currentValue
                        ? `$${typedAsset.currentValue.toLocaleString()}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tags</dt>
                    <dd className="font-medium">
                      {typedAsset.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {typedAsset.tags.map((tag) => (
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
