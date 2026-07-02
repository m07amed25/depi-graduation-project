"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderGit2,
  GitPullRequest,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  FileText,
  BookOpen,
  History,
  Globe,
  Mail,
  Info,
  Package,
  MoreVertical,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { UserMenu } from "./user-menu";
import { Notifications } from "./notifications";
import { trpc } from "@/lib/trpc/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
}

const mainNav: NavItem[] = [
  { href: "/repo", label: "Repositories", icon: FolderGit2 },
  { href: "/reviews", label: "Reviews", icon: GitPullRequest },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/teams", label: "Teams", icon: Users, hasSubmenu: true },
];

// Nav items gated by a plan capability (key) — locked items link to pricing.
const NAV_CAPABILITY: Record<string, string> = {
  "/analytics": "advanced_analytics",
};

const resourceNav: NavItem[] = [
  { href: "/pricing", label: "Plans", icon: Package },
  { href: "/docs", label: "Docs", icon: BookOpen, hasSubmenu: true },
  { href: "/changelog", label: "Changelog", icon: History },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/status", label: "Status", icon: Globe },
  { href: "/product", label: "Features", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

const DEFAULT_WIDTH = 240;
const MAX_WIDTH = 380;

interface DashboardSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    planId?: string;
  };
}

function TeamsHoverNav({ children }: { children: React.ReactNode }) {
  const { data: teams, isLoading } = trpc.team.list.useQuery(undefined, {
    staleTime: 30_000,
  });

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-56">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          My Teams
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-4 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : teams?.length ? (
          <ul className="space-y-1">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/teams/${team.id}`}
                  className="flex items-center justify-between rounded px-2 py-1.5 text-[13px] hover:bg-accent/50 transition-colors"
                >
                  <span className="truncate font-medium">{team.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0 capitalize">
                    {team.role.toLowerCase()}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-muted-foreground">No teams yet</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: caps } = trpc.profile.getCapabilities.useQuery(undefined, { staleTime: 60_000 });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Close mobile menu on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset menu state when the route changes
    setMobileOpen(false);
  }, [pathname]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth < 80) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
        setWidth(Math.min(Math.max(newWidth, 160), MAX_WIDTH));
      }
    };
    const onUp = () => setIsResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const sidebarWidth = collapsed ? 0 : width;

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

    const capKey = NAV_CAPABILITY[item.href];
    const locked = capKey
      ? (caps?.some((c) => c.key === capKey && !c.enabled) ?? false)
      : false;

    if (locked) {
      return (
        <Link
          href="/pricing"
          onClick={() => setMobileOpen(false)}
          title="Upgrade to unlock"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground/60 transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          <Lock className="h-3 w-3 text-muted-foreground/40" />
        </Link>
      );
    }

    const link = (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.hasSubmenu && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
      </Link>
    );

    if (item.href === "/teams") {
      return <TeamsHoverNav>{link}</TeamsHoverNav>;
    }

    return link;
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href="/repo" className="flex items-center gap-2">
          <Logo className="h-6" />
          <span className="text-sm font-semibold">
            Code <span className="text-primary">Catch</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Notifications />
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setMobileOpen(false); }}
          role="button"
          tabIndex={-1}
          aria-label="Close navigation"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ width: `${width}px` }}
        className={cn(
          "fixed top-0 left-0 z-50 flex h-dvh flex-col bg-background lg:z-30 border-r border-border",
          isResizing ? "transition-none" : "transition-transform duration-150 ease-in-out",
          mobileOpen
            ? "translate-x-0"
            : collapsed
              ? "-translate-x-full"
              : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 h-14 shrink-0">
          <Link href="/repo" className="flex items-center gap-2 flex-1 min-w-0">
            <Logo className="h-6 shrink-0" />
            <span className="text-sm font-bold truncate">
              Code <span className="text-primary">Catch</span>
            </span>
          </Link>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 sidebar-scroll" aria-label="Dashboard navigation">
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          <div className="my-3 mx-3 border-t border-border/50" />

          <button
            onClick={() => setResourcesOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
            aria-expanded={resourcesOpen}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Resources</span>
            <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200", resourcesOpen && "rotate-90")} />
          </button>
          {resourcesOpen && (
            <div className="mt-0.5 space-y-0.5 pl-3">
              {resourceNav.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted-foreground/60 truncate">{user.email}</p>
            </div>
            <Notifications side="top" />
            <UserMenu
              user={{ id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, planId: user.planId }}
              side="top"
              trigger={<MoreVertical className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Resize handle (desktop only) */}
        <div
          onMouseDown={startResizing}
          className={cn(
            "absolute top-0 right-0 h-full w-[3px] cursor-col-resize transition-colors hidden lg:flex items-center justify-center group/resize",
            isResizing ? "bg-primary/30" : "hover:bg-primary/20"
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }}
            className="absolute top-1/2 -translate-y-1/2 -right-4 h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover/resize:opacity-100 transition-opacity hidden lg:flex"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Floating expand button when collapsed (desktop only) */}
      {collapsed && (
        <>
          <button
            onClick={() => setCollapsed(false)}
            className="fixed top-3 left-3 z-30 hidden lg:flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Show sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div
            onClick={() => setCollapsed(false)}
            className="fixed top-0 left-0 h-full w-[3px] z-30 hidden lg:flex items-center justify-center hover:bg-primary/20 cursor-pointer transition-colors group/expand"
          >
            <button
              className="absolute top-1/2 -translate-y-1/2 -right-4 h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover/expand:opacity-100 transition-opacity hidden lg:flex"
              aria-label="Show sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* Layout spacer (desktop only) */}
      <div
        className="hidden lg:block shrink-0"
        style={{ width: `${sidebarWidth}px`, transition: isResizing ? "none" : "width 150ms ease-in-out" }}
        aria-hidden
      />
    </>
  );
}
