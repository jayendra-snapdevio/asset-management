import { redirect, data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_auth.register";
import { hashPassword, createToken } from "~/lib/auth.server";
import { createSession, getCurrentUser } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { registerSchema } from "~/validators/auth.validator";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export function meta() {
  return [
    { title: "Register - Asset Management" },
    { name: "description", content: "Create a new account" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Redirect if already logged in
  const user = await getCurrentUser(request);
  if (user) {
    return redirect(user.role === "USER" ? "/dashboard/my-assets" : "/dashboard");
  }
  return null;
}

interface ActionResponse {
  errors?: Record<string, string[]>;
  values?: Record<string, unknown>;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Validate with Zod
  const result = registerSchema.safeParse(rawData);
  if (!result.success) {
    return data<ActionResponse>(
      { errors: result.error.flatten().fieldErrors, values: rawData },
      { status: 400 }
    );
  }

  const { email, password, firstName, lastName } = result.data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return data<ActionResponse>(
      { errors: { email: ["This email is already registered"] }, values: rawData },
      { status: 400 }
    );
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "USER",
    },
  });

  // Create token and session
  const token = await createToken(user);
  const cookie = await createSession(token);

  return redirect("/dashboard/my-assets", {
    headers: { "Set-Cookie": cookie },
  });
}

export default function RegisterPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors as Record<string, string[]> | undefined;
  const values = actionData?.values as Record<string, string> | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <Form method="post">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                defaultValue={values?.firstName}
                required
                autoComplete="given-name"
              />
              {errors?.firstName && (
                <p className="text-sm text-red-500">{errors.firstName[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                defaultValue={values?.lastName}
                required
                autoComplete="family-name"
              />
              {errors?.lastName && (
                <p className="text-sm text-red-500">{errors.lastName[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              defaultValue={values?.email}
              required
              autoComplete="email"
            />
            {errors?.email && (
              <p className="text-sm text-red-500">{errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            {errors?.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword[0]}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Form>
    </Card>
  );
}
