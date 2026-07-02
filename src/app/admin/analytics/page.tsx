"use client";

import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading: statsLoading } =
    trpc.admin.getStats.useQuery();
  const { data: growth, isLoading: growthLoading } =
    trpc.admin.getGrowthData.useQuery();

  const statusData = stats
    ? Object.entries(stats.reviewsByStatus).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Advanced Analytics
        </h1>
        <p className="text-muted-foreground">
          Deep dive into platform usage and performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Review Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of all code reviews by their current status.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>
              Frequency of new users vs reviews over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {growthLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growth}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--muted))"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => str.slice(5)}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="users"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="New Users"
                  />
                  <Bar
                    dataKey="reviews"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Reviews"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Efficiency</CardTitle>
          <CardDescription>
            Growth momentum and user conversion trends.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {/* Placeholder for more complex analytics */}
          <div className="flex items-center justify-center h-full border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Advanced usage metrics coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
