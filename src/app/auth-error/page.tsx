"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowLeft,
  UserX,
  MailX,
  ShieldAlert,
  Link2Off,
  HelpCircle,
} from "lucide-react";

const ERROR_MAP: Record<
  string,
  { title: string; message: string; icon: typeof AlertTriangle; suggestion?: string }
> = {
  account_already_linked_to_different_user: {
    title: "Account Already Linked",
    message:
      "This social account is already connected to a different user. Each social account can only be linked to one user at a time.",
    icon: UserX,
    suggestion:
      "If you previously signed in with this provider, sign out and log in with that account instead. Or remove the link from the other account first.",
  },
  "email_doesn't_match": {
    title: "Email Mismatch",
    message:
      "The email on your social account doesn't match the email you signed up with.",
    icon: MailX,
    suggestion:
      "Make sure your social account uses the same email address, or update your profile email first.",
  },
  user_already_exists: {
    title: "User Already Exists",
    message: "An account with this email already exists. Try signing in instead.",
    icon: ShieldAlert,
    suggestion: "Go to the sign-in page and use your existing credentials.",
  },
  invalid_token: {
    title: "Invalid or Expired Token",
    message: "The authentication token is invalid or has expired.",
    icon: ShieldAlert,
    suggestion: "Please try the action again. If the issue persists, sign out and sign back in.",
  },
  oauth_account_already_used: {
    title: "Account Already In Use",
    message: "This social account is already associated with another user.",
    icon: Link2Off,
    suggestion:
      "Sign in with the account that originally used this social login, or use a different social account.",
  },
};

const DEFAULT_ERROR = {
  title: "Authentication Error",
  message: "Something went wrong during authentication. Please try again.",
  icon: AlertTriangle,
  suggestion: "If the problem persists, try signing out and signing back in.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "unknown";

  const errorInfo = ERROR_MAP[errorCode] ?? DEFAULT_ERROR;
  const Icon = errorInfo.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10">
              <Icon className="size-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
          <CardDescription className="text-sm mt-2">
            {errorInfo.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorInfo.suggestion && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border text-sm">
              <HelpCircle className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">{errorInfo.suggestion}</p>
            </div>
          )}

          <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
            <p className="text-[11px] text-muted-foreground font-mono">
              Error code: {errorCode}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full gap-2">
              <Link href="/profile">
                <ArrowLeft className="size-4" />
                Back to Profile
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full gap-2">
              <Link href="/repo">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
