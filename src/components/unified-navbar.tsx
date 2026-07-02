"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, FolderGit2, GitPullRequest, BarChart3, Users, CreditCard, Settings, ShieldCheck } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "./user-menu";
import { Notifications } from "./notifications";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const workspaceLinks = [
  { href: "/repo", label: "Repositories", icon: FolderGit2 },
  { href: "/reviews", label: "Reviews", icon: GitPullRequest },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function UnifiedNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close workspace dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-banner-offset w-full z-50 transition-[background-color,border-color] duration-150",
          scrolled
            ? "border-b border-border bg-background/95 backdrop-blur-sm"
            : "border-b border-transparent bg-transparent",
        )}
        role="banner"
      >
        <nav className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground font-semibold text-[0.9375rem] tracking-tight"
            aria-label="Code Catch home"
          >
            <Logo className="h-7 w-auto" />
            <span>Code Catch</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-sm transition-colors duration-150",
                  mounted && pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Workspace dropdown (authenticated only) */}
            {session?.user && (
              <div ref={wsRef} className="relative">
                <button
                  onClick={() => setWsOpen(!wsOpen)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-sm rounded-sm transition-colors duration-150",
                    wsOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-expanded={wsOpen}
                  aria-haspopup="true"
                >
                  Workspace
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", wsOpen && "rotate-180")} />
                </button>

                {wsOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 rounded-sm border border-border bg-background shadow-md py-1 z-50">
                    {workspaceLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setWsOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150",
                          mounted && pathname?.startsWith(link.href) ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                        )}
                      >
                        <link.icon className="h-3.5 w-3.5" />
                        {link.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-border" />
                        <Link
                          href="/admin"
                          onClick={() => setWsOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150",
                            mounted && pathname?.startsWith("/admin") ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                          )}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Admin
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <Notifications />
                <UserMenu user={session.user} />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors duration-150"
                >
                  Get started
                </Link>
              </>
            )}

            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-14 md:hidden overflow-y-auto">
          <nav className="flex flex-col px-6 py-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "py-3 text-base border-b border-border transition-colors",
                  mounted && pathname === link.href ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}

            {session?.user && (
              <>
                <span className="pt-4 pb-2 text-[11px] font-mono text-muted-foreground/50 uppercase tracking-wider">Workspace</span>
                {workspaceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 py-2.5 text-base transition-colors",
                      mounted && pathname?.startsWith(link.href) ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 py-2.5 text-base transition-colors",
                      mounted && pathname?.startsWith("/admin") ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </>
            )}

            {!session?.user && (
              <div className="flex flex-col gap-3 pt-6">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center text-sm text-muted-foreground border border-border rounded-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center text-sm font-medium bg-primary text-primary-foreground rounded-sm"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
