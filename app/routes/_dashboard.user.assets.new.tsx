import { useState } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.user.assets.new";
import { requireRole } from "~/lib/session.server";
import { createAsset } from "~/services/asset.service.server";
import { createAssetSchema } from "~/validators/asset.validator";
import { uploadFile } from "~/lib/upload.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
  const user = await requireRole(request, ["USER"]);
  
  if (!user.companyId) {
    throw new Response("You must be associated with a company to create assets", { status: 403 });
  }
  
  const { users } = await getUsers(user, { page: 1, limit: 1000 });
  const userOptions = users.map(u => ({ label: `${u.firstName} ${u.lastName} (${u.email})`, value: u.id }));

  return { user, userOptions };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["USER"]);

  if (!user.companyId) {
    return data(
      { error: "You must be associated with a company to create assets", errors: undefined },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  
  const file = formData.get("image") as File | null;
  let imageUrl: string | undefined = undefined;

  if (file && file.size > 0 && file.name) {
    const uploadResult = await uploadFile(file, "assets");
    if (!uploadResult.success) {
      return data(
        { error: uploadResult.error, errors: undefined },
        { status: 400 }
      );
    }
    imageUrl = uploadResult.url;
  }

  const rawData = Object.fromEntries(formData);
  
  // Add companyId for validation
  const dataWithCompany = { 
    ...rawData, 
    companyId: user.companyId,
    imageUrl 
  };
  
  const validationResult = createAssetSchema.safeParse(dataWithCompany);
  
  if (!validationResult.success) {
    return data(
      { errors: validationResult.error.flatten().fieldErrors, error: undefined },
      { status: 400 }
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
    user.companyId,
    user.id
  );

  if (result.error) {
    return data(
      { error: result.error, errors: undefined },
      { status: 400 }
    );
  }

  return redirect(`/dashboard/assets/${result.asset!.id}`);
}

export default function NewUserAssetPage({ loaderData, actionData }: Route.ComponentProps) {
  const { userOptions } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [category, setCategory] = useState<string>("");
  const [ownershipType, setOwnershipType] = useState<string>("COMPANY");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/my-assets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Asset</h1>
          <p className="text-muted-foreground">
            Create a new asset to track in your organization
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>
            Fill in the information about the new asset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" encType="multipart/form-data" className="space-y-6">
            {actionData?.error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {actionData.error}
              </div>
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
              <Link to="/dashboard/my-assets">
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
    </div>
  );
}
