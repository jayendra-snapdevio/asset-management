import { data, Form, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.settings";
import { requireRole } from "~/lib/session.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { prisma } from "~/lib/db.server";
import { handleError, errorResponse } from "~/lib/errors.server";
import { updateCompanySchema } from "~/validators/company.validator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Building2,
  Settings,
  Mail,
  Phone,
  Globe,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatDate } from "~/lib/date";

export function meta() {
  return [{ title: "Company Settings - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const companyFilter = await getCompanyFilter(user);

  if (!user.companyId) {
    return { user, company: null };
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    include: {
      _count: {
        select: {
          users: true,
          assets: true,
        },
      },
    },
  });

  return { user, company };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);

  if (!user.companyId) {
    return errorResponse("You must be associated with a company", 400);
  }

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Add id for validation
  const dataWithId = { ...rawData, id: user.companyId };
  const result = updateCompanySchema.safeParse(dataWithId);

  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors, success: false },
      { status: 400 }
    );
  }

  try {
    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        name: result.data.name,
        email: result.data.email || null,
        phone: result.data.phone || null,
        website: result.data.website || null,
        address: result.data.address || null,
        description: result.data.description || null,
      },
    });

    return data({ success: true, message: "Settings saved successfully!" });
  } catch (error) {
    return handleError(error);
  }
}

export default function SettingsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, company } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (!company) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your company settings</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not associated with any company. Please contact an administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your company settings</p>
      </div>

      {/* Success/Error Messages */}
      {actionData && "success" in actionData && actionData.success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {"message" in actionData ? actionData.message : "Settings saved successfully!"}
          </AlertDescription>
        </Alert>
      )}
      {actionData && "error" in actionData && actionData.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {/* Company Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.name}</div>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(company.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.users}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company._count.assets}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company's profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Company Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={company.name}
                  required
                />
                {actionData && "errors" in actionData && actionData.errors?.name && (
                  <p className="text-sm text-destructive">{actionData.errors.name[0]}</p>
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
                  defaultValue={company.email || ""}
                />
                {actionData && "errors" in actionData && actionData.errors?.email && (
                  <p className="text-sm text-destructive">{actionData.errors.email[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={company.phone || ""}
                />
                {actionData && "errors" in actionData && actionData.errors?.phone && (
                  <p className="text-sm text-destructive">{actionData.errors.phone[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Website
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={company.website || ""}
                />
                {actionData && "errors" in actionData && actionData.errors?.website && (
                  <p className="text-sm text-destructive">{actionData.errors.website[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="h-4 w-4 inline mr-1" />
                Address
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={company.address || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={company.description || ""}
                rows={3}
                placeholder="Brief description of your company..."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
