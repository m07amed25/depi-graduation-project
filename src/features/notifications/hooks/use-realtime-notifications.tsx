"use client";

import { useEffect, useCallback } from "react";
import { usePusher } from "@/lib/pusher/client";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { PUSHER_EVENTS } from "@/lib/constants";

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date | string;
}

export function useRealtimeNotifications(userId: string | undefined) {
  const { client, isConnected } = usePusher();
  const utils = trpc.useUtils();

  const handleNewNotification = useCallback(
    (data: NotificationPayload) => {
      // 1. Update unread count manually
      utils.notification.unreadCount.setData(undefined, (old) => {
        if (!old) return { count: 1 };
        return { count: old.count + 1 };
      });

      // 2. Prepend the new notification to the infinite list cache
      // This avoids invalidating and refetching all pages
      utils.notification.list.setInfiniteData({}, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page, i) => {
            if (i === 0) {
              return {
                ...page,
                notifications: [data as any, ...page.notifications],
              };
            }
            return page;
          }),
        };
      });

      // Also invalidate to be safe, but since we updated the cache manually,
      // subsequent fetches will be consistent. We only invalidate unreadCount
      // if we want to be absolutely sure, but setData is faster.
      // We don't invalidate 'list' here to avoid the large payload refetch.

      // Show a toast notification
      toast.info(data.title, {
        description: data.message,
        action: data.link
          ? {
              label: "View",
              onClick: () => {
                if (data.link) window.location.href = data.link;
              },
            }
          : undefined,
      });

      // Play notification sound if enabled
      const soundEnabled = localStorage.getItem("notificationSoundEnabled");
      if (soundEnabled === "true") {
        playNotificationSound();
      }

      // Show desktop notification if enabled and permitted
      showDesktopNotification(data);
    },
    [utils],
  );

  useEffect(() => {
    if (!client || !userId || !isConnected) return;

    const channelName = `private-user-${userId}`;
    const channel = client.subscribe(channelName);

    channel.bind("notification:new", handleNewNotification);
    channel.bind(PUSHER_EVENTS.PLAN_UPDATED, () => {
      void utils.profile.get.invalidate();
    });

    return () => {
      channel.unbind("notification:new", handleNewNotification);
      channel.unbind(PUSHER_EVENTS.PLAN_UPDATED);
      client.unsubscribe(channelName);
    };
  }, [client, userId, isConnected, handleNewNotification]);

  return { isConnected };
}

function playNotificationSound() {
  try {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn("Failed to play notification sound:", error);
  }
}

async function showDesktopNotification(data: NotificationPayload) {
  // Check if desktop notifications are enabled
  const desktopEnabled = localStorage.getItem("desktopNotifications");
  if (desktopEnabled !== "true") return;

  // Check browser support
  if (!("Notification" in window)) return;

  // Check permission
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: data.id, // Prevent duplicate notifications
        requireInteraction: false,
      });

      // Handle notification click
      if (data.link) {
        notification.onclick = () => {
          window.focus();
          window.location.href = data.link!;
          notification.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.warn("Failed to show desktop notification:", error);
    }
  }
}
