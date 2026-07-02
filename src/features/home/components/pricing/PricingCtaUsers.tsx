"use client";

import Image from "next/image";
import { trpc } from "@/lib/trpc/client";

export function PricingCtaUsers() {
  const [data] = trpc.home.getRecentUsers.useSuspenseQuery();
  const recentUsers = data.recentUsers;
  const totalUsers = data.totalUsers;

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground font-medium">
      {recentUsers.length > 0 && (
        <div className="flex -space-x-3">
          {recentUsers.map((user, i) => (
            <div
              key={user.id || i}
              className="relative h-9 w-9 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm"
              aria-hidden="true"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User avatar"}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <span>Join {totalUsers}+ developers already using Code Catch</span>
    </div>
  );
}
