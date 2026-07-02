import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TimelineSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <CommitSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CommitSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <div className="flex flex-col items-center">
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-0.5 flex-1 min-h-[40px]" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}
