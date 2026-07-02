"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function NavigationLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const prevPathname = useRef(pathname);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasFeedbackButton, setHasFeedbackButton] = useState(false);

  // Listen for clicks on internal anchor tags — fires before Next.js processes navigation
  useEffect(() => {
    const start = () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);

      setProgress(0);
      setVisible(true);

      const steps = [15, 30, 45, 58, 68, 76, 82, 87, 91, 94];
      let i = 0;
      progressTimer.current = setInterval(() => {
        if (i < steps.length) {
          setProgress(steps[i]!);
          i++;
        } else {
          clearInterval(progressTimer.current!);
        }
      }, 250);
    };

    const handleClick = (e: MouseEvent) => {
      // Walk up the DOM from the clicked element to find the nearest <a>
      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== "A") {
        el = el.parentElement;
      }
      if (!el) return;

      const anchor = el as HTMLAnchorElement;
      const href = anchor.getAttribute("href");

      // Skip: no href, external, new-tab, download, hash-only, modifier keys
      if (
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      // Skip if already on this page
      const targetPath = href.split("?")[0]?.split("#")[0] ?? "";
      if (targetPath === window.location.pathname) return;

      start();
    };

    const handlePop = () => start();

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePop);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePop);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setHasFeedbackButton(!!document.querySelector('[data-feedback-button]'));
    }
  }, [visible]);

  // Detect route settlement — pathname changes once the new page renders
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (progressTimer.current) clearInterval(progressTimer.current);

    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Top progress bar */}
          <motion.div
            key="nav-bar"
            className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-0.75 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* dim track */}
            <div className="absolute inset-0 bg-primary/10" />

            {/* filled portion */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-r-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.75) 70%, oklch(0.7 0.22 265))",
                boxShadow:
                  "0 0 10px 2px hsl(var(--primary)/0.55), 0 0 22px 4px hsl(var(--primary)/0.25)",
              }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: progress === 100 ? 0.18 : 0.45,
                ease: "easeOut",
              }}
            />

            {/* shimmer sweep */}
            <motion.div
              className="absolute inset-y-0 w-20"
              style={{
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)",
                left: `calc(${progress}% - 5rem)`,
              }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.div>

          {/* Spinning chip — bottom-right, above feedback button if present */}
          <motion.div
            key="nav-spinner"
            className={`pointer-events-none fixed ${hasFeedbackButton ? 'bottom-20' : 'bottom-6'} right-6 z-9999`}
            initial={{ opacity: 0, scale: 0.75, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-background/80 shadow-lg backdrop-blur-sm">
              {/* arc */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: "hsl(var(--primary))",
                  borderRightColor: "hsl(var(--primary)/0.35)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              {/* centre dot */}
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.35, 1], opacity: [1, 0.55, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

