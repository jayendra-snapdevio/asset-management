import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Package,
  UserCheck,
  CheckCircle,
  Wrench,
  Users,
  Archive,
  TrendingUp,
  TrendingDown,
  Shield,
} from "lucide-react";
import { Link } from "react-router";

const icons = {
  Package,
  UserCheck,
  CheckCircle,
  Wrench,
  Users,
  Archive,
  TrendingUp,
  TrendingDown,
  Shield,
};

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof icons;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  path?: string;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
  path,
}: StatCardProps) {
  const Icon = icons[icon];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {path ? (
          <Link to={path} className="hover:underline">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </Link>
        ) : (
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        )}
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={`text-xs flex items-center gap-1 mt-1 ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
