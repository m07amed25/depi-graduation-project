"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_MAP: Record<string, { bar: string; text: string; link: string; close: string }> = {
  indigo: {
    bar: "bg-indigo-600",
    text: "text-white",
    link: "underline decoration-white/60 hover:decoration-white font-semibold",
    close: "hover:bg-indigo-700",
  },
  emerald: {
    bar: "bg-emerald-600",
    text: "text-white",
    link: "underline decoration-white/60 hover:decoration-white font-semibold",
    close: "hover:bg-emerald-700",
  },
  amber: {
    bar: "bg-amber-400",
    text: "text-amber-950",
    link: "underline decoration-amber-700/60 hover:decoration-amber-700 font-semibold",
    close: "hover:bg-amber-500",
  },
  rose: {
    bar: "bg-rose-600",
    text: "text-white",
    link: "underline decoration-white/60 hover:decoration-white font-semibold",
    close: "hover:bg-rose-700",
  },
  violet: {
    bar: "bg-violet-600",
    text: "text-white",
    link: "underline decoration-white/60 hover:decoration-white font-semibold",
    close: "hover:bg-violet-700",
  },
};

interface AnnouncementBannerProps {
  text: string;
  link?: string;
  linkText?: string;
  color?: string;
}

export function AnnouncementBanner({
  text,
  link,
  linkText,
  color = "indigo",
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const theme = COLOR_MAP[color] ?? COLOR_MAP.indigo;

  // Keep a CSS variable on <html> so the fixed nav can offset itself
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty(
        "--banner-h",
        `${el.offsetHeight}px`,
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty("--banner-h", "0px");
    };
  }, []);

  if (dismissed || !text) return null;

  return (
    <div
      ref={ref}
      role="banner"
      aria-label="Announcement"
      className={cn(
        "fixed top-0 left-0 right-0 z-60 flex items-center justify-center gap-3 px-4 py-2.5 text-sm",
        theme.bar,
        theme.text,
      )}
    >
      <p className="text-center leading-snug">
        {text}
        {link && (
          <>
            {" "}
            <Link
              href={link}
              target={link.startsWith("http") ? "_blank" : undefined}
              rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
              className={cn("ml-1", theme.link)}
            >
              {linkText || "Learn more"}
            </Link>
          </>
        )}
      </p>

      <button
        onClick={() => {
          document.documentElement.style.setProperty("--banner-h", "0px");
          setDismissed(true);
        }}
        aria-label="Dismiss announcement"
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition-colors",
          theme.close,
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
