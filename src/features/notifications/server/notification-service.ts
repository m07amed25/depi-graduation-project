import { getPusherServer } from "@/server/pusher";
import type { PrismaClient, NotificationType } from "@/server/db/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}

/**
 * Creates a notification in the database and triggers a real-time update via Pusher
 */
export async function createNotification(
  db: PrismaClient,
  params: CreateNotificationParams
) {
  // Create notification in database
  const notification = await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
      read: false,
    },
  });

  // Trigger real-time update via Pusher
  const pusher = getPusherServer();
  if (pusher) {
    try {
      await pusher.trigger(`private-user-${params.userId}`, "notification:new", {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        createdAt: notification.createdAt,
      });
    } catch (error) {
      console.error("Failed to trigger Pusher notification:", error);
      // Don't throw - notification was created successfully
    }
  }

  return notification;
}

/**
 * Batch create notifications with real-time updates
 */
export async function createNotifications(
  db: PrismaClient,
  notifications: CreateNotificationParams[]
) {
  const created = await db.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link ?? null,
      read: false,
    })),
  });

  // Trigger real-time updates via Pusher
  const pusher = getPusherServer();
  if (pusher) {
    try {
      // Group notifications by user for efficient triggering
      const notificationsByUser = new Map<string, CreateNotificationParams[]>();
      for (const notification of notifications) {
        const userNotifications = notificationsByUser.get(notification.userId) || [];
        userNotifications.push(notification);
        notificationsByUser.set(notification.userId, userNotifications);
      }

      // Trigger events for each user
      const triggerPromises = Array.from(notificationsByUser.entries()).map(
        ([userId, userNotifications]) => {
          // Send the most recent notification as a real-time update
          const latest = userNotifications[userNotifications.length - 1];
          return pusher.trigger(`private-user-${userId}`, "notification:new", {
            type: latest.type,
            title: latest.title,
            message: latest.message,
            link: latest.link,
          });
        }
      );

      await Promise.allSettled(triggerPromises);
    } catch (error) {
      console.error("Failed to trigger batch Pusher notifications:", error);
    }
  }

  return created;
}
