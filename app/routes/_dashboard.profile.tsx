import type { Route } from "./+types/_dashboard.profile";
import { data, Form, useNavigation } from "react-router";
import { requireAuth } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { hashPassword, verifyPassword } from "~/lib/auth.server";
import { updateProfileSchema } from "~/validators/user.validator";
import { changePasswordSchema } from "~/validators/auth.validator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/forms/form-field";
import { PasswordToggleField } from "~/components/forms/password-input";
import { SuccessMessage } from "~/components/ui/success-message";
export function meta() {
  return [{ title: "Profile - Asset Management" }];
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
      return data<ActionResponse>(
        {
          errors: result.error.flatten().fieldErrors,
          intent,
        },
        { status: 400 },
      );
    }

    // Check if email is taken by another user
    if (result.data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: result.data.email },
      });
      if (existingUser) {
        return data<ActionResponse>(
          {
            errors: { email: ["This email is already taken"] },
            intent,
          },
          { status: 400 },
        );
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
      return data<ActionResponse>(
        {
          errors: result.error.flatten().fieldErrors,
          intent,
        },
        { status: 400 },
      );
    }

    // Verify current password
    const isValid = await verifyPassword(
      result.data.currentPassword,
      user.password,
    );
    if (!isValid) {
      return data<ActionResponse>(
        {
          errors: { currentPassword: ["Current password is incorrect"] },
          intent,
        },
        { status: 400 },
      );
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

  return data<ActionResponse>(
    { errors: { _form: ["Invalid action"] } },
    { status: 400 },
  );
}

export default function ProfilePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user } = loaderData;
  const navigation = useNavigation();
  const isProfileSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "updateProfile";
  const isPasswordSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "changePassword";

  const profileSuccess =
    actionData?.intent === "updateProfile" && actionData?.success;
  const passwordSuccess =
    actionData?.intent === "changePassword" && actionData?.success;
  const profileErrors =
    actionData?.intent === "updateProfile" ? actionData?.errors : undefined;
  const passwordErrors =
    actionData?.intent === "changePassword" ? actionData?.errors : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row items-start">
        {/* Profile Information */}
        <div className="w-full lg:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="updateProfile" />

                {profileSuccess && (
                  <SuccessMessage message={actionData?.message} />
                )}

                <FormField
                  label="First name"
                  name="firstName"
                  defaultValue={user.firstName}
                  required
                  error={profileErrors?.firstName}
                />

                <FormField
                  label="Last name"
                  name="lastName"
                  defaultValue={user.lastName}
                  required
                  error={profileErrors?.lastName}
                />

                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  error={profileErrors?.email}
                />

                <Button type="submit" disabled={isProfileSubmitting}>
                  {isProfileSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Change Password */}
        <div className="w-full lg:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="changePassword" />

                {passwordSuccess && (
                  <SuccessMessage message={actionData?.message} />
                )}

                <PasswordToggleField
                  name="currentPassword"
                  label="Current password"
                  errors={passwordErrors?.currentPassword}
                />

                <PasswordToggleField
                  name="newPassword"
                  label="New password"
                  errors={passwordErrors?.newPassword}
                />

                <PasswordToggleField
                  name="confirmPassword"
                  label="Confirm new password"
                  errors={passwordErrors?.confirmPassword}
                />

                <Button type="submit" disabled={isPasswordSubmitting}>
                  {isPasswordSubmitting ? "Changing..." : "Change password"}
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
