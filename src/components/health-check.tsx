"use client";

import { trpc } from "@/lib/trpc/client";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

export function HealthCheck() {
  const { data, isLoading, error } = trpc.health.useQuery();

  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (error) {
    return <Badge variant="destructive">Error</Badge>;
  }

  return (
    <Badge variant="secondary">
      API: {data?.status} {data?.timestamp?.toLocaleString()}
    </Badge>
  );
}
