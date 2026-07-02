"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { motion, useInView } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useRef, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

const reasons = [
  "Free for open source and solo developers",
  "No credit card required to start",
  "Reviews in under 2 seconds per PR",
  "Works with private and public repos",
  "Cancel or downgrade anytime",
];

function AnimatedStat({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = usePrefersReducedMotion();
  const num = parseFloat(value);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView || reduceMotion || isNaN(num)) return;
    const duration = 600;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
      setDisplay(num % 1 === 0 ? Math.round(num * eased).toString() : (num * eased).toFixed(1));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, reduceMotion, num]);

  return <span ref={ref} className="font-mono font-medium">{reduceMotion || isNaN(num) ? value : display}{suffix}</span>;
}

export function CtaSection() {
  const [data] = trpc.home.getRecentUsers.useSuspenseQuery();

  return (
    <section className="border-t border-border py-24 sm:py-32" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-start">
          {/* Left: copy */}
          <div>
            <motion.h2
              id="cta-heading"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold tracking-tight leading-tight"
            >
              Your next PR deserves better.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 text-muted-foreground text-[0.9375rem] max-w-[48ch] leading-relaxed"
            >
              Stop shipping bugs you could have caught. Join thousands of developers who review smarter, ship faster, and sleep better.
            </motion.p>

            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } }}
              className="mt-6 space-y-2"
            >
              {reasons.map((r) => (
                <motion.li
                  key={r}
                  variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } } }}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{r}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors duration-150"
              >
                Get started free
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm hover:bg-muted transition-colors duration-150"
              >
                Compare plans
              </Link>
            </motion.div>
          </div>

          {/* Right: social proof + animated stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:w-[280px] space-y-6"
          >
            {data.recentUsers.length > 0 && (
              <div>
                <div className="flex -space-x-2">
                  {data.recentUsers.slice(0, 6).map((user, i) => (
                    <motion.div
                      key={user.id || i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="relative h-8 w-8 rounded-full border-2 border-background overflow-hidden bg-muted"
                    >
                      {user.image ? (
                        <Image src={user.image} alt="" fill className="object-cover" sizes="32px" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[11px] font-medium text-muted-foreground">
                          {(user.name || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Trusted by {data.totalUsers}+ developers
                </p>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg review time</span>
                <AnimatedStat value="1.2" suffix="s" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Languages</span>
                <AnimatedStat value="50" suffix="+" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <AnimatedStat value="99.9" suffix="%" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Setup time</span>
                <span className="font-mono font-medium">&lt;1 min</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
