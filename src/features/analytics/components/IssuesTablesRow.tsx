import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface IssuesTablesRowProps {
  issuesData:
    | {
        topIssues: Array<{ issue: string; count: number }>;
        topRejectionReasons: Array<{ reason: string; count: number }>;
      }
    | undefined;
  issuesLoading: boolean;
}

export function IssuesTablesRow({
  issuesData,
  issuesLoading,
}: IssuesTablesRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Top Issues */}
      <Card className="p-6">
        <h3 className="text-sm font-medium mb-4">Top Issues Detected</h3>
        <div className="space-y-2">
          {issuesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-[46px] w-full" />
              <Skeleton className="h-[46px] w-full" />
              <Skeleton className="h-[46px] w-full" />
            </div>
          ) : issuesData?.topIssues && issuesData.topIssues.length > 0 ? (
            issuesData.topIssues.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <span className="font-medium">{item.issue}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))
          ) : (
            <div className="h-[100px] flex items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
              No issues data available
            </div>
          )}
        </div>
      </Card>

      {/* Rejection Reasons */}
      <Card className="p-6">
        <h3 className="text-sm font-medium mb-4">Rejection Reasons</h3>
        <div className="space-y-2">
          {issuesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-[46px] w-full" />
              <Skeleton className="h-[46px] w-full" />
              <Skeleton className="h-[46px] w-full" />
            </div>
          ) : issuesData?.topRejectionReasons &&
            issuesData.topRejectionReasons.length > 0 ? (
            issuesData.topRejectionReasons.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <span className="font-medium">{item.reason}</span>
                <Badge variant="destructive">{item.count}</Badge>
              </div>
            ))
          ) : (
            <div className="h-[100px] flex items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
              No rejection data available
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
