import { useState, useEffect } from "react";
import { toast } from "sonner";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.assets.new";
import { requireRole } from "~/lib/session.server";
import { createAsset } from "~/services/asset.service.server";
import { getCompaniesByOwner } from "~/services/company.service.server";
import { createAssetSchema } from "~/validators/asset.validator";
import { prisma } from "~/lib/db.server";
import { uploadFile } from "~/lib/upload.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/forms/form-field";
import { FormTextarea } from "~/components/forms/form-textarea";
import { FormSelect } from "~/components/forms/form-select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ASSET_CATEGORIES, OWNERSHIP_TYPE_OPTIONS } from "~/constants";
import { getUsers } from "~/services/user.service.server";

export function meta() {
  return [{ title: "Add New Asset - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);

  // For OWNER, get all their companies so they can select one
  let companies: { id: string; name: string }[] = [];
  if (user.role === "OWNER") {
    const result = await getCompaniesByOwner(user.id, {
      page: 1,
      limit: 100,
      search: "",
    });
    companies = result.companies.map((c) => ({ id: c.id, name: c.name }));
  } else if (user.companyId) {
    // For ADMIN, just get their company name
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, name: true },
    });
    if (company) {
      companies = [company];
    }
  }

  // Fetch users for PRIVATE ownership type selection
  const { users } = await getUsers(user, { page: 1, limit: 1000 });
  const userOptions = users.map((u) => ({
    label: `${u.firstName} ${u.lastName} (${u.email})`,
    value: u.id,
  }));

  return { user, companies, userOptions };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);

  const formData = await request.formData();

  const file = formData.get("image") as File | null;
  let imageUrl: string | undefined = undefined;

  if (file && file.size > 0 && file.name) {
    const uploadResult = await uploadFile(file, "assets");
    if (!uploadResult.success) {
      return data(
        { error: uploadResult.error, errors: undefined },
        { status: 400 },
      );
    }
    imageUrl = uploadResult.url;
  }

  const rawData = Object.fromEntries(formData);

  // Get companyId from form (for OWNER) or from user (for ADMIN)
  let companyId = user.companyId;

  if (user.role === "OWNER") {
    const selectedCompanyId = formData.get("companyId") as string;
    if (!selectedCompanyId) {
      return data(
        {
          error: "Please select a company to create the asset for",
          errors: undefined,
        },
        { status: 400 },
      );
    }
    // Verify the owner actually owns this company
    const company = await prisma.company.findFirst({
      where: { id: selectedCompanyId, ownerId: user.id },
    });
    if (!company) {
      return data(
        {
          error: "You don't have permission to create assets for this company",
          errors: undefined,
        },
        { status: 403 },
      );
    }
    companyId = selectedCompanyId;
  }

  if (!companyId) {
    return data(
      {
        error: "You must be associated with a company to create assets",
        errors: undefined,
      },
      { status: 400 },
    );
  }

  // Add companyId for validation
  const dataWithCompany = {
    ...rawData,
    companyId,
    imageUrl,
  };

  const validationResult = createAssetSchema.safeParse(dataWithCompany);

  if (!validationResult.success) {
    return data(
      {
        errors: validationResult.error.flatten().fieldErrors,
        error: undefined,
      },
      { status: 400 },
    );
  }

  const result = await createAsset(
    {
      name: validationResult.data.name,
      description: validationResult.data.description,
      serialNumber: validationResult.data.serialNumber,
      model: validationResult.data.model,
      manufacturer: validationResult.data.manufacturer,
      purchaseDate: validationResult.data.purchaseDate,
      purchasePrice: validationResult.data.purchasePrice,
      currentValue: validationResult.data.currentValue,
      location: validationResult.data.location,
      category: validationResult.data.category,
      tags: validationResult.data.tags,
      imageUrl: validationResult.data.imageUrl,
      ownershipType: validationResult.data.ownershipType,
      ownerId: validationResult.data.ownerId,
      otherOwnership: validationResult.data.otherOwnership,
    },
    companyId,
    user.id,
  );

  if (result.error) {
    return data({ error: result.error, errors: undefined }, { status: 400 });
  }

  return redirect(`/dashboard/assets/${result.asset!.id}`);
}

