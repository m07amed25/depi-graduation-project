"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, Share2 } from "lucide-react";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  isPending?: boolean;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim().length >= 2) {
      onSubmit(teamName.trim());
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTeamName("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Create a new team
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80">
            Give your team a name. You can invite members after creation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="E.g. Frontend Engineering"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="h-11 bg-background/50 border-border/50 focus-visible:ring-primary/30 transition-shadow"
              autoFocus
              maxLength={40}
            />
          </div>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogAction
              type="button"
              onClick={() => handleOpenChange(false)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 sm:flex-none"
            >
              Cancel
            </AlertDialogAction>
            <Button
              type="submit"
              disabled={teamName.trim().length < 2 || isPending}
              className="flex-1 sm:flex-none"
            >
              {isPending ? "Creating..." : "Create Team"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string, role: "ADMIN" | "MEMBER") => void;
  isPending?: boolean;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email.trim(), role);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail("");
      setRole("MEMBER");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Invite a member
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80">
            Enter the email of an existing user to invite them to this team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 mb-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border/50 focus-visible:ring-primary/30"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Role
              </label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")}
                className="bg-background/50 border-border/50 focus:ring-primary/30"
              >
                <option value="MEMBER">Member — can view & comment</option>
                <option value="ADMIN">
                  Admin — can manage repos & members
                </option>
              </Select>
            </div>
          </div>
          <AlertDialogFooter className="sm:justify-between border-t border-border/40 pt-4">
            <AlertDialogAction
              type="button"
              onClick={() => handleOpenChange(false)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 sm:flex-none"
            >
              Cancel
            </AlertDialogAction>
            <Button
              type="submit"
              disabled={!email.trim() || isPending}
              className="flex-1 sm:flex-none relative overflow-hidden group"
            >
              <span className="relative inline-flex items-center">
                {isPending ? "Inviting..." : "Send Invite"}
              </span>
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface Repository {
  id: string;
  fullName: string;
  private: boolean;
}

interface ShareRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositories: Repository[];
  onShare: (repositoryId: string) => void;
  isPending?: boolean;
}

export function ShareRepoDialog({
  open,
  onOpenChange,
  repositories,
  onShare,
  isPending = false,
}: ShareRepoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Share a repository
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80">
            Select one of your connected repositories to share with this team.
            All team members will be able to view PRs and reviews.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-64 overflow-y-auto space-y-2 py-4 mb-2 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {repositories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6">
              <FolderGit2 className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-foreground">
                No repositories available
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                You either don&apos;t own any repositories or they are all already
                shared.
              </p>
            </div>
          )}
          {repositories.map((repo) => (
            <button
              key={repo.id}
              className="group/sharebtn w-full flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/60 hover:border-primary/30 transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onShare(repo.id)}
              disabled={isPending}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-background shadow-sm border border-border/50 group-hover/sharebtn:border-primary/20 transition-colors">
                  <FolderGit2 className="size-4 text-muted-foreground group-hover/sharebtn:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover/sharebtn:text-primary transition-colors">
                    {repo.fullName}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1 text-[9px] px-1.5 py-0 bg-muted-foreground/10 text-muted-foreground font-medium rounded-sm"
                  >
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
              </div>
              <div className="size-8 rounded-full flex items-center justify-center bg-primary/5 text-primary opacity-0 group-hover/sharebtn:opacity-100 transition-all -translate-x-2 group-hover/sharebtn:translate-x-0">
                <Share2 className="size-4" />
              </div>
            </button>
          ))}
        </div>
        <AlertDialogFooter className="border-t border-border/40 pt-4">
          <AlertDialogAction className="w-full sm:w-auto">
            Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  teamName,
  onConfirm,
  isPending = false,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Delete team?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all members and unlink shared repositories. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => onOpenChange(false)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Cancel
          </AlertDialogAction>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
