"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Clock,
  Archive,
  Settings,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import {
  TeamInviteActions,
  getNotificationIcon,
  formatTime,
  notificationTypeLabels,
  type FilterType,
  type NotificationType,
} from "./page-components";

export function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const utils = trpc.useUtils();

  const {
    data: notificationsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.notification.list.useInfiniteQuery(
    {
      limit: 20,
      unreadOnly: filterType === "unread",
      type: notificationType,
      search: searchQuery,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const { data: unreadData } = trpc.notification.unreadCount.useQuery();

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
      toast.success("Notification deleted");
    },
  });

  const notifications =
    notificationsData?.pages.flatMap((page) => page.notifications) ?? [];
  const unreadCount = unreadData?.count ?? 0;
  const filteredNotifications = notifications;

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedIds).map((id) =>
      deleteNotification.mutateAsync({ id }),
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} notifications deleted`);
  };

  const handleBulkMarkAsRead = async () => {
    const promises = Array.from(selectedIds).map((id) =>
      markAsRead.mutateAsync({ id }),
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} notifications marked as read`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        icon={<Bell className="size-4.5 text-primary" />}
        title="Notifications"
        description="Stay updated with your code reviews and team activities"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/settings#notifications")} className="w-fit">
            <Settings className="mr-2 size-4" />Preferences
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Bell className="size-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Total</span></div>
          <p className="text-2xl font-semibold">{notifications.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="size-4 text-blue-500" /><span className="text-xs font-medium text-muted-foreground">Unread</span></div>
          <p className="text-2xl font-semibold">{unreadCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Archive className="size-4 text-emerald-500" /><span className="text-xs font-medium text-muted-foreground">Read</span></div>
          <p className="text-2xl font-semibold">{notifications.length - unreadCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search notifications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)} className="h-9 w-full md:w-40 text-sm">
            <option value="all">All Statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </Select>
          <Select value={notificationType} onChange={(e) => setNotificationType(e.target.value as NotificationType)} className="h-9 w-full md:w-48 text-sm">
            {Object.entries(notificationTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg border bg-muted/30 p-3 shadow-sm">
          <span className="text-sm font-medium px-2">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleBulkMarkAsRead} disabled={markAsRead.isPending}>
              <Check className="mr-1.5 size-3.5" />Mark as read
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs hover:text-destructive" onClick={handleBulkDelete} disabled={deleteNotification.isPending}>
              <Trash2 className="mr-1.5 size-3.5" />Delete
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {filteredNotifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs text-muted-foreground h-8 px-2">
              {selectedIds.size === filteredNotifications.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
            <CheckCheck className="mr-1.5 size-3.5" />Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4"><Check className="size-6 text-muted-foreground" /></div>
            <h3 className="text-sm font-medium text-foreground">You&apos;re all caught up</h3>
            <p className="mt-1 text-sm text-muted-foreground">{searchQuery || notificationType !== "all" ? "No notifications match your filters." : "No new notifications."}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredNotifications.map((notification, idx) => {
              const isInvite = notification.type === "TEAM_INVITE";
              const hasLink = !!notification.link;
              const isSelected = selectedIds.has(notification.id);
              const isRead = notification.read;

              const inner = (
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50 border border-border/50">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={cn("text-sm", isRead ? "font-medium text-foreground/80" : "font-semibold text-foreground")}>{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notification.message}</p>
                        {isInvite && notification.link && (
                          <TeamInviteActions link={notification.link} onDone={() => { markAsRead.mutate({ id: notification.id }); }} />
                        )}
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5"><Clock className="size-3" />{formatTime(notification.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );

              const itemClass = cn(
                "group relative flex items-start p-4 transition-colors",
                !isRead ? "bg-blue-50/30 dark:bg-blue-500/5" : "hover:bg-accent/50",
                idx !== filteredNotifications.length - 1 && "border-b border-border/50",
                !isInvite && hasLink && "cursor-pointer",
              );

              return (
                <div key={notification.id} className={cn("flex items-stretch", itemClass)}>
                  {!isRead && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />}
                  <div className="pt-2 pl-2 pr-3 shrink-0 flex items-start z-10">
                    <label className="flex items-center justify-center size-11 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(notification.id)} className="size-4 rounded border-border/80 bg-background text-primary focus:ring-1 focus:ring-primary focus:ring-offset-1 transition-colors cursor-pointer" aria-label="Select notification" />
                    </label>
                  </div>
                  {!isInvite && hasLink && notification.link ? (
                    <Link href={notification.link} className="flex-1 min-w-0" onClick={() => { if (!isRead) markAsRead.mutate({ id: notification.id }); }}>{inner}</Link>
                  ) : (
                    <div className="flex-1 min-w-0">{inner}</div>
                  )}
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-background/90 backdrop-blur-xs rounded-md shadow-xs border border-border/50 p-0.5">
                    {!isRead && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead.mutate({ id: notification.id }); }} className="p-1.5 rounded-sm hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Mark as read">
                        <Check className="size-3.5" />
                      </button>
                    )}
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification.mutate({ id: notification.id }); }} className="p-1.5 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center pb-12">
          <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="w-full sm:w-auto h-10 px-8">
            {isFetchingNextPage ? (<><Loader2 className="mr-2 size-4 animate-spin" />Loading more...</>) : "Load more notifications"}
          </Button>
        </div>
      )}
    </div>
  );
}
