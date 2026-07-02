import { BarChart3, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { MetricCard, MetricCardSkeleton } from "./MetricCard";
import { COLORS, TIME_PERIOD_LABELS, TimePeriod } from "../types";

interface KeyMetricsGridProps {
  overviewData:
    | {
        totalReviews: number;
        completionRate: number;
        completedReviews: number;
        avgCompletionTimeHours: number;
        avgRiskScore: number;
      }
    | undefined;
  overviewLoading: boolean;
  timePeriod: TimePeriod;
}

export function KeyMetricsGrid({
  overviewData,
  overviewLoading,
  timePeriod,
}: KeyMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {overviewLoading ? (
        <>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </>
      ) : (
        <>
          <MetricCard
            title="Total Reviews"
            value={overviewData?.totalReviews ?? 0}
            subtitle={TIME_PERIOD_LABELS[timePeriod]}
            icon={BarChart3}
            color={COLORS.primary}
            trend="up"
            trendValue="+12% from last period"
          />
          <MetricCard
            title="Completion Rate"
            value={`${overviewData?.completionRate ?? 0}%`}
            subtitle={`${overviewData?.completedReviews ?? 0} completed`}
            icon={CheckCircle2}
            color={COLORS.success}
            trend="up"
            trendValue="+5% improvement"
          />
          <MetricCard
            title="Avg. Completion Time"
            value={`${overviewData?.avgCompletionTimeHours ?? 0}h`}
            subtitle="Average time to complete"
            icon={Clock}
            color={COLORS.warning}
            trend="down"
            trendValue="-8% faster"
          />
          <MetricCard
            title="Avg. Risk Score"
            value={overviewData?.avgRiskScore ?? 0}
            subtitle="Out of 100"
            icon={AlertTriangle}
            tooltip="A 0–100 score estimating how likely a PR is to introduce bugs or security issues. Higher means riskier."
            color={
              (overviewData?.avgRiskScore ?? 0) > 60
                ? COLORS.danger
                : (overviewData?.avgRiskScore ?? 0) > 30
                  ? COLORS.warning
                  : COLORS.success
            }
          />
        </>
      )}
    </div>
  );
}
