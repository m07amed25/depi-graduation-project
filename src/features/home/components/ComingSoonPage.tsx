"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Code2,
  Github,
  Star,
  Bell,
  ArrowRight,
  Twitter,
  Linkedin,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


interface ComingSoonPageProps {
  title: string;
  description?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}


// Target: 90 days from the time the module first loads (stable reference)
const LAUNCH_DATE = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

function calcTimeLeft(): TimeLeft {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/* ─── Sub-components ─────────────────────────────────────── */

function CountUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-white/4 border border-white/10 flex items-center justify-center overflow-hidden">
        {/* inner glow */}
        <div className="absolute inset-0 bg-linear-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        <span className="relative font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
          {display}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function OrbitRing({
  size,
  duration,
  delay,
  clockwise = true,
  dotColor = "bg-indigo-400",
}: {
  size: number;
  duration: number;
  delay: number;
  clockwise?: boolean;
  dotColor?: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full border border-white/6"
      style={{ width: size, height: size }}
      animate={{ rotate: clockwise ? 360 : -360 }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      {/* dot on the ring */}
      <span
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full",
          dotColor,
        )}
      />
    </motion.div>
  );
}

function FloatingParticle({
  left,
  top,
  duration,
  delay,
}: {
  left: string;
  top: string;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute h-px w-px rounded-full bg-white/60 pointer-events-none"
      style={{ left, top }}
      animate={{ y: [0, -40, 0], opacity: [0, 1, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/* ─── Dot-grid background ────────────────────────────────── */

function DotGrid() {
  return (
    <div className="coming-soon-dot-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
  );
}

/* ─── Static particle data (module-scope, stable) ──────────── */

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 5.3 + 2) % 100}%`,
  top: `${(i * 7.7 + 10) % 100}%`,
  duration: 4 + (i % 5),
  delay: (i * 0.37) % 5,
}));

/* ─── Main component ─────────────────────────────────────── */

export function ComingSoonPage({
  title,
  description = "We're crafting something exceptional. Stay tuned for updates.",
}: ComingSoonPageProps) {
  const shouldReduceMotion = useReducedMotion();

  /* countdown */
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft());
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  /* notify form */
  const [email, setEmail] = useState("");
  const [notifyState, setNotifyState] = useState<"idle" | "success">("idle");

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // UI-only — replace with real API call when backend is ready
    setNotifyState("success");
  }


  const fadeUp = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: "easeOut" as const, delay },
        };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Dot grid */}
        <DotGrid />
        {/* Primary glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-600/6 rounded-full blur-3xl" />
        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <FloatingParticle key={i} left={p.left} top={p.top} duration={p.duration} delay={p.delay} />
        ))}
      </div>

      {/* ── Top accent line ── */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-indigo-500/50 to-transparent shrink-0" />

      {/* ── Header ── */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-5">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 group-hover:border-indigo-400/60 transition-all duration-300">
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Code{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
                Catch
              </span>
            </span>
          </Link>

          <a
            href="https://github.com/m07amed25/DevReview-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Star on GitHub</span>
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400/50" aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-10">

          {/* Orbital hero graphic */}
          <motion.div
            className="relative flex items-center justify-center"
            {...(shouldReduceMotion ? {} : { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.7, ease: "easeOut" } })}
          >
            {/* Rings */}
            <OrbitRing size={180} duration={20} delay={0} clockwise dotColor="bg-indigo-400" />
            <OrbitRing size={240} duration={30} delay={5} clockwise={false} dotColor="bg-purple-400" />
            <OrbitRing size={300} duration={45} delay={10} clockwise dotColor="bg-blue-400/60" />

            {/* Core icon */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500/25 to-purple-500/25 border border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.25)]">
              <Sparkles className="h-8 w-8 text-indigo-300" aria-hidden="true" />
            </div>
          </motion.div>

          {/* Status badge */}
          <motion.div {...fadeUp(0.15)}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-widest uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
              </span>
              In Development
            </span>
          </motion.div>

          {/* Title */}
          <motion.div {...fadeUp(0.25)} className="-mt-4">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
              <span className="text-transparent bg-clip-text bg-linear-to-br from-white via-zinc-100 to-zinc-400">
                {title}
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            {...fadeUp(0.35)}
            className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-md -mt-4"
          >
            {description}
          </motion.p>

          {/* Countdown */}
          <motion.div {...fadeUp(0.45)} className="w-full">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Estimated launch in
            </p>
            <div className="flex items-start justify-center gap-3 sm:gap-5">
              <CountUnit value={timeLeft.days} label="Days" />
              <span className="text-zinc-600 text-2xl font-light mt-4 select-none">:</span>
              <CountUnit value={timeLeft.hours} label="Hours" />
              <span className="text-zinc-600 text-2xl font-light mt-4 select-none">:</span>
              <CountUnit value={timeLeft.minutes} label="Mins" />
              <span className="text-zinc-600 text-2xl font-light mt-4 select-none">:</span>
              <CountUnit value={timeLeft.seconds} label="Secs" />
            </div>
          </motion.div>

          {/* Notify form */}
          <motion.div {...fadeUp(0.55)} className="w-full max-w-md">
            {notifyState === "idle" ? (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" aria-hidden="true" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-white/4 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shrink-0"
                >
                  <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
                  Notify Me
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
                </Button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm font-medium"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                You&apos;re on the list — we&apos;ll notify you at launch!
              </motion.div>
            )}
            <p className="mt-2.5 text-[11px] text-zinc-600">
              No spam. Unsubscribe any time.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div {...fadeUp(0.6)} className="w-full flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-zinc-600 font-medium">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </motion.div>

          {/* Actions */}
          <motion.div {...fadeUp(0.65)} className="flex flex-col sm:flex-row items-center gap-3 -mt-4">
            <Button
              asChild
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 bg-transparent w-full sm:w-auto"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Back to Home
              </Link>
            </Button>
            <Button
              asChild
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white w-full sm:w-auto"
              variant="ghost"
            >
              <a
                href="https://github.com/m07amed25/DevReview-AI"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-2" aria-hidden="true" />
                Follow on GitHub
              </a>
            </Button>
          </motion.div>

          {/* Social row */}
          <motion.div {...fadeUp(0.7)} className="flex items-center gap-3 -mt-4">
            {[
              { label: "Twitter", href: "https://twitter.com/codecatch", icon: Twitter },
              { label: "LinkedIn", href: "https://linkedin.com/company/code-catch", icon: Linkedin },
              { label: "Email", href: "mailto:codecatch27@gmail.com", icon: Mail },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ))}
          </motion.div>

        </div>
      </main>

      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} Code Catch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
