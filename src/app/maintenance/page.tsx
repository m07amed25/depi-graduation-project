"use client";

import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportDialog } from "@/components/support/support-dialog";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
        <Construction className="h-10 w-10 text-amber-500" />
      </div>
      <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
        System Under Maintenance
      </h1>
      <p className="mb-8 max-w-[500px] text-lg text-muted-foreground">
        We&apos;re currently performing some scheduled upgrades to improve your
        experience. Please check back shortly!
      </p>
      <div className="flex gap-4">
        <SupportDialog 
          trigger={<Button size="lg">Contact Support</Button>} 
        />
      </div>
      <p className="mt-12 text-sm text-muted-foreground italic">
        &quot;Refactoring the universe, one line at a time.&quot;
      </p>
    </div>
  );
}

