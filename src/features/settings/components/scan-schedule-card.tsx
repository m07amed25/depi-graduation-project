"use client";

import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ScanScheduleCardProps = {
  repositoryId: string;
};

type Cadence = "DAILY" | "WEEKLY";

export function ScanScheduleCard({ repositoryId }: ScanScheduleCardProps) {
  const utils = trpc.useUtils();
  const configQuery = trpc.repository.getScheduledScanConfig.useQuery({ repositoryId });
  const runsQuery = trpc.automation.getScheduledScanRuns.useQuery({ repositoryId, limit: 10 });

  const update = trpc.repository.updateScheduledScanConfig.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.repository.getScheduledScanConfig.invalidate({ repositoryId }),
        utils.automation.getScheduledScanRuns.invalidate({ repositoryId, limit: 10 }),
      ]);
      window.alert("Scheduled scan settings updated.");
    },
    onError: (error) => {
      window.alert(error.message || "Failed to update scheduled scan settings.");
    },
  });

  const disabled = configQuery.isLoading || update.isPending;
  const enabled = update.variables?.enabled ?? configQuery.data?.enabled ?? false;
  const cadence =
    update.variables?.cadence ??
    (configQuery.data?.cadence as Cadence | undefined) ??
    "WEEKLY";

  const rows = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);

  const commitUpdate = (next: { enabled: boolean; cadence?: Cadence }) => {
    update.mutate({
      repositoryId,
      enabled: next.enabled,
      cadence: next.cadence,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Repository Scans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id={`scan-enabled-${repositoryId}`}
            checked={enabled}
            disabled={disabled}
            onCheckedChange={(value) => {
              const nextEnabled = value === true;
              commitUpdate({ enabled: nextEnabled });
            }}
          />
          <Label htmlFor={`scan-enabled-${repositoryId}`}>Enable scheduled scans</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`scan-cadence-${repositoryId}`}>Cadence</Label>
          <Select
            id={`scan-cadence-${repositoryId}`}
            value={cadence}
            disabled={disabled}
            onChange={(event) => {
              const nextCadence = event.target.value as Cadence;
              commitUpdate({ enabled, cadence: nextCadence });
            }}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </Select>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent scan runs</h4>
          {runsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading scan history…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scan runs yet.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    <p>{new Date(run.triggeredAt).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Queued reviews: {run.reviewsQueued}</p>
                  </div>
                  <Badge variant="outline">{run.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


