"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  InviteMemberDialog as SharedInviteMemberDialog,
  ShareRepoDialog as SharedShareRepoDialog,
} from "./dialogs";

export const InviteMemberDialog = SharedInviteMemberDialog;

interface ShareRepo {
  id: string;
  fullName: string;
  private: boolean;
}

interface ShareRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repos: ShareRepo[];
  onShare: (repoId: string) => void;
  isPending: boolean;
}

export function ShareRepoDialog({
  open,
  onOpenChange,
  repos,
  onShare,
  isPending,
}: ShareRepoDialogProps) {
  return (
    <SharedShareRepoDialog
      open={open}
      onOpenChange={onOpenChange}
      repositories={repos}
      onShare={onShare}
      isPending={isPending}
    />
  );
}

type ActionType =
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "UPDATE_ROLE"
  | "SHARE_REPOSITORY"
  | "UNSHARE_REPOSITORY"
  | "DELETE_TEAM"
  | "REVIEW_PR"
  | "APPROVE_DISCUSSION";

interface RequestActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (actionType: ActionType) => void;
  isPending: boolean;
}

export function RequestActionDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: RequestActionDialogProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Request an Action
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80">
            Request an action that requires approval from a team administrator.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4 mb-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Action Type
            </label>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-background/50 border-border/50 focus:ring-primary/30"
            >
              <option value="">Select an action...</option>
              <option value="INVITE_MEMBER">Invite Member</option>
              <option value="REMOVE_MEMBER">Remove Member</option>
              <option value="UPDATE_ROLE">Update Member Role</option>
              <option value="SHARE_REPOSITORY">Share Repository</option>
              <option value="UNSHARE_REPOSITORY">Unshare Repository</option>
              <option value="REVIEW_PR">Review PR</option>
              <option value="APPROVE_DISCUSSION">Approve Discussion</option>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Your request will be sent to team administrators for review.
          </p>
        </div>
        <AlertDialogFooter className="border-t border-border/40 pt-4">
          <AlertDialogAction
            type="button"
            onClick={() => {
              onOpenChange(false);
              setSelectedType("");
            }}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Cancel
          </AlertDialogAction>
          <Button
            type="submit"
            disabled={!selectedType || isPending}
            onClick={() => {
              if (selectedType) {
                onSubmit(selectedType as ActionType);
                onOpenChange(false);
                setSelectedType("");
              }
            }}
            className="relative overflow-hidden group"
          >
            <span className="relative inline-flex items-center">
              {isPending ? "Submitting..." : "Submit Request"}
            </span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
