"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GitPullRequest,
  Users2,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  ArrowLeft,
  MessageSquareText,
  Database,
  BarChart3,
  Activity,
  Settings,
  ShieldCheck,
  KeyRound,
  Shield,
  CreditCard,
  Mail,
  FileText,
  Newspaper,
  Receipt,
  SlidersHorizontal,
  LayoutTemplate,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

const NAV_GROUPS = [
  {
    title: "Main",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/repos", label: "Repositories", icon: Database },
      { href: "/admin/reviews", label: "Reviews", icon: GitPullRequest },
      { href: "/admin/teams", label: "Teams", icon: Users2 },
      { href: "/admin/support", label: "Support Messages", icon: MessageSquareText },
      { href: "/admin/messages", label: "Messages", icon: Mail },
      { href: "/admin/newsletter", label: "Newsletter", icon: Newspaper },
      { href: "/admin/pricing", label: "Pricing", icon: CreditCard },
      { href: "/admin/capabilities", label: "Capabilities", icon: SlidersHorizontal },
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/legal", label: "Legal Pages", icon: FileText },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/audit", label: "Audit Logs", icon: Activity },
      { href: "/admin/sso", label: "SSO / SAML", icon: KeyRound },
      { href: "/admin/roles", label: "Custom Roles", icon: Shield },
      { href: "/admin/security", label: "Security", icon: ShieldCheck },
      { href: "/admin/email/templates", label: "Email Templates", icon: LayoutTemplate },
      { href: "/admin/feedback", label: "Review Feedback", icon: MessageSquareText },
      { href: "/admin/user-feedback", label: "User Feedback", icon: ShieldAlert },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  admin: {
    name: string;
    email: string;
    image: string | null;
  };
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const close = () => setOpen(false);

  const brand = (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
      <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
      <span className="text-sm font-bold uppercase tracking-widest text-destructive">
        Command Center
      </span>
    </div>
  );

  const navContent = (
    <div className="flex h-full flex-col overflow-hidden">
      {brand}

      {/* scrollable nav */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-4
          [scrollbar-width:thin]
          [scrollbar-color:hsl(var(--border))_transparent]"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              {group.title}
            </h4>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground/70 group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* back to app */}
      <div className="shrink-0 border-t px-2 py-2">
        <Link
          href="/repo"
          onClick={close}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Back to App</span>
        </Link>
      </div>

      {/* user + sign out */}
      <div className="shrink-0 border-t p-2">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            {admin.image && (
              <AvatarImage src={admin.image} alt={admin.name} />
            )}
            <AvatarFallback>
              {admin.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-snug">
              {admin.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {admin.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r lg:flex lg:flex-col sticky top-0 h-screen">
        {navContent}
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <span className="text-sm font-bold uppercase tracking-widest text-destructive">
            Command Center
          </span>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r bg-background transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
