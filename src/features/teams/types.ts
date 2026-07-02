export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";

export type TeamActionType =
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "UPDATE_ROLE"
  | "SHARE_REPOSITORY"
  | "UNSHARE_REPOSITORY"
  | "DELETE_TEAM"
  | "REVIEW_PR"
  | "APPROVE_DISCUSSION";

export type TeamActionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TeamMemberPreview {
  id: string;
  name: string;
  image: string | null;
}

export interface TeamMember {
  id: string;
  role: TeamRole;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface TeamRepository {
  id: string;
  fullName: string;
  private: boolean;
}

export interface PendingAction {
  id: string;
  actionType: TeamActionType;
  status: TeamActionStatus;
  createdAt: Date;
  metadata?: Record<string, unknown>;
  team?: {
    id: string;
    name: string;
  };
}

export interface TeamData {
  id: string;
  name: string;
  slug: string;
  role: TeamRole;
  memberCount: number;
  repoCount: number;
  description?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  currentUserRole?: TeamRole;
  members?: TeamMember[];
  repositories?: TeamRepository[];
}

export const ACTIONS_REQUIRING_APPROVAL: TeamActionType[] = [
  "INVITE_MEMBER",
  "REMOVE_MEMBER",
  "UPDATE_ROLE",
  "SHARE_REPOSITORY",
  "UNSHARE_REPOSITORY",
  "DELETE_TEAM",
] as const;

export const ROLE_DISPLAY_NAMES: Record<TeamRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  OWNER: [
    "manage_team",
    "manage_members",
    "manage_repositories",
    "delete_team",
  ],
  ADMIN: ["manage_members", "manage_repositories"],
  MEMBER: ["view_team", "view_repositories", "create_reviews"],
};
