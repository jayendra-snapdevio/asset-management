import { Link } from "react-router";
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
import { Package } from "lucide-react";
import { formatDate } from "~/lib/date";

interface RecentAsset {
  id: string;
  name: string;
  category: string | null;
  status: string;
  createdAt: Date;
}

interface RecentAssetsTableProps {
  assets: RecentAsset[];
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  UNDER_MAINTENANCE: "bg-orange-100 text-orange-800",
  RETIRED: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  UNDER_MAINTENANCE: "Maintenance",
  RETIRED: "Retired",
};

export function RecentAssetsTable({ assets }: RecentAssetsTableProps) {
  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Assets
          </CardTitle>
          <CardDescription>Recently added assets</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No assets yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Recent Assets
        </CardTitle>
        <CardDescription>Recently added assets</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/dashboard/assets/${asset.id}`}
                    className="hover:underline text-primary"
                  >
                    {asset.name}
                  </Link>
                </TableCell>
                <TableCell>{asset.category || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[asset.status] || ""}
                  >
                    {STATUS_LABELS[asset.status] || asset.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(asset.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
