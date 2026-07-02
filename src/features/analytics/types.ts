export type { TimePeriod } from "@/lib/constants";
export { TIME_PERIOD_LABELS, COLORS } from "@/lib/constants";

export interface TrendDataPoint {
  date: string;
  total: number;
  completed: number;
  pending: number;
  failed: number;
}
