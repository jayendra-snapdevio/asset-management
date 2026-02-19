import { redirect, Form, Link, useNavigation } from "react-router";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormField } from "~/components/forms/form-field";
import { FormSelect } from "~/components/forms/form-select";
import { FormTextarea } from "~/components/forms/form-textarea";
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

  const url = new URL(request.url);
  const preSelectedUserId = url.searchParams.get("userId");

  return { availableAssets, users, preSelectedUserId };
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
  const assetValidation = await validateAssetForAssignment(
    assetId,
    companyFilter,
  );
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

export default function NewAssignmentPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { availableAssets, users, preSelectedUserId } = loaderData;
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

      <Card className="w-full">
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
                No available assets to assign. All assets are currently assigned
                or in other states.
              </AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active users available. Please ensure there are active users
                in the system.
              </AlertDescription>
            </Alert>
          ) : (
            <Form method="post" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect
                  label="Asset"
                  name="assetId"
                  required
                  placeholder="Select an asset"
                  helperText="Only available assets are shown"
                  options={availableAssets.map((asset) => ({
                    label: `${asset.name}${asset.serialNumber ? ` (SN: ${asset.serialNumber})` : ""}${asset.category ? ` - ${asset.category}` : ""}`,
                    value: asset.id,
                  }))}
                />

                <FormSelect
                  label="Assign To"
                  name="userId"
                  required
                  placeholder="Select a user"
                  defaultValue={preSelectedUserId || ""}
                  options={users.map((user) => ({
                    label: `${user.firstName} ${user.lastName} (${user.email})`,
                    value: user.id,
                  }))}
                />

                <FormField
                  label="Due Date (Optional)"
                  name="dueDate"
                  type="date"
                  helperText="Optional expected return date"
                />
              </div>

              <FormTextarea
                label="Notes (Optional)"
                name="notes"
                placeholder="Add any notes about this assignment..."
                rows={3}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
