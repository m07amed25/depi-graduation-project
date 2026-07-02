import Pusher from "pusher";

let pusherServer: Pusher | null = null;

/**
 * Returns a singleton Pusher server instance.
 * If PUSHER env vars are missing, returns null (real-time features disabled).
 */
export function getPusherServer(): Pusher | null {
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.PUSHER_KEY ||
    !process.env.PUSHER_SECRET ||
    !process.env.PUSHER_CLUSTER
  ) {
    return null;
  }

  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherServer;
}

export function reviewChannel(reviewId: string) {
  return `presence-review-${reviewId}`;
}

export function privateRepositoryChannel(repositoryId: string) {
  return `private-repository-${repositoryId}`;
}

export { PUSHER_EVENTS } from "@/lib/constants";
