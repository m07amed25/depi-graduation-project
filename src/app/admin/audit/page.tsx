"use client";

import { useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  Monitor,
  Search,
  MapPin,
  Users,
  GitPullRequest,
  Users2,
  CreditCard,
  ShieldCheck,
  Settings,
  CalendarDays,
  Copy,
  Check,
  Code2,
  TrendingUp,
  Clock,
  Hash,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    id: "all",
    label: "All Events",
    icon: Activity,
    resources: [] as string[],
    description: "Every platform event across all categories.",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    resources: ["USER"],
    description: "Role changes, bans, plan updates, deletions.",
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: GitPullRequest,
    resources: ["REVIEW"],
    description: "Review deletions and bulk stop operations.",
  },
  {
    id: "teams",
    label: "Teams",
    icon: Users2,
    resources: ["TEAM"],
    description: "Team creation and deletion events.",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    resources: ["INVOICE"],
    description: "Invoice lifecycle — paid, cancelled, refunded.",
  },
  {
    id: "auth",
    label: "Auth & Roles",
    icon: ShieldCheck,
    resources: ["SSO_PROVIDER", "CUSTOM_ROLE"],
    description: "SSO providers, custom roles, and role assignments.",
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    resources: ["SYSTEM_SETTINGS"],
    description: "Retention, security settings, broadcast emails.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type ActionSeverity = "destructive" | "warning" | "success" | "info" | "neutral";

function actionSeverity(action: string): ActionSeverity {
  const a = action.toUpperCase();
  if (
    a.includes("DELETE") ||
    a.includes("BANNED") ||
    a.includes("REVOKED") ||
    a.includes("CANCELLED") ||
    a.includes("STOPPED")
  )
    return "destructive";
  if (a.includes("REFUND") || a.includes("DISPUTE") || a.includes("FAILED"))
    return "warning";
  if (
    a.includes("CREATED") ||
    a.includes("ASSIGNED") ||
    a.includes("UNBANNED") ||
    a.includes("PAID")
  )
    return "success";
  if (a.includes("UPDATED") || a.includes("SENT") || a.includes("RESET"))
    return "info";
  return "neutral";
}

const SEVERITY_STYLES: Record<
  ActionSeverity,
  { bar: string; badge: string; dot: string }
> = {
  destructive: {
    bar: "bg-red-500",
    badge:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
  },
  warning: {
    bar: "bg-amber-500",
    badge:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  success: {
    bar: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  info: {
    bar: "bg-blue-500",
    badge:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  neutral: {
    bar: "bg-muted-foreground/30",
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/50",
  },
};

// ─── Metadata detail dialog ───────────────────────────────────────────────────

type AuditLog = {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  actor: { id: string; name: string | null; email: string | null } | null;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  metadata: unknown;
  createdAt: Date;
};

function MetadataDialog({ log }: { log: AuditLog }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    void navigator.clipboard.writeText(log.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const severity = actionSeverity(log.action);
  const styles = SEVERITY_STYLES[severity];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <Code2 className="h-3 w-3" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full shrink-0 ${styles.dot}`}
            />
            {actionLabel(log.action)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Event ID</p>
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-45">
                  {log.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={copyId}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Timestamp</p>
              <p className="font-medium">
                {format(new Date(log.createdAt), "PPpp")}
              </p>
            </div>
            {log.resource && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Resource</p>
                <Badge variant="outline" className="text-xs">
                  {log.resource}
                </Badge>
              </div>
            )}
            {log.resourceId && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Resource ID
                </p>
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-50 block">
                  {log.resourceId}
                </code>
              </div>
            )}
            {log.actor && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Actor</p>
                <p className="font-medium">
                  {log.actor.name ?? log.actor.email}
                  {log.actor.email && log.actor.name && (
                    <span className="text-muted-foreground font-normal ml-1.5">
                      ({log.actor.email})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {log.ipAddress && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  IP Address
                </p>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-xs">{log.ipAddress}</span>
                </div>
              </div>
            )}
            {(log.country ?? log.city) && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {[log.city, log.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            )}
            {log.userAgent && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">
                  User Agent
                </p>
                <div className="flex items-start gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-xs break-all">{log.userAgent}</span>
                </div>
              </div>
            )}
          </div>

          {log.metadata != null && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Metadata</p>
                <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Single event row ─────────────────────────────────────────────────────────

function EventRow({ log }: { log: AuditLog }) {
  const severity = actionSeverity(log.action);
  const styles = SEVERITY_STYLES[severity];

  return (
    <div className="flex gap-3 py-3.5 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors">
      <div
        className={`w-1 rounded-full shrink-0 mt-0.5 self-stretch ${styles.bar}`}
      />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm leading-tight">
              {actionLabel(log.action)}
            </span>
            {log.resource && (
              <Badge variant="outline" className="text-xs h-5 px-1.5">
                {log.resource}
              </Badge>
            )}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0 text-[11px] font-medium h-5 ${styles.badge}`}
            >
              {log.action.split("_").pop()}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MetadataDialog log={log} />
            <span
              className="text-xs text-muted-foreground whitespace-nowrap"
              title={format(new Date(log.createdAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {log.resourceId && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Hash className="h-3 w-3" />
            <code className="font-mono">{log.resourceId}</code>
          </p>
        )}

        {log.actor && (
          <p className="text-xs text-muted-foreground">
            Actor:{" "}
            <span className="text-foreground font-medium">
              {log.actor.name ?? log.actor.email}
            </span>
            {log.actor.name && log.actor.email && (
              <span className="ml-1">({log.actor.email})</span>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {log.ipAddress && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              {log.ipAddress}
            </span>
          )}
          {(log.country ?? log.city) && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[log.city, log.country].filter(Boolean).join(", ")}
            </span>
          )}
          {log.userAgent && (
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-65"
              title={log.userAgent}
            >
              <Monitor className="h-3 w-3 shrink-0" />
              {log.userAgent.slice(0, 55)}
              {log.userAgent.length > 55 ? "…" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Event list (one per tab) ─────────────────────────────────────────────────

function EventList({
  resources,
  search,
  fromDate,
  toDate,
}: {
  resources: string[];
  search: string;
  fromDate: string;
  toDate: string;
}) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.admin.getAuditLogs.useQuery({
    page,
    limit: 25,
    resources: resources.length ? resources : undefined,
    search: search || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.logs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Activity className="h-8 w-8 opacity-40" />
        <p className="text-sm">No audit events found.</p>
        {(search || fromDate || toDate) && (
          <p className="text-xs opacity-70">Try adjusting your filters.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-border/60 -mt-1">
        {data.logs.map((log) => (
          <EventRow key={log.id} log={log} />
        ))}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Page {page} of {data.pages} ·{" "}
            <span className="font-medium">{data.total.toLocaleString()}</span>{" "}
            events
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  const { data } = trpc.admin.getAuditStats.useQuery();

  const cards = [
    { label: "Total Events", value: data?.total ?? 0, icon: Hash, color: "text-foreground" },
    { label: "Last 24 h", value: data?.last24h ?? 0, icon: Clock, color: "text-blue-600 dark:text-blue-400" },
    { label: "Last 7 days", value: data?.last7d ?? 0, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "User Events", value: data?.byResource?.USER ?? 0, icon: Users, color: "text-violet-600 dark:text-violet-400" },
    { label: "Payment Events", value: data?.byResource?.INVOICE ?? 0, icon: CreditCard, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
            </div>
            {data ? (
              <p className="text-2xl font-bold tracking-tight">
                {c.value.toLocaleString()}
              </p>
            ) : (
              <Skeleton className="h-7 w-16" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(v), 350);
  }, []);

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;

  const { refetch: exportLogs, isFetching: isExporting } =
    trpc.admin.exportAuditLogs.useQuery(
      {
        resources: activeTabDef.resources.length
          ? [...activeTabDef.resources]
          : undefined,
        search: debouncedSearch || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      },
      { enabled: false },
    );

  const handleExport = async () => {
    const result = await exportLogs();
    if (!result.data?.csv) return;
    const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  const hasFilters = search || fromDate || toDate;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Full system event history — actors, IPs, locations, and raw metadata
            for every platform action.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <StatsStrip />

      {/* Global filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search action, resource, actor, IP…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            title="From date"
            value={fromDate ? fromDate.slice(0, 10) : ""}
            onChange={(e) =>
              setFromDate(
                e.target.value ? e.target.value + "T00:00:00.000Z" : "",
              )
            }
            className="w-36 text-sm"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <Input
            type="date"
            title="To date"
            value={toDate ? toDate.slice(0, 10) : ""}
            onChange={(e) =>
              setToDate(
                e.target.value ? e.target.value + "T23:59:59.999Z" : "",
              )
            }
            className="w-36 text-sm"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="space-y-4"
      >
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-1.5 data-[state=active]:font-semibold"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <tab.icon className="h-4 w-4 text-muted-foreground" />
                  {tab.label}
                </CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <EventList
                  key={`${tab.id}|${debouncedSearch}|${fromDate}|${toDate}`}
                  resources={[...tab.resources]}
                  search={debouncedSearch}
                  fromDate={fromDate}
                  toDate={toDate}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
