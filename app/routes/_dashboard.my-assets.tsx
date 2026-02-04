import { useState } from "react";
import { data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.my-assets";
import { requireAuth } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Laptop, History, RotateCcw, Loader2, AlertCircle, Package, Eye } from "lucide-react";
import { formatDuration } from "~/lib/utils";
import { formatDate } from "~/lib/date";
import type { AssignmentStatus } from "@prisma/client";

export function meta() {
  return [{ title: "My Assets - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  const [currentAssets, history] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            model: true,
            manufacturer: true,
            category: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { assignedDate: "desc" },
    }),
    prisma.assignment.findMany({
      where: { userId: user.id, status: { not: "ACTIVE" } },
      orderBy: { returnDate: "desc" },
      take: 20,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            category: true,
          },
        },
      },
    }),
  ]);

  return { user, currentAssets, history };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const assignmentId = formData.get("assignmentId") as string;
  const notes = formData.get("notes") as string;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.userId !== user.id) {
    return data({ error: "Assignment not found" }, { status: 404 });
  }

  if (assignment.status !== "ACTIVE") {
    return data({ error: "Assignment is not active" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: "RETURNED",
        returnDate: new Date(),
        notes: notes || assignment.notes,
      },
    }),
    prisma.asset.update({
      where: { id: assignment.assetId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return data({ success: true });
}

function getStatusBadge(status: AssignmentStatus) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case "RETURNED":
      return <Badge variant="secondary">Returned</Badge>;
    case "TRANSFERRED":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Transferred</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function MyAssetsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { currentAssets, history } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [returnDialogOpen, setReturnDialogOpen] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Assets</h1>
        <p className="text-muted-foreground">
          Assets currently assigned to you and your history
        </p>
      </div>

      {actionData && "error" in actionData && actionData.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {/* Currently Assigned Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Currently Assigned ({currentAssets.length})
          </CardTitle>
          <CardDescription>
            Assets you are responsible for
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Laptop className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                You don't have any assets assigned to you at the moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentAssets.map((assignment) => (
                <Card key={assignment.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{assignment.asset.name}</CardTitle>
                      <Badge className="bg-green-500 hover:bg-green-600">Assigned</Badge>
                    </div>
                    <CardDescription>
                      {assignment.asset.category || "Uncategorized"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      {assignment.asset.serialNumber && (
                        <p>
                          <span className="text-muted-foreground">Serial:</span>{" "}
                          {assignment.asset.serialNumber}
                        </p>
                      )}
                      {assignment.asset.model && (
                        <p>
                          <span className="text-muted-foreground">Model:</span>{" "}
                          {assignment.asset.model}
                        </p>
                      )}
                      <p>
                        <span className="text-muted-foreground">Assigned:</span>{" "}
                        {formatDate(assignment.assignedDate)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Duration:</span>{" "}
                        {formatDuration(assignment.assignedDate, new Date())}
                      </p>
                      {assignment.dueDate && (
                        <p>
                          <span className="text-muted-foreground">Due:</span>{" "}
                          {formatDate(assignment.dueDate)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link to={`/dashboard/assets/${assignment.asset.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      
                      <Dialog
                        open={returnDialogOpen === assignment.id}
                        onOpenChange={(open) =>
                          setReturnDialogOpen(open ? assignment.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Return
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Return Asset</DialogTitle>
                            <DialogDescription>
                              Return "{assignment.asset.name}" and make it available for
                              other users.
                            </DialogDescription>
                          </DialogHeader>
                          <Form method="post" className="space-y-4">
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.id}
                            />
                            <div className="space-y-2">
                              <Label htmlFor={`notes-${assignment.id}`}>
                                Notes (Optional)
                              </Label>
                              <Textarea
                                id={`notes-${assignment.id}`}
                                name="notes"
                                placeholder="Add any notes about the condition or return..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setReturnDialogOpen(null)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Confirm Return
                              </Button>
                            </div>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
          </CardTitle>
          <CardDescription>Your past asset assignments (last 20)</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No previous assignments
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/dashboard/assets/${assignment.asset.id}`}
                        className="hover:underline text-primary"
                      >
                        {assignment.asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>{assignment.asset.category || "-"}</TableCell>
                    <TableCell>
                      {formatDate(assignment.assignedDate)}
                    </TableCell>
                    <TableCell>
                      {assignment.returnDate
                        ? formatDate(assignment.returnDate)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.returnDate
                        ? formatDuration(assignment.assignedDate, assignment.returnDate)
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
