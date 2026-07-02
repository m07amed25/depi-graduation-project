"use client";

import { usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NavigationLoader } from "./navigation-loader";

interface PageTransitionProviderProps {
  children: ReactNode;
}

export function PageTransitionProvider({
  children,
}: PageTransitionProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      <NavigationLoader />
      {children}
    </>
  );
}

// Fade page transition
interface FadePageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function FadePageTransition({
  children,
  className = "",
}: FadePageTransitionProps) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Slide page transition
interface SlidePageTransitionProps {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right" | "up" | "down";
}

export function SlidePageTransition({
  children,
  className = "",
  direction = "left",
}: SlidePageTransitionProps) {
  const pathname = usePathname();

  const getInitialValues = () => {
    switch (direction) {
      case "left":
        return { x: -50, opacity: 0 };
      case "right":
        return { x: 50, opacity: 0 };
      case "up":
        return { y: -50, opacity: 0 };
      case "down":
        return { y: 50, opacity: 0 };
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, direction]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={getInitialValues()}
        animate={{ x: 0, y: 0, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Scale page transition
interface ScalePageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function ScalePageTransition({
  children,
  className = "",
}: ScalePageTransitionProps) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
