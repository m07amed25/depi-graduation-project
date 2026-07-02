"use client";

import { FaGithub } from "react-icons/fa";
import { AlertCircle, Building2, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

interface FieldErrors { email?: string; password?: string; }

function getUrlError(sp: Pick<URLSearchParams, "get">): string {
  const code = sp.get("error");
  if (!code) return "";
  const desc = sp.get("error_description");
  return decodeURIComponent(desc ?? (code === "FORBIDDEN" ? "Your account has been banned." : "Sign-in failed."));
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => getUrlError(searchParams));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ssoMode, setSsoMode] = useState(false);
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState("");

  const busy = loading || githubLoading || ssoLoading;

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email.";
    if (!password) e.password = "Password is required.";
    setFieldErrors(e);
    return !Object.keys(e).length;
  };

  const clearField = (f: keyof FieldErrors) => setFieldErrors((p) => { const n = { ...p }; delete n[f]; return n; });

  const handleEmail = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await signIn.email({ email, password });
      if (r.error) { setError(r.error.message || "Sign-in failed."); setLoading(false); }
      else router.push("/repo");
    } catch { setError("Something went wrong."); setLoading(false); }
  };

  const handleGithub = async () => {
    setError("");
    setGithubLoading(true);
    try {
      const r = await signIn.social({ provider: "github", callbackURL: "/repo", errorCallbackURL: "/sign-in" });
      if (r?.error) { setError(r.error.message ?? "GitHub sign-in failed."); setGithubLoading(false); }
    } catch { setError("GitHub sign-in failed."); setGithubLoading(false); }
  };

  const handleSso = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSsoError("");
    const v = ssoEmail.trim();
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setSsoError("Enter a valid work email."); return; }
    setSsoLoading(true);
    try {
      const r = await authClient.signIn.sso({ email: v, callbackURL: "/repo", errorCallbackURL: "/sign-in" });
      if (r?.error) { setSsoError(r.error.message ?? "SSO failed."); setSsoLoading(false); }
    } catch { setSsoError("SSO failed."); setSsoLoading(false); }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-[360px] space-y-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6" />
          <span className="text-sm font-bold tracking-tight">Code <span className="text-primary">Catch</span></span>
        </Link>

        <div>
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Continue to your dashboard.</p>
        </div>

        <div className="space-y-3.5">
          <Button variant="outline" onClick={handleGithub} disabled={busy} className="w-full h-9 cursor-pointer">
            {githubLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaGithub className="mr-2 h-4 w-4" />}
            Continue with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[11px]"><span className="bg-background px-2 text-muted-foreground">or</span></div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss" className="hover:text-destructive/70 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}

          <form onSubmit={handleEmail} noValidate className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px]">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clearField("email"); }} disabled={busy} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-err" : undefined} />
              {fieldErrors.email && <p id="email-err" className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px]">Password</Label>
                <Link href="/forgot-password" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }} disabled={busy} aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? "pw-err" : undefined} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p id="pw-err" className="text-xs text-destructive">{fieldErrors.password}</p>}
            </div>
            <Button type="submit" disabled={busy} className="w-full h-9 cursor-pointer">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="text-center text-[13px] text-muted-foreground">
            No account? <Link href="/sign-up" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>

          {!ssoMode ? (
            <button type="button" onClick={() => setSsoMode(true)} disabled={busy} className="flex items-center justify-center gap-1.5 w-full text-[12px] text-muted-foreground hover:text-foreground transition-colors pt-2 cursor-pointer">
              <Building2 className="h-3.5 w-3.5" />
              Enterprise SSO
            </button>
          ) : (
            <form onSubmit={handleSso} className="space-y-2.5 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="sso-email" className="text-[12px] text-muted-foreground">Work email</Label>
                <Input id="sso-email" type="email" placeholder="name@company.com" value={ssoEmail} onChange={(e) => { setSsoEmail(e.target.value); setSsoError(""); }} disabled={ssoLoading} aria-invalid={!!ssoError} autoFocus />
                {ssoError && <p className="text-xs text-destructive">{ssoError}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setSsoMode(false); setSsoError(""); setSsoEmail(""); }} disabled={ssoLoading} className="cursor-pointer">Cancel</Button>
                <Button type="submit" size="sm" disabled={ssoLoading} className="flex-1 cursor-pointer">
                  {ssoLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Continue
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function SignInPage() {
  return <Suspense fallback={null}><SignInContent /></Suspense>;
}
