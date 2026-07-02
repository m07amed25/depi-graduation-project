"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { COLORS, TrendDataPoint } from "../types";

const trendChartConfig: ChartConfig = {
  total: { label: "Total", color: COLORS.primary },
  completed: { label: "Completed", color: COLORS.success },
};

const outcomesChartConfig: ChartConfig = {
  Approved: { label: "Approved", color: COLORS.success },
  "Needs Changes": { label: "Needs Changes", color: COLORS.warning },
  Rejected: { label: "Rejected", color: COLORS.danger },
  Pending: { label: "Pending", color: COLORS.muted },
};

interface ChartsRowProps {
  trendsData: TrendDataPoint[] | undefined;
  trendsLoading: boolean;
  ratesData:
    | {
        approved: { count: number };
        needsChanges: { count: number };
        rejected: { count: number };
        pending: { count: number };
      }
    | undefined;
  ratesLoading: boolean;
}

export function ChartsRow({
  trendsData,
  trendsLoading,
  ratesData,
  ratesLoading,
}: ChartsRowProps) {
  const outcomesData = [
    { name: "Approved", value: ratesData?.approved.count ?? 0 },
    { name: "Needs Changes", value: ratesData?.needsChanges.count ?? 0 },
    { name: "Rejected", value: ratesData?.rejected.count ?? 0 },
    { name: "Pending", value: ratesData?.pending.count ?? 0 },
  ];

  const outcomesColors = [
    COLORS.success,
    COLORS.warning,
    COLORS.danger,
    COLORS.muted,
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main Trend Chart */}
      <Card className="lg:col-span-2 p-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Review Trends</h3>
          <p className="text-xs text-muted-foreground">Volume over time</p>
        </div>
        {trendsLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !trendsData || trendsData.length === 0 ? (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
            No trend data available for this period.
          </div>
        ) : (
          <ChartContainer
            config={trendChartConfig}
            className="h-[300px] w-full"
          >
            <AreaChart
              data={trendsData ?? []}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.primary}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.primary}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.success}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.success}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/30"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke={COLORS.primary}
                strokeWidth={2}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke={COLORS.success}
                strokeWidth={2}
                fill="url(#colorCompleted)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </Card>

      {/* Pie / Donut Chart */}
      <Card className="p-6">
        <h3 className="text-sm font-medium mb-4">Review Outcomes</h3>
        {ratesLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : !ratesData ||
          (ratesData.approved.count === 0 &&
            ratesData.needsChanges.count === 0 &&
            ratesData.rejected.count === 0 &&
            ratesData.pending.count === 0) ? (
          <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
            No outcomes data available.
          </div>
        ) : (
          <ChartContainer
            config={outcomesChartConfig}
            className="h-[250px] w-full"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={outcomesData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                strokeWidth={2}
              >
                {outcomesData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={outcomesColors[index % outcomesColors.length]}
                  />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-mt-2 flex-wrap gap-2 [&>div]:basis-1/4 [&>div]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
      </Card>
    </div>
  );
}
