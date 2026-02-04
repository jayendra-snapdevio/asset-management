import { redirect, data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.assignments.new";
import { requireRole } from "~/lib/session.server";
import { getCompanyFilter } from "~/services/company.service.server";
import { handleError, errorResponse } from "~/lib/errors.server";
import {
  getAvailableAssets,
  getActiveUsers,
  validateAssetForAssignment,
  validateUserForAssignment,
  createAssignment,
} from "~/services/assignment.service.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

export function meta() {
  return [{ title: "New Assignment - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const companyFilter = await getCompanyFilter(user);

  const [availableAssets, users] = await Promise.all([
    getAvailableAssets(companyFilter),
    getActiveUsers(companyFilter),
  ]);

  return { availableAssets, users };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER", "ADMIN"]);
  const companyFilter = await getCompanyFilter(user);
  const formData = await request.formData();

  const assetId = formData.get("assetId") as string;
  const userId = formData.get("userId") as string;
  const notes = formData.get("notes") as string;
  const dueDateStr = formData.get("dueDate") as string;

  // Validation
  if (!assetId) {
    return errorResponse("Please select an asset");
  }

  if (!userId) {
    return errorResponse("Please select a user");
  }

  // Validate asset
  const assetValidation = await validateAssetForAssignment(assetId, companyFilter);
  if (!assetValidation.valid) {
    return errorResponse(assetValidation.error || "Invalid asset");
  }

  // Validate user
  const userValidation = await validateUserForAssignment(userId, companyFilter);
  if (!userValidation.valid) {
    return errorResponse(userValidation.error || "Invalid user");
  }

  // Create assignment
  try {
    await createAssignment({
      assetId,
      userId,
      notes: notes || undefined,
      dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
    });

    return redirect("/dashboard/assignments");
  } catch (error) {
    return handleError(error);
  }
}

export default function NewAssignmentPage({ loaderData, actionData }: Route.ComponentProps) {
  const { availableAssets, users } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/assignments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Assignment</h1>
          <p className="text-muted-foreground">Assign an asset to a user</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>
            Select an available asset and the user to assign it to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionData.error}</AlertDescription>
            </Alert>
          )}

          {availableAssets.length === 0 ? (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No available assets to assign. All assets are currently assigned or in other states.
              </AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active users available. Please ensure there are active users in the system.
              </AlertDescription>
            </Alert>
          ) : (
            <Form method="post" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="assetId">Asset *</Label>
                <Select name="assetId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                        {asset.serialNumber && ` (SN: ${asset.serialNumber})`}
                        {asset.category && ` - ${asset.category}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Only available assets are shown
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">Assign To *</Label>
                <Select name="userId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-sm text-muted-foreground">
                  Optional expected return date
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any notes about this assignment..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Assignment
                </Button>
                <Link to="/dashboard/assignments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
