"use client";

import { RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import { TimePeriod } from "../types";

interface AnalyticsHeaderProps {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  granularity: "daily" | "weekly" | "monthly";
  setGranularity: (g: "daily" | "weekly" | "monthly") => void;
  onRefresh: () => void;
  onExport: () => void;
}

export function AnalyticsHeader({
  timePeriod,
  setTimePeriod,
  granularity,
  setGranularity,
  onRefresh,
  onExport,
}: AnalyticsHeaderProps) {
  return (
    <div className="border-b border-border/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Comprehensive insights into your code review performance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={timePeriod === "7d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimePeriod("7d")}
              >
                7D
              </Button>
              <Button
                variant={timePeriod === "30d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimePeriod("30d")}
              >
                30D
              </Button>
              <Button
                variant={timePeriod === "90d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimePeriod("90d")}
              >
                90D
              </Button>
            </div>
            <DropdownSelect
              value={granularity}
              onValueChange={(v) =>
                setGranularity(v as "daily" | "weekly" | "monthly")
              }
              placeholder="Granularity"
            >
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </DropdownSelect>
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
