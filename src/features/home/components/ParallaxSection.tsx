"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number; // -1 to 1: negative = slower, positive = faster
  className?: string;
}

function ParallaxInner({ children, speed = 0, className }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 80, speed * -80]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

export function ParallaxSection(props: ParallaxSectionProps) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <div className={props.className}>{props.children}</div>;
  }

  return <ParallaxInner {...props} />;
}
