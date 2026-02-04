import { data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_auth.forgot-password";
import { prisma } from "~/lib/db.server";
import { forgotPasswordSchema } from "~/validators/auth.validator";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export function meta() {
  return [
    { title: "Forgot Password - Asset Management" },
    { name: "description", content: "Reset your password" },
  ];
}

interface ActionResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Validate with Zod
  const result = forgotPasswordSchema.safeParse(rawData);
  if (!result.success) {
    return data<ActionResponse>(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email } = result.data;

  // Find user (don't reveal if email exists for security)
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    // Generate reset token
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // In production: send email with reset link
    // For development, log the token
    console.log(`Password reset requested for ${email}`);
    console.log(`Reset token: ${resetToken}`);
    console.log(`Reset link: ${process.env.APP_URL}/reset-password?token=${resetToken}`);
  }

  // Always return success to prevent email enumeration
  return data<ActionResponse>({
    success: true,
    message: "If an account exists with this email, you will receive a password reset link.",
  });
}

export default function ForgotPasswordPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const success = actionData?.success as boolean | undefined;
  const message = actionData?.message as string | undefined;
  const errors = actionData?.errors as Record<string, string[]> | undefined;

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <Form method="post">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            {errors?.email && (
              <p className="text-sm text-red-500">{errors.email[0]}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
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
