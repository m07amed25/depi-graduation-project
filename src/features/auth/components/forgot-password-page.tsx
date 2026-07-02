"use client";

import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requestReset = trpc.home.requestPasswordReset.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email."); return; }
    requestReset.mutate({ email });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-[360px] space-y-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6" />
          <span className="text-sm font-bold tracking-tight">Code <span className="text-primary">Catch</span></span>
        </Link>

        {success ? (
          <div className="space-y-4">
            <div className="flex size-9 items-center justify-center rounded-sm border border-border bg-emerald-500/5">
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Check your email</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                If an account exists for <span className="text-foreground font-medium">{email}</span>, you will receive a reset link. It expires in 5 minutes.
              </p>
            </div>
            <p className="text-[12px] text-muted-foreground">Not in your inbox? Check spam.</p>
            <Link href="/sign-in" className="inline-block text-[13px] text-primary font-medium hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Reset password</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">Enter your email to receive a reset link.</p>
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
                  <Label htmlFor="email" className="text-[13px]">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} disabled={requestReset.isPending} />
                </div>
                <Button type="submit" disabled={requestReset.isPending} className="w-full h-9 cursor-pointer">
                  {requestReset.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send reset link"}
                </Button>
              </form>

              <p className="text-center text-[13px] text-muted-foreground pt-2">
                Remember your password? <Link href="/sign-in" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  return <Suspense fallback={null}><ForgotPasswordContent /></Suspense>;
}
