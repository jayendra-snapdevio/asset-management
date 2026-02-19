import { redirect, data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_auth.reset-password";
import { hashPassword } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function meta() {
  return [
    { title: "Reset Password - Asset Management" },
    { name: "description", content: "Set a new password" },
  ];
}

interface LoaderResponse {
  error?: string;
  token?: string;
  valid?: boolean;
}

interface ActionResponse {
  error?: string;
  errors?: Record<string, string[]>;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return data<LoaderResponse>({ error: "Invalid or missing reset token" });
  }

  // Check if token is valid
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return data<LoaderResponse>({
      error: "Reset token is invalid or has expired",
    });
  }

  return data<LoaderResponse>({ token, valid: true });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Validate with Zod
  const result = resetPasswordSchema.safeParse(rawData);
  if (!result.success) {
    return data<ActionResponse>(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { token, password } = result.data;

  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return data<ActionResponse>(
      { error: "Reset token is invalid or has expired" },
      { status: 400 },
    );
  }

  // Update password and clear reset token
  const hashedPassword = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return redirect("/login?reset=success");
}

export default function ResetPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const loaderError = loaderData?.error as string | undefined;
  const token = loaderData?.token as string | undefined;
  const actionError = actionData?.error as string | undefined;
  const errors = actionData?.errors as Record<string, string[]> | undefined;

  // Show error if token is invalid
  if (loaderError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>{loaderError}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/forgot-password" className="w-full">
            <Button className="w-full">Request a new link</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <Form method="post">
        <input type="hidden" name="token" value={token || ""} />
        <CardContent className="space-y-4">
          {actionError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {actionError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            {errors?.password && (
              <p className="text-sm text-red-500">{errors.password[0]}</p>
            )}
            <p className="text-xs text-muted-foreground">
              At least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            {errors?.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
          <Link
            to="/login"
            className="text-sm text-center text-primary hover:underline"
          >
            Back to login
          </Link>
        </CardFooter>
      </Form>
    </Card>
  );
}
