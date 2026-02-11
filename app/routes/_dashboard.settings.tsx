import { data, Form, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.settings";
import { requireRole } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { handleError, errorResponse } from "~/lib/errors.server";
import { updateCompanySchema } from "~/validators/company.validator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/forms/form-field";
import { FormTextarea } from "~/components/forms/form-textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { getTheme, setTheme, type Theme } from "~/lib/theme.server";
import {
  Building2,
  Settings,
  Save,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { formatDate } from "~/lib/date";
import { SuccessMessage } from "~/components/ui/success-message";

export function meta() {
  return [{ title: "Settings - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN", "USER"]);
  const theme = await getTheme(request);

  if (!user.companyId || user.role === "USER") {
    return { user, company: null, theme };
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

  return { user, company, theme };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN", "USER"]);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "theme") {
    const theme = formData.get("theme") as Theme;
    return data(
      { success: true, message: "Theme updated successfully!" },
      {
        headers: {
          "Set-Cookie": await setTheme(theme),
        },
      }
    );
  }

  if (user.role === "USER") {
    return errorResponse("You don't have permission to update company settings", 403);
  }

  if (!user.companyId) {
    return errorResponse("You must be associated with a company", 400);
  }

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
  const { user, company, theme } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const themes: { value: Theme; label: string; icon: any }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your application preferences and company settings</p>
      </div>

      {/* Success/Error Messages */}
      {actionData && "success" in actionData && actionData.success && (
        <SuccessMessage
          message={
            "message" in actionData
              ? actionData.message
              : "Settings saved successfully!"
          }
        />
      )}
      {actionData && "error" in actionData && actionData.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose how Asset Management looks to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((t) => (
              <Form key={t.value} method="post">
                <input type="hidden" name="intent" value="theme" />
                <input type="hidden" name="theme" value={t.value} />
                <button
                  type="submit"
                  className={`w-full flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary/50 text-left ${
                    theme === t.value
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <t.icon className={`h-8 w-8 mb-2 ${theme === t.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-medium ${theme === t.value ? "text-primary" : "text-foreground"}`}>
                    {t.label}
                  </span>
                  {theme === t.value && (
                    <span className="text-xs text-primary mt-1">Current Theme</span>
                  )}
                </button>
              </Form>
            ))}
          </div>
        </CardContent>
      </Card>

      {company && (
        <>
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
                  <FormField
                    label="Company Name"
                    name="name"
                    defaultValue={company.name}
                    required
                    error={actionData && "errors" in actionData ? actionData.errors?.name : undefined}
                  />

                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={company.email || ""}
                    error={actionData && "errors" in actionData ? actionData.errors?.email : undefined}
                  />

                  <FormField
                    label="Phone"
                    name="phone"
                    defaultValue={company.phone || ""}
                    error={actionData && "errors" in actionData ? actionData.errors?.phone : undefined}
                  />

                  <FormField
                    label="Website"
                    name="website"
                    type="url"
                    defaultValue={company.website || ""}
                    error={actionData && "errors" in actionData ? actionData.errors?.website : undefined}
                  />
                </div>

                <FormField
                  label="Address"
                  name="address"
                  defaultValue={company.address || ""}
                />

                <FormTextarea
                  label="Description"
                  name="description"
                  defaultValue={company.description || ""}
                  rows={3}
                  placeholder="Brief description of your company..."
                />

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
        </>
      )}

      {!company && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not associated with any company. Please contact an administrator.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
