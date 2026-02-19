import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Asset Management System" },
    { name: "description", content: "Manage your company assets efficiently" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Asset Management
              <span className="text-primary"> System</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Track, manage, and optimize your company assets with our
              comprehensive asset management solution. Assign assets to users,
              monitor status, and generate reports with ease.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/register">Create Account</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle>📦 Asset Tracking</CardTitle>
                <CardDescription>
                  Keep track of all your assets with detailed information,
                  serial numbers, and QR codes.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>👥 User Management</CardTitle>
                <CardDescription>
                  Manage users with role-based access control. Owners, Admins,
                  and regular Users.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>📋 Assignment History</CardTitle>
                <CardDescription>
                  Track asset assignments, transfers, and returns with complete
                  audit history.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Tech Stack */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              Built with React Router v7 • TypeScript • Tailwind CSS • shadcn/ui
              • Prisma • MongoDB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
