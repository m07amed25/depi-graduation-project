"use client";

import { FaGithub } from "react-icons/fa";
import { AlertCircle, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

interface FieldErrors { name?: string; email?: string; password?: string; confirmPassword?: string; terms?: string; }

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong", "Strong"] as const;
  const colors = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-500"];
  return { score: s, label: labels[s], color: colors[s] };
}

export function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const busy = loading || githubLoading;

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Minimum 8 characters.";
    if (!confirmPassword) e.confirmPassword = "Confirm your password.";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords don't match.";
    if (!acceptedTerms) e.terms = "Accept the terms to continue.";
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
      const r = await signUp.email({ name, email, password });
      if (r.error) { setError(r.error.message || "Sign-up failed."); setLoading(false); }
      else router.push("/repo");
    } catch { setError("Something went wrong."); setLoading(false); }
  };

  const handleGithub = async () => {
    setError("");
    setGithubLoading(true);
    try {
      const r = await signIn.social({ provider: "github", callbackURL: "/repo", errorCallbackURL: "/sign-up" });
      if (r?.error) { setError(r.error.message ?? "GitHub sign-up failed."); setGithubLoading(false); }
    } catch { setError("GitHub sign-up failed."); setGithubLoading(false); }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-[360px] space-y-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6" />
          <span className="text-sm font-bold tracking-tight">Code <span className="text-primary">Catch</span></span>
        </Link>

        <div>
          <h1 className="text-lg font-semibold tracking-tight">Create an account</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Free to start. No credit card required.</p>
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
              <Label htmlFor="name" className="text-[13px]">Name</Label>
              <Input id="name" placeholder="Your name" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); clearField("name"); }} disabled={busy} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "name-err" : undefined} />
              {fieldErrors.name && <p id="name-err" className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px]">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clearField("email"); }} disabled={busy} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-err" : undefined} />
              {fieldErrors.email && <p id="email-err" className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px]">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }} disabled={busy} aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? "pw-err" : undefined} className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p id="pw-err" className="text-xs text-destructive">{fieldErrors.password}</p>}
              {password && !fieldErrors.password && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-sm transition-colors ${i < getStrength(password).score ? getStrength(password).color : "bg-border"}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{getStrength(password).label}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-[13px]">Confirm password</Label>
              <Input id="confirm" type="password" placeholder="Repeat password" autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }} disabled={busy} aria-invalid={!!fieldErrors.confirmPassword} aria-describedby={fieldErrors.confirmPassword ? "confirm-err" : undefined} />
              {fieldErrors.confirmPassword && <p id="confirm-err" className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
            </div>

            <label className="flex items-start gap-2.5 text-[12px] text-muted-foreground cursor-pointer pt-1">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => { setAcceptedTerms(e.target.checked); clearField("terms"); }} disabled={busy} className="mt-0.5 accent-primary" aria-invalid={!!fieldErrors.terms} />
              <span>I agree to the <Link href="/terms" className="text-foreground hover:underline">Terms</Link> and <Link href="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>.</span>
            </label>
            {fieldErrors.terms && <p className="text-xs text-destructive">{fieldErrors.terms}</p>}

            <Button type="submit" disabled={busy} className="w-full h-9 mt-1 cursor-pointer">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="text-center text-[13px] text-muted-foreground pt-1">
            Already have an account? <Link href="/sign-in" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
