"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, MoreVertical, Shield, Trash2, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamRole, TeamMember } from "@/features/teams/types";

export type { TeamMember };

const roleIcon = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
} as const;

const roleColor = {
  OWNER: "text-amber-500",
  ADMIN: "text-blue-500",
  MEMBER: "text-muted-foreground",
} as const;

export interface TeamMemberListProps {
  members: TeamMember[];
  isOwner: boolean;
  currentUserRole: TeamRole;
  onUpdateRole?: (userId: string, role: "ADMIN" | "MEMBER") => void;
  onRemoveMember?: (userId: string) => void;
  isUpdatingRole?: boolean;
  isRemoving?: boolean;
}

export function TeamMemberList({
  members,
  isOwner,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
  isUpdatingRole = false,
  isRemoving = false,
}: TeamMemberListProps) {
  const isOwnerOrAdmin =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
        <div>
          <CardTitle className="text-lg flex items-center gap-2 font-semibold">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            Members
          </CardTitle>
          <CardDescription className="mt-1.5">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 p-3">
        {members.map((member) => {
          const RoleIcon = roleIcon[member.role] ?? User;
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-9 ring-2 ring-background shadow-sm group-hover:ring-primary/20 transition-all">
                  <AvatarImage
                    src={member.user.image ?? undefined}
                    alt={member.user.name}
                  />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {member.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {member.user.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs", roleColor[member.role])}
                >
                  <RoleIcon className="size-3 mr-1" />
                  {member.role}
                </Badge>
                {isOwner && member.role !== "OWNER" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateRole?.(
                            member.user.id,
                            member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                          )
                        }
                        disabled={isUpdatingRole}
                      >
                        <Shield className="size-4 mr-2" />
                        {member.role === "ADMIN"
                          ? "Demote to Member"
                          : "Promote to Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onRemoveMember?.(member.user.id)}
                        disabled={isRemoving}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Loading skeleton
export function TeamMemberListSkeleton() {
  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted animate-pulse">
            <Users className="size-4" />
          </div>
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
