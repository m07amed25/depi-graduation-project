import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradePrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <p className="mb-5 max-w-[36ch] text-sm text-muted-foreground">{description}</p>
      <Button size="sm" asChild>
        <Link href="/pricing">View plans</Link>
      </Button>
    </div>
  );
}
