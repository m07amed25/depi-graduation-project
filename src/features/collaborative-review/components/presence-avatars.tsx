"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type PresenceMember } from "@/lib/pusher/client";

interface PresenceAvatarsProps {
  members: PresenceMember[];
  myId: string | null;
  isAdmin?: boolean;
}

export function PresenceAvatars({ members, myId, isAdmin }: PresenceAvatarsProps) {
  if (members.length === 0) {
    return (
      <span className="text-[0.6875rem] font-mono text-[oklch(0.40_0.03_250)]">
        offline
      </span>
    );
  }

  const content = (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {members.slice(0, 4).map((m) => (
          <Avatar
            key={m.id}
            className={cn(
              "size-6 border border-[oklch(0.12_0.03_250)]",
              m.id === myId && "border-[oklch(0.62_0.16_250)]",
            )}
            title={m.info.name + (m.id === myId ? " (you)" : "")}
          >
            <AvatarImage src={m.info.image ?? undefined} />
            <AvatarFallback className="text-[9px] font-medium bg-[oklch(0.20_0.02_250)] text-[oklch(0.60_0.03_250)]">
              {m.info.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {members.length > 4 && (
          <div className="size-6 rounded-[4px] bg-[oklch(0.20_0.02_250)] border border-[oklch(0.30_0.02_250)] flex items-center justify-center text-[9px] font-mono text-[oklch(0.60_0.03_250)]">
            +{members.length - 4}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="size-1.5 rounded-full bg-[oklch(0.55_0.15_155)]" />
        <span className="text-[0.6875rem] font-mono text-[oklch(0.60_0.03_250)] tabular-nums">
          {members.length}
        </span>
      </div>
    </div>
  );

  if (!isAdmin) return content;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer focus:outline-none">{content}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1.5 bg-[oklch(0.24_0.02_250)] border-[oklch(0.30_0.02_250)]" sideOffset={6}>
        <div className="px-2 py-1 text-[0.6875rem] font-medium text-[oklch(0.40_0.03_250)]">
          Online
        </div>
        {members.map((m) => (
          <DropdownMenuItem key={m.id} className="gap-2 rounded-[4px] px-2 py-1.5 text-xs cursor-default focus:bg-[oklch(0.20_0.02_250)]">
            <Avatar className="size-4">
              <AvatarImage src={m.info.image ?? undefined} />
              <AvatarFallback className="text-[7px] bg-[oklch(0.20_0.02_250)] text-[oklch(0.60_0.03_250)]">
                {m.info.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[oklch(0.82_0.02_250)] truncate">
              {m.info.name}
              {m.id === myId && <span className="text-[oklch(0.40_0.03_250)]"> (you)</span>}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
