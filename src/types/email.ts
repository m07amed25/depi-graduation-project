import type { Plan } from "@/lib/plan";


export interface BaseEmailParams {
  to: string;
  subject: string;
}

export interface TeamMemberAddedEmailParams {
  to: string;
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  inviterEmail: string;
  teamName: string;
  teamId: string;
  teamSlug: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  teamUrl: string;
  needsGithubConnection?: boolean;
}

export interface GithubConnectionWarningEmailParams {
  to: string;
  userName: string;
}

export interface SupportReplyEmailParams {
  to: string;
  originalMessage: string;
  replyMessage: string;
}

export interface AdminPromotedEmailParams {
  to: string;
  userName: string;
  promotedByName: string;
}

export interface AdminDemotedEmailParams {
  to: string;
  userName: string;
  demotedByName: string;
}

export interface PlanChangedEmailParams {
  to: string;
  userName: string;
  oldPlan: string;
  newPlan: string;
  expiresAt: Date | null;
  changedBy: string;
  overrides?: {
    repos?: number | null;
    reviews?: number | null;
    seats?: number | null;
  };
}

import type { ReviewStatus } from "@/lib/constants";
export type { ReviewStatus } from "@/lib/constants";

export interface ReviewCompletionEmailParams {
  to: string;
  recipientName: string;
  reviewerName: string;
  reviewerEmail: string;
  prTitle: string;
  prNumber: number;
  prUrl: string;
  repositoryName: string;
  repositoryFullName: string;
  reviewStatus: ReviewStatus;
  summary?: string;
  issuesFound?: number;
  viewReviewUrl: string;
}

export interface SecurityAlertEmailParams {
  to: string;
  recipientName: string;
  repositoryName: string;
  repositoryFullName: string;
  prNumber: number;
  criticalCount: number;
  highCount: number;
  viewReviewUrl: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

export interface EmailEnvConfig {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  SMTP_FROM_NAME: string;
  APP_URL: string;
}

export { REVIEW_STATUS_CONFIG } from "@/lib/constants";
