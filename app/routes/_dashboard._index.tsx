import { Link } from "react-router";
import type { Route } from "./+types/_dashboard._index";
import { requireAuth } from "~/lib/session.server";
import {
  getAdminDashboard,
  getUserDashboard,
} from "~/services/dashboard.service.server";
import { StatCard } from "~/components/dashboard/StatCard";
import { StatusPieChart } from "~/components/dashboard/StatusPieChart";
import { CategoryBarChart } from "~/components/dashboard/CategoryBarChart";
import { RecentAssetsTable } from "~/components/dashboard/RecentAssetsTable";
import { ActivityFeed } from "~/components/dashboard/ActivityFeed";
import { DashboardSkeleton } from "~/components/dashboard/DashboardSkeleton";
import { formatDate } from "~/lib/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Package, ArrowRight, Building2, Shield, UserCheck, CheckCircle } from "lucide-react";

export function meta() {
  return [
    { title: "Dashboard - Asset Management" },
    { name: "description", content: "Asset Management Dashboard" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  // User role gets their own dashboard
  if (user.role === "USER") {
    const userDashboard = await getUserDashboard(user.id);
    return {
      user,
      isUserDashboard: true,
      ...userDashboard,
    };
  }

  // Admin/Owner gets full dashboard
  const adminDashboard = await getAdminDashboard(user);
  return {
    user,
    isUserDashboard: false,
    ...adminDashboard,
  };
}

export function HydrateFallback() {
  return <DashboardSkeleton />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="p-6 border border-red-300 rounded-lg bg-red-50">
      <h2 className="text-red-700 font-bold text-lg">Failed to load dashboard</h2>
      <p className="text-red-600 mt-2">
        {error instanceof Error ? error.message : "An unknown error occurred"}
      </p>
      <Button asChild variant="ghost" className="mt-4">
        <Link to="/dashboard">Try Again</Link>
      </Button>
    </div>
  );
}

export default function DashboardIndex({ loaderData }: Route.ComponentProps) {
  const { user, isUserDashboard } = loaderData;

  // User Dashboard
  if (isUserDashboard) {
    const { myAssets, history, ownedAssets, stats } = loaderData as {
      myAssets: Array<{
        id: string;
        assignedDate: Date;
        asset: {
          id: string;
          name: string;
          serialNumber: string | null;
          category: string | null;
          status: string;
        };
      }>;
      history: Array<{
        id: string;
        status: string;
        assignedDate: Date;
        returnDate: Date | null;
        asset: {
          id: string;
          name: string;
          serialNumber: string | null;
          category: string | null;
        };
      }>;
      ownedAssets: Array<{
        id: string;
        name: string;
        serialNumber: string | null;
        category: string | null;
        status: string;
      }>;
      stats: {
        currentAssets: number;
        ownedAssets: number;
        totalAssigned: number;
        totalReturned: number;
      };
      user: { firstName: string; lastName: string };
      isUserDashboard: boolean;
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your assigned assets
          </p>
        </div>

        {/* User Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Assigned"
            value={stats.totalAssigned}
            icon="UserCheck"
            description="All time"
          />
          <StatCard
            title="Current Assets"
            value={stats.currentAssets}
            icon="Package"
            description="Currently assigned to you"
          />
          <StatCard
            title="Owned Assets"
            value={stats.ownedAssets}
            icon="Shield"
            description="Assets you own"
          />
          <StatCard
            title="Returned"
            value={stats.totalReturned}
            icon="CheckCircle"
            description="Assets returned"
          />
        </div>

        {/* Current Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              My Current Assets
            </CardTitle>
            <CardDescription>Assets currently assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {myAssets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No assets currently assigned to you.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAssets.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <Link className="hover:underline" to={`/dashboard/assets/${assignment.asset.id}`}>
                          {assignment.asset.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {assignment.asset.serialNumber || "-"}
                      </TableCell>
                      <TableCell>{assignment.asset.category || "-"}</TableCell>
                      <TableCell>
                        {formatDate(assignment.assignedDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Owned Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              My Owned Assets
            </CardTitle>
            <CardDescription>Assets where you are the registered owner</CardDescription>
          </CardHeader>
          <CardContent>
            {ownedAssets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No owned assets found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownedAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <Link className="hover:underline" to={`/dashboard/assets/${asset.id}`}>
                          {asset.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {asset.serialNumber || "-"}
                      </TableCell>
                      <TableCell>{asset.category || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {asset.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Assignment History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
              <CardDescription>Your recent asset assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link className="hover:underline" to={`/dashboard/assets/${item.asset.id}`}>
                          {item.asset.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatDate(item.assignedDate)}
                      </TableCell>
                      <TableCell>
                        {item.returnDate
                          ? formatDate(item.returnDate)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Admin/Owner Dashboard
  const { stats, statusDistribution, categoryDistribution, recentAssets, recentActivity } =
    loaderData as {
      stats: {
        totalAssets: number;
        assignedAssets: number;
        availableAssets: number;
        underMaintenance: number;
        retiredAssets: number;
        totalUsers: number;
      };
      statusDistribution: Array<{
        status: string;
        count: number;
        percentage: number;
      }>;
      categoryDistribution: Array<{
        category: string | null;
        count: number;
      }>;
      recentAssets: Array<{
        id: string;
        name: string;
        category: string | null;
        status: string;
        createdAt: Date;
      }>;
      recentActivity: Array<{
        id: string;
        status: string;
        assignedDate: Date;
        returnDate: Date | null;
        asset: { id: string; name: string; companyName?: string };
        user: { id: string; firstName: string; lastName: string };
      }>;
      user: { firstName: string; lastName: string; role: string };
      isUserDashboard: boolean;
    };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {(user as any).company?.name ? `${(user as any).company.name} Dashboard` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName}! Here's your asset overview.
          </p>
        </div>
        <Button asChild className="w-full md:w-[180px]">
          <Link to="/dashboard/assets">
            View All Assets
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={stats.totalAssets}
          icon="Package"
          description="All assets in system"
          path="/dashboard/assets"
        />
        <StatCard
          title="Assigned"
          value={stats.assignedAssets}
          icon="UserCheck"
          description="Currently assigned"
          path="/dashboard/assets?status=ASSIGNED&page=1"
        />
        <StatCard
          title="Available"
          value={stats.availableAssets}
          icon="CheckCircle"
          description="Ready to assign"
          path="/dashboard/assets?status=AVAILABLE&page=1"
        />
        <StatCard
          title="Maintenance"
          value={stats.underMaintenance}
          icon="Wrench"
          description="Under maintenance"
          path="/dashboard/assets?status=UNDER_MAINTENANCE&page=1"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusPieChart data={statusDistribution} />
        <CategoryBarChart data={categoryDistribution} />
      </div>

      {/* Recent Data */}
      <div className="flex flex-col lg:flex-row gap-6">
        <RecentAssetsTable assets={recentAssets} />
        <ActivityFeed activities={recentActivity} />
      </div>
    </div>
  );
}
