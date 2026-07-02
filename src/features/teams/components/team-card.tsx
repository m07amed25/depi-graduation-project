"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Users,
  FolderGit2,
  ArrowRight,
  Crown,
  Shield,
  User,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamRole, TeamMemberPreview } from "@/features/teams/types";
import { ROLE_DISPLAY_NAMES } from "@/features/teams/types";

const roleIcon = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
} as const;

export type { TeamRole, TeamMemberPreview };

export interface TeamCardProps {
  id: string;
  name: string;
  slug: string;
  role: TeamRole;
  memberCount: number;
  repoCount: number;
  description?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  members?: TeamMemberPreview[];
  index?: number;
  onSettingsClick?: (teamId: string) => void;
}

const gradients = [
  "bg-blue-500/15 text-blue-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-violet-500/15 text-violet-400",
  "bg-amber-500/15 text-amber-400",
  "bg-rose-500/15 text-rose-400",
];

const accentBorders = [
  "border-t-blue-500/60",
  "border-t-emerald-500/60",
  "border-t-violet-500/60",
  "border-t-amber-500/60",
  "border-t-rose-500/60",
];

// Format relative time
function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return "Recently";

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${diffYears} years ago`;
}

export function TeamCard({
  id,
  name,
  slug,
  role,
  memberCount,
  repoCount,
  description,
  createdAt,
  updatedAt,
  members = [],
  index = 0,
  onSettingsClick,
}: TeamCardProps) {
  const RoleIcon = roleIcon[role];
  const colorIndex = name.length % gradients.length;
  const gradient = gradients[colorIndex];
  const accentBorder = accentBorders[colorIndex];

  return (
    <Link
      key={id}
      href={`/teams/${id}`}
      className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg group"
    >
      <Card className={cn(
        "h-full border-t-2 hover:border-primary/50 transition-colors bg-card shadow-sm rounded-lg flex flex-col relative",
        accentBorder
      )}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={cn(
                "size-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0",
                gradient
              )}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 pt-0.5">
              <CardTitle className="text-[15px] font-semibold leading-tight truncate">
                {name}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-1.5 truncate tracking-wide font-mono">
                /{slug}
              </p>
            </div>
          </div>

          {/* Quick action button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4"
            onClick={(e) => {
              e.preventDefault();
              onSettingsClick?.(id);
            }}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-end space-y-5">
          {/* Stats row */}
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-blue-400/70" />
              <span className="font-medium text-foreground/80">{memberCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FolderGit2 className="size-4 text-emerald-400/70" />
              <span className="font-medium text-foreground/80">{repoCount}</span>
            </div>
          </div>

          {/* Member avatars preview */}
          {members.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                {members.slice(0, 5).map((member) => (
                  <Avatar
                    key={member.id}
                    className="size-6 border-2 border-background"
                  >
                    <AvatarImage
                      src={member.image ?? undefined}
                      alt={member.name}
                    />
                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberCount > 5 && (
                  <div className="size-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    +{memberCount - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer with role and time */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              role === "OWNER" ? "text-amber-400" : role === "ADMIN" ? "text-blue-400" : "text-muted-foreground"
            )}>
              <RoleIcon className="size-3.5" />
              <span>
                {role === "OWNER"
                  ? "Owner"
                  : role === "ADMIN"
                    ? "Admin"
                    : "Member"}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              {createdAt ? formatRelativeTime(createdAt) : "Active"}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card className="rounded-lg shadow-sm border-border/50 h-[180px]">
      <CardHeader className="p-5 flex flex-row items-center gap-4 space-y-0">
        <div className="size-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
        </div>
        <div className="pt-4 border-t border-border/50 flex justify-between">
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
