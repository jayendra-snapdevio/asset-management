import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  ASSIGNED: "#3b82f6",
  UNDER_MAINTENANCE: "#f97316",
  RETIRED: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  UNDER_MAINTENANCE: "Maintenance",
  RETIRED: "Retired",
};

interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

interface StatusPieChartProps {
  data: StatusData[];
}



export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: STATUS_LABELS[d.status] || d.status,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No asset data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label= {({ name, payload }) => `${name}: ${(payload as StatusData)?.percentage ?? 0}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status] || "#8884d8"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value, "Assets"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
