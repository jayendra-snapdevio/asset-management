import { redirect, data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_auth.register";
import { hashPassword, createToken } from "~/lib/auth.server";
import { createSession, getCurrentUser } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { registerSchema } from "~/validators/auth.validator";
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
    { title: "Register - Asset Management" },
    { name: "description", content: "Create a new account" },
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
      { status: 400 },
    );
  }

  const { email: rawEmail, password, firstName, lastName } = result.data;
  const email = rawEmail.toLowerCase().trim();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return data<ActionResponse>(
      {
        errors: { email: ["This email is already registered"] },
        values: rawData,
      },
      { status: 400 },
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
            <FormField
              label="First name"
              name="firstName"
              placeholder="John"
              defaultValue={values?.firstName}
              required
              autoComplete="given-name"
              error={errors?.firstName}
            />

            <FormField
              label="Last name"
              name="lastName"
              placeholder="Doe"
              defaultValue={values?.lastName}
              required
              autoComplete="family-name"
              error={errors?.lastName}
            />
          </div>

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
          <div className="space-y-2">
            <PasswordToggleField
              name="password"
              label="Password"
              errors={errors?.password}
            />
            <PasswordToggleField
              name="confirmPassword"
              label="Confirm password"
              errors={errors?.confirmPassword}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-4 ">
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
