import type { Route } from "./+types/_dashboard.profile";
import { data, Form, useNavigation } from "react-router";
import { requireAuth } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { hashPassword, verifyPassword } from "~/lib/auth.server";
import { updateProfileSchema } from "~/validators/user.validator";
import { changePasswordSchema } from "~/validators/auth.validator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

export function meta() {
  return [
    { title: "Profile - Asset Management" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  return { user };
}

interface ActionResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  intent?: string;
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "updateProfile") {
    const rawData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
    };

    const result = updateProfileSchema.safeParse(rawData);
    if (!result.success) {
      return data<ActionResponse>({
        errors: result.error.flatten().fieldErrors,
        intent,
      }, { status: 400 });
    }

    // Check if email is taken by another user
    if (result.data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: result.data.email },
      });
      if (existingUser) {
        return data<ActionResponse>({
          errors: { email: ["This email is already taken"] },
          intent,
        }, { status: 400 });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: result.data,
    });

    return data<ActionResponse>({
      success: true,
      message: "Profile updated successfully",
      intent,
    });
  }

  if (intent === "changePassword") {
    const rawData = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const result = changePasswordSchema.safeParse(rawData);
    if (!result.success) {
      return data<ActionResponse>({
        errors: result.error.flatten().fieldErrors,
        intent,
      }, { status: 400 });
    }

    // Verify current password
    const isValid = await verifyPassword(result.data.currentPassword, user.password);
    if (!isValid) {
      return data<ActionResponse>({
        errors: { currentPassword: ["Current password is incorrect"] },
        intent,
      }, { status: 400 });
    }

    // Update password
    const hashedPassword = await hashPassword(result.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return data<ActionResponse>({
      success: true,
      message: "Password changed successfully",
      intent,
    });
  }

  return data<ActionResponse>({ errors: { _form: ["Invalid action"] } }, { status: 400 });
}

export default function ProfilePage({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const profileSuccess = actionData?.intent === "updateProfile" && actionData?.success;
  const passwordSuccess = actionData?.intent === "changePassword" && actionData?.success;
  const profileErrors = actionData?.intent === "updateProfile" ? actionData?.errors : undefined;
  const passwordErrors = actionData?.intent === "changePassword" ? actionData?.errors : undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="updateProfile" />
            
            {profileSuccess && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                {actionData?.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={user.firstName}
                  required
                />
                {profileErrors?.firstName && (
                  <p className="text-sm text-red-500">{profileErrors.firstName[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={user.lastName}
                  required
                />
                {profileErrors?.lastName && (
                  <p className="text-sm text-red-500">{profileErrors.lastName[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
              />
              {profileErrors?.email && (
                <p className="text-sm text-red-500">{profileErrors.email[0]}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="changePassword" />
            
            {passwordSuccess && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                {actionData?.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
              {passwordErrors?.currentPassword && (
                <p className="text-sm text-red-500">{passwordErrors.currentPassword[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
              />
              {passwordErrors?.newPassword && (
                <p className="text-sm text-red-500">{passwordErrors.newPassword[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
              {passwordErrors?.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword[0]}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Changing..." : "Change password"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
