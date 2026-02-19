import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { Activity, ArrowRight, ArrowLeftRight, RotateCcw } from "lucide-react";
import { formatDate } from "~/lib/date";

interface ActivityItem {
  id: string;
  status: string;
  assignedDate: Date;
  returnDate: Date | null;
  asset: { id: string; name: string; companyName?: string };
  user: { id: string; firstName: string; lastName: string };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  noCard?: boolean;
}

export function ActivityFeed({
  activities,
  noCard = false,
}: ActivityFeedProps) {
  const getActivityIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case "RETURNED":
        return <RotateCcw className="h-4 w-4 text-green-500" />;
      case "TRANSFERRED":
        return <ArrowLeftRight className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: ActivityItem) => {
    const userName = `${activity.user.firstName} ${activity.user.lastName}`;
    const assetName = activity.asset.name;
    const companyTag = activity.asset.companyName ? (
      <span className="text-xs text-muted-foreground ml-1">
        ({activity.asset.companyName})
      </span>
    ) : null;

    switch (activity.status) {
      case "ACTIVE":
        return (
          <>
            <span className="font-medium">{userName}</span> was assigned{" "}
            <Link
              to={`/dashboard/assets/${activity.asset.id}`}
              className="font-medium text-primary hover:underline"
            >
              {assetName}
            </Link>
            {companyTag}
          </>
        );
      case "RETURNED":
        return (
          <>
            <span className="font-medium">{userName}</span> returned{" "}
            <Link
              to={`/dashboard/assets/${activity.asset.id}`}
              className="font-medium text-primary hover:underline"
            >
              {assetName}
            </Link>
            {companyTag}
          </>
        );
      case "TRANSFERRED":
        return (
          <>
            <Link
              to={`/dashboard/assets/${activity.asset.id}`}
              className="font-medium text-primary hover:underline"
            >
              {assetName}
            </Link>{" "}
            {companyTag} was transferred to{" "}
            <span className="font-medium">{userName}</span>
          </>
        );
      default:
        return (
          <>
            Activity on{" "}
            <Link
              to={`/dashboard/assets/${activity.asset.id}`}
              className="font-medium text-primary hover:underline"
            >
              {assetName}
            </Link>
            {companyTag}
          </>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Assigned</Badge>;
      case "RETURNED":
        return <Badge variant="secondary">Returned</Badge>;
      case "TRANSFERRED":
        return <Badge variant="outline">Transferred</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const content = (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No recent activity
        </p>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b last:border-0"
              >
                <div className="mt-1">{getActivityIcon(activity.status)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{getActivityMessage(activity)}</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(activity.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.assignedDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  if (noCard) {
    return content;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest asset assignments</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