export default function NewAssetPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user, companies, userOptions } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [category, setCategory] = useState<string>("");
  const [ownershipType, setOwnershipType] = useState<string>("COMPANY");
  const [selectedCompany, setSelectedCompany] = useState<string>(
    companies.length === 1 ? companies[0].id : "",
  );

  useEffect(() => {
    if (actionData && actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/assets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Asset</h1>
          <p className="text-muted-foreground">
            Create a new asset in the system
          </p>
        </div>
      </div>

      {companies.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You need to create a company first before adding assets.
              </p>
              <Link to="/dashboard/companies">
                <Button>Create Company</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
            <CardDescription>
              Fill in the information about the new asset. A QR code will be
              generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              method="post"
              encType="multipart/form-data"
              className="space-y-6"
            >
              {/* Company Selector (for OWNER with multiple companies) */}
              {user.role === "OWNER" && companies.length > 1 && (
                <FormSelect
                  label="Company"
                  name="companyId"
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                  placeholder="Select a company"
                  required
                  options={companies.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              )}

              {/* Hidden companyId for single company or admin */}
              {!(user.role === "OWNER" && companies.length > 1) && (
                <input
                  type="hidden"
                  name="companyId"
                  value={companies[0]?.id || ""}
                />
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Asset Name"
                    name="name"
                    placeholder="e.g., MacBook Pro 16-inch"
                    required
                    error={actionData?.errors?.name}
                  />

                  <FormField
                    label="Asset Image"
                    name="image"
                    type="file"
                    accept="image/*"
                    helperText="Optional. Max 5MB. Formats: JPG, PNG, GIF, WebP."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Serial Number"
                    name="serialNumber"
                    placeholder="e.g., ABC123XYZ"
                    error={actionData?.errors?.serialNumber}
                  />

                  <FormSelect
                    label="Category"
                    name="category"
                    value={category}
                    onValueChange={setCategory}
                    placeholder="Select category"
                    options={ASSET_CATEGORIES}
                    error={actionData?.errors?.category}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label="Ownership Type"
                    name="ownershipType"
                    value={ownershipType}
                    onValueChange={setOwnershipType}
                    placeholder="Select ownership type"
                    required
                    options={OWNERSHIP_TYPE_OPTIONS}
                    error={actionData?.errors?.ownershipType}
                  />

                  {ownershipType === "PRIVATE" && (
                    <FormSelect
                      label="Select Owner (User)"
                      name="ownerId"
                      placeholder="Select user"
                      required
                      options={userOptions}
                      error={actionData?.errors?.ownerId}
                    />
                  )}

                  {ownershipType === "OTHER" && (
                    <FormField
                      label="Ownership Details"
                      name="otherOwnership"
                      placeholder="e.g., Leased from Company X"
                      required
                      error={actionData?.errors?.otherOwnership}
                    />
                  )}

                  <FormField
                    label="Tags (comma-separated)"
                    name="tags"
                    placeholder="e.g., laptop, work, developer"
                    helperText="Add tags to help organize and search for assets"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Model"
                    name="model"
                    placeholder="e.g., MBP16-2023"
                    error={actionData?.errors?.model}
                  />

                  <FormField
                    label="Manufacturer"
                    name="manufacturer"
                    placeholder="e.g., Apple"
                    error={actionData?.errors?.manufacturer}
                  />
                </div>
              </div>

              {/* Purchase Info */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Purchase Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Purchase Date"
                    name="purchaseDate"
                    type="date"
                    error={actionData?.errors?.purchaseDate}
                  />

                  <FormField
                    label="Purchase Price"
                    name="purchasePrice"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="00"
                    error={actionData?.errors?.purchasePrice}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Current Value"
                    name="currentValue"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="00"
                    error={actionData?.errors?.currentValue}
                  />

                  <FormField
                    label="Location"
                    name="location"
                    placeholder="e.g., Main Office, Floor 2"
                    error={actionData?.errors?.location}
                  />
                </div>
              </div>

              <FormTextarea
                label="Description"
                name="description"
                placeholder="Describe the asset..."
                rows={3}
                error={actionData?.errors?.description}
              />

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Link to="/dashboard/assets">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Asset"
                  )}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
