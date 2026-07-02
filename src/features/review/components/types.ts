export type SortKey = "severity" | "file" | "line" | "category";
export type SortDir = "asc" | "desc";
export type ViewMode = "list" | "grouped";

export const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export interface ReviewComment {
  file: string;
  line: number;
  severity: string;
  category?: string;
  message: string;
  suggestion?: string;
  confidence?: number;
}

export interface QualityMetrics {
  complexity: number;
  maintainability: number;
  readability: number;
  testability: number;
}

export interface ReviewResultProps {
  review: {
    id: string;
    status: string;
    summary: string | null;
    riskScore: number | null;
    comments: ReviewComment[] | unknown;
    qualityMetrics?: QualityMetrics | unknown;
    resolvedComments?: string[];
    error: string | null;
    createdAt: Date;
  };
  onRetry?: () => void;
  isRetrying?: boolean;
}
