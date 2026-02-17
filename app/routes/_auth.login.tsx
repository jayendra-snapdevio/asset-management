import { redirect, data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_auth.login";
import { verifyPassword, createToken } from "~/lib/auth.server";
import { createSession, getCurrentUser } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { loginSchema } from "~/validators/auth.validator";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/forms/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PasswordToggleField } from "~/components/forms/password-input";

export function meta() {
  return [
    { title: "Login - Asset Management" },
    { name: "description", content: "Sign in to your account" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Redirect if already logged in
  const user = await getCurrentUser(request);
  if (user) {
    return redirect(
      user.role === "USER" ? "/dashboard/my-assets" : "/dashboard",
    );
  }
  return null;
}

interface ActionResponse {
  error?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, unknown>;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Validate with Zod
  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    return data<ActionResponse>(
      { errors: result.error.flatten().fieldErrors, values: rawData },
      { status: 400 },
    );
  }

  const { email: rawEmail, password } = result.data;
  const email = rawEmail.toLowerCase().trim();

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return data<ActionResponse>(
      { error: "Invalid email or password", values: rawData },
      { status: 401 },
    );
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.password);
  if (!validPassword) {
    return data<ActionResponse>(
      { error: "Invalid email or password", values: rawData },
      { status: 401 },
    );
  }

  // Check if active
  if (!user.isActive) {
    return data<ActionResponse>(
      {
        error: "Your account has been deactivated. Please contact support.",
        values: rawData,
      },
      { status: 403 },
    );
  }

  // Create token and session
  const token = await createToken(user);
  const cookie = await createSession(token);

  // Get redirect URL from query params or default based on role
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo");
  const defaultRedirect =
    user.role === "USER" ? "/dashboard/my-assets" : "/dashboard";

  return redirect(redirectTo || defaultRedirect, {
    headers: { "Set-Cookie": cookie },
  });
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors as Record<string, string[]> | undefined;
  const error = actionData?.error as string | undefined;
  const values = actionData?.values as Record<string, string> | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <Form method="post">
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            defaultValue={values?.email}
            required
            autoComplete="email"
            error={errors?.email}
          />

          <PasswordToggleField name="password" label="Password" errors={errors?.password} />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Form>
    </Card>
  );
}
