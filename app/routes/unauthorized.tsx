import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export function meta() {
  return [{ title: "Access Denied - Asset Management" }];
}

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-destructive">403</h1>
        <h2 className="text-2xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to access this resource. Please contact your
          administrator if you believe this is a mistake.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild>
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/my-assets">View My Assets</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
