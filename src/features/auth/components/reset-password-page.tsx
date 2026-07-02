"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword) { setError("Password is required."); return; }
    if (newPassword.length < 8) { setError("Minimum 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      const res = await authClient.resetPassword({ newPassword, token });
      if (res.error) {
        setError(res.error.message ?? "Reset failed. The link may have expired.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/sign-in"), 3000);
      }
    } catch {
      setError("Something went wrong. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-[360px] space-y-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6" />
          <span className="text-sm font-bold tracking-tight">Code <span className="text-primary">Catch</span></span>
        </Link>

        {!token ? (
          <div className="space-y-4">
            <div className="flex size-9 items-center justify-center rounded-sm border border-border bg-destructive/5">
              <AlertCircle className="size-4 text-destructive" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Invalid link</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">This reset link is invalid or has expired.</p>
            </div>
            <Link href="/forgot-password" className="inline-block text-[13px] text-primary font-medium hover:underline">Request a new link</Link>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="flex size-9 items-center justify-center rounded-sm border border-border bg-emerald-500/5">
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Password updated</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">Redirecting to sign in...</p>
            </div>
            <Link href="/sign-in" className="inline-block text-[13px] text-primary font-medium hover:underline">Sign in now</Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Set new password</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">Choose a strong password. Minimum 8 characters.</p>
            </div>

            <div className="space-y-3.5">
              {error && (
                <div className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError("")} aria-label="Dismiss" className="hover:text-destructive/70 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-[13px]">New password</Label>
                  <div className="relative">
                    <Input id="new-password" type={showNew ? "text" : "password"} placeholder="Min 8 characters" autoComplete="new-password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} disabled={loading} className="pr-10" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" onClick={() => setShowNew(!showNew)} tabIndex={-1} aria-label={showNew ? "Hide password" : "Show password"}>
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-[13px]">Confirm password</Label>
                  <div className="relative">
                    <Input id="confirm-password" type={showConfirm ? "text" : "password"} placeholder="Repeat password" autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} disabled={loading} className="pr-10" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} aria-label={showConfirm ? "Hide password" : "Show password"}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-9 cursor-pointer">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update password"}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordContent /></Suspense>;
}
