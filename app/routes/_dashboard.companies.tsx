import { useState } from "react";
import {
  data,
  redirect,
  Form,
  useSearchParams,
  Link,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/_dashboard.companies";
import { requireRole } from "~/lib/session.server";
import { handleError } from "~/lib/errors.server";
import {
  getCompaniesByOwner,
  createCompany,
  deleteCompany,
} from "~/services/company.service.server";
import { createCompanySchema } from "~/validators/company.validator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FormField } from "~/components/forms/form-field";
import type { CompanyListItem } from "~/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Pagination } from "~/components/shared/Pagination";
import {
  Building2,
  Plus,
  Search,
  Users,
  Package,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";


export function meta() {
  return [{ title: "Companies - Asset Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["OWNER"]);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const { companies, pagination } = await getCompaniesByOwner(user.id, {
    page,
    limit,
    search,
  });

  return { user, companies, pagination, search };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, ["OWNER"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const rawData = Object.fromEntries(formData);

  if (intent === "delete") {
    const companyId = formData.get("companyId") as string;
    if (!companyId) {
      return data({ error: "Company ID is required", success: false }, { status: 400 });
    }
    
    try {
      const result = await deleteCompany(companyId, user.id);
      if (!result) {
        return data({ error: "Failed to delete company", success: false }, { status: 400 });
      }
      return data({ success: true, message: "Company deleted successfully" });
    } catch (error) {
      return handleError(error);
    }
  }

  const result = createCompanySchema.safeParse(rawData);
  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors, success: false },
      { status: 400 },
    );
  }

  try {
    const company = await createCompany(result.data, user.id);
    return redirect(`/dashboard/companies/${company.id}`);
  } catch (error) {
    return handleError(error);
  }
}

export default function CompaniesPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { companies, pagination, search } = loaderData;
  const typedCompanies = companies as CompanyListItem[];
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    setSearchParams(searchValue ? { search: searchValue, page: "1" } : {});
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const hasFilters = search;

  return (
    <div className="space-y-6">
      {actionData && "error" in actionData && actionData.error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
          {actionData.error as string}
        </div>
      )}
      {actionData && "success" in actionData && actionData.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
          {"message" in actionData ? (actionData.message as string) : "Action completed successfully"}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">
            Manage companies in your system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <Form method="post" onSubmit={() => setIsDialogOpen(false)}>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>
                  Add a new company to manage assets and users.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  label="Company Name"
                  name="name"
                  placeholder="Enter company name"
                  required
                  error={actionData && "errors" in actionData ? (actionData.errors as any)?.name : undefined}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="company@example.com"
                  error={actionData && "errors" in actionData ? (actionData.errors as any)?.email : undefined}
                />
                <FormField
                  label="Phone"
                  name="phone"
                  placeholder="+1 234 567 890"
                  error={actionData && "errors" in actionData ? (actionData.errors as any)?.phone : undefined}
                />
                <FormField
                  label="Address"
                  name="address"
                  placeholder="123 Main St, City"
                />
                <FormField
                  label="Website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Company"}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-1">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search companies..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSearchParams({})}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {search ? "No companies found" : "No companies yet"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {search
                ? "Try adjusting your search terms."
                : "Create your first company to start managing assets."}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first company
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Company List</CardTitle>
            <CardDescription>
              {pagination.total}{" "}
              {pagination.total === 1 ? "company" : "companies"} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead className="text-center">Assets</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/dashboard/companies/${company.id}`}
                          className="hover:underline flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {company.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{company.email || "-"}</TableCell>
                    <TableCell>{company.phone || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {company._count.users}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" />
                        {company._count.assets}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-start gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="View details">
                          <Link to={`/dashboard/companies/${company.id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edit company">
                          <Link to={`/dashboard/companies/${company.id}`}>
                            <Edit2 className="h-3 w-3" />
                          </Link>
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete company">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Company</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete {company.name}? This will mark the company as inactive. 
                                {company._count.users > 0 && ` This company has ${company._count.users} users.`}
                                {company._count.assets > 0 && ` This company has ${company._count.assets} assets.`}
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                              <Form method="post">
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="companyId" value={company.id} />
                                <div className="flex gap-2 justify-end">
                                  <DialogTrigger asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                  <Button type="submit" variant="destructive" disabled={isSubmitting}>
                                    {isSubmitting ? "Deleting..." : "Delete Company"}
                                  </Button>
                                </div>
                              </Form>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              pagination={pagination}
              onPageChange={goToPage}
              onLimitChange={(value) => {
                const params = new URLSearchParams(searchParams);
                params.set("limit", value);
                params.set("page", "1");
                setSearchParams(params);
              }}
              itemName="results"
              className="mt-4"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
