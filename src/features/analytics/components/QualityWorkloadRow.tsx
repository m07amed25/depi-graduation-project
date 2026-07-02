"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { RadialBarChart, RadialBar, PolarGrid } from "recharts";
import { COLORS } from "../types";
import { Bug, Code2, Zap, ShieldCheck } from "lucide-react";

interface QualityData {
  avgCoverage: number;
  avgMaintainability: number;
  avgPerformance: number;
  avgSecurity: number;
}

interface WorkloadData {
  reviewers: Array<{ id: string; name: string; total: number }>;
}

interface QualityWorkloadRowProps {
  qualityData: QualityData | undefined;
  qualityLoading: boolean;
  workloadData: WorkloadData | undefined;
  workloadLoading: boolean;
}

const qualityChartConfig: ChartConfig = {
  coverage: { label: "Coverage", color: COLORS.success },
  maintainability: { label: "Maintainability", color: COLORS.info },
  performance: { label: "Performance", color: COLORS.warning },
  security: { label: "Security", color: "#8b5cf6" },
};

export function QualityWorkloadRow({
  qualityData,
  qualityLoading,
  workloadData,
  workloadLoading,
}: QualityWorkloadRowProps) {
  const radialData = [
    {
      name: "Coverage",
      value: qualityData?.avgCoverage ?? 0,
      fill: COLORS.success,
      icon: Bug,
    },
    {
      name: "Maintainability",
      value: qualityData?.avgMaintainability ?? 0,
      fill: COLORS.info,
      icon: Code2,
    },
    {
      name: "Performance",
      value: qualityData?.avgPerformance ?? 0,
      fill: COLORS.warning,
      icon: Zap,
    },
    {
      name: "Security",
      value: qualityData?.avgSecurity ?? 0,
      fill: "#8b5cf6",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Quality Scores — Radial Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Quality Metrics</h3>
        {qualityLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !qualityData ||
          (qualityData.avgCoverage === 0 &&
            qualityData.avgMaintainability === 0 &&
            qualityData.avgPerformance === 0 &&
            qualityData.avgSecurity === 0) ? (
          <div className="h-[280px] w-full flex items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
            No quality metrics available.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <ChartContainer
              config={qualityChartConfig}
              className="h-[220px] w-full"
            >
              <RadialBarChart
                data={radialData}
                innerRadius={30}
                outerRadius={110}
                startAngle={90}
                endAngle={-270}
              >
                <PolarGrid gridType="circle" radialLines={false} />
                <RadialBar dataKey="value" background cornerRadius={6} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
              </RadialBarChart>
            </ChartContainer>
            {/* Legend below chart */}
            <div className="grid grid-cols-2 gap-2">
              {radialData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Reviewer Workload */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Team Workload</h3>
        {workloadLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <div className="space-y-4">
            {workloadData?.reviewers.slice(0, 5).map((reviewer) => (
              <div key={reviewer.id} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {reviewer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{reviewer.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {reviewer.total} reviews
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          (reviewer.total /
                            (workloadData.reviewers[0]?.total || 1)) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!workloadData?.reviewers ||
              workloadData.reviewers.length === 0) && (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
                No reviewer data available for this period.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
