export interface CommitNode {
  sha: string;
  message: string;
  author: {
    login: string;
    avatarUrl: string | null;
  };
  date: string;
  htmlUrl: string;
  parents: string[];
  branch?: string;
  branches?: string[];
  isMergeCommit?: boolean;
}

export interface Branch {
  name: string;
  sha: string;
  isProtected: boolean;
}

export { BRANCH_COLORS } from "@/lib/constants";
import { BRANCH_COLORS } from "@/lib/constants";

export function getBranchColor(branchName: string): string {
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLORS[Math.abs(hash) % BRANCH_COLORS.length];
}
