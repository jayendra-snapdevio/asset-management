import { useState } from "react";
import { data, redirect, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.assets.new";
import { requireRole } from "~/lib/session.server";
import { createAsset } from "~/services/asset.service.server";
import { getCompaniesByOwner } from "~/services/company.service.server";
import { createAssetSchema } from "~/validators/asset.validator";
import { prisma } from "~/lib/db.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ASSET_CATEGORIES } from "~/constants";

export function meta() {
  return [{ title: "Add New Asset - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  
  // For OWNER, get all their companies so they can select one
  let companies: { id: string; name: string }[] = [];
  if (user.role === "OWNER") {
    const result = await getCompaniesByOwner(user.id, { page: 1, limit: 100, search: "" });
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
  
  return { user, companies };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);
  
  // Get companyId from form (for OWNER) or from user (for ADMIN)
  let companyId = user.companyId;
  
  if (user.role === "OWNER") {
    const selectedCompanyId = formData.get("companyId") as string;
    if (!selectedCompanyId) {
      return data(
        { error: "Please select a company to create the asset for", errors: undefined },
        { status: 400 }
      );
    }
    // Verify the owner actually owns this company
    const company = await prisma.company.findFirst({
      where: { id: selectedCompanyId, ownerId: user.id },
    });
    if (!company) {
      return data(
        { error: "You don't have permission to create assets for this company", errors: undefined },
        { status: 403 }
      );
    }
    companyId = selectedCompanyId;
  }

  if (!companyId) {
    return data(
      { error: "You must be associated with a company to create assets", errors: undefined },
      { status: 400 }
    );
  }

  // Add companyId for validation
  const dataWithCompany = { ...rawData, companyId };
  const result = createAssetSchema.safeParse(dataWithCompany);

  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors, error: undefined },
      { status: 400 }
    );
  }

  const asset = await createAsset(
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
      category: result.data.category,
      tags: result.data.tags,
    },
    companyId,
    user.id
  );

  return redirect(`/dashboard/assets/${asset.id}`);
}

export default function NewAssetPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, companies } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [category, setCategory] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>(
    companies.length === 1 ? companies[0].id : ""
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/assets">
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
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
            <CardDescription>
              Fill in the information about the new asset. A QR code will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-6">
              {actionData?.error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {actionData.error}
                </div>
              )}

              {/* Company Selector (for OWNER with multiple companies) */}
              {user.role === "OWNER" && companies.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="companyId">Company *</Label>
                  <Select
                    value={selectedCompany}
                    onValueChange={setSelectedCompany}
                    name="companyId"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="companyId" value={selectedCompany} />
                </div>
              )}

              {/* Hidden companyId for single company */}
              {(user.role !== "OWNER" || companies.length === 1) && (
                <input type="hidden" name="companyId" value={companies[0]?.id || ""} />
              )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., MacBook Pro 16-inch"
                  required
                />
                {actionData?.errors?.name && (
                  <p className="text-sm text-destructive">{actionData.errors.name[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the asset..."
                  rows={3}
                />
                {actionData?.errors?.description && (
                  <p className="text-sm text-destructive">{actionData.errors.description[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    placeholder="e.g., ABC123XYZ"
                  />
                  {actionData?.errors?.serialNumber && (
                    <p className="text-sm text-destructive">{actionData.errors.serialNumber[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    name="category"
                  >
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
                  {/* Hidden input to ensure value is submitted */}
                  <input type="hidden" name="category" value={category} />
                  {actionData?.errors?.category && (
                    <p className="text-sm text-destructive">{actionData.errors.category[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="e.g., MBP16-2023"
                  />
                  {actionData?.errors?.model && (
                    <p className="text-sm text-destructive">{actionData.errors.model[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    placeholder="e.g., Apple"
                  />
                  {actionData?.errors?.manufacturer && (
                    <p className="text-sm text-destructive">{actionData.errors.manufacturer[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Purchase Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                  />
                  {actionData?.errors?.purchaseDate && (
                    <p className="text-sm text-destructive">{actionData.errors.purchaseDate[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  {actionData?.errors?.purchasePrice && (
                    <p className="text-sm text-destructive">{actionData.errors.purchasePrice[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentValue">Current Value ($)</Label>
                  <Input
                    id="currentValue"
                    name="currentValue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  {actionData?.errors?.currentValue && (
                    <p className="text-sm text-destructive">{actionData.errors.currentValue[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., Main Office, Floor 2"
                  />
                  {actionData?.errors?.location && (
                    <p className="text-sm text-destructive">{actionData.errors.location[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g., laptop, work, developer"
              />
              <p className="text-xs text-muted-foreground">
                Add tags to help organize and search for assets
              </p>
            </div>

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
