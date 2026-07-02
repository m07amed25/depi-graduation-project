"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import PusherClient from "pusher-js";
import type { PresenceChannel, Members } from "pusher-js";
import { PUSHER_EVENTS } from "@/server/pusher";

export interface PresenceMember {
  id: string;
  info: {
    name: string;
    image?: string | null;
  };
}

interface PusherContextValue {
  client: PusherClient | null;
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextValue>({
  client: null,
  isConnected: false,
});

export function PusherProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<PusherClient | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      return;
    }

    const pusher = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });

    pusher.connection.bind("connected", () => setIsConnected(true));
    pusher.connection.bind("disconnected", () => setIsConnected(false));
    pusher.connection.bind("error", () => setIsConnected(false));

    clientRef.current = pusher;

    return () => {
      pusher.disconnect();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, []);

  return (
    <PusherContext.Provider value={{ client: clientRef.current, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  return useContext(PusherContext);
}

export function usePresenceChannel(channelName: string | null) {
  const { client } = usePusher();
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const channelRef = useRef<PresenceChannel | null>(null);

  useEffect(() => {
    if (!client || !channelName) return;

    const channel = client.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    const handleSubscribed = (memberData: Members) => {
      setMyId(memberData.myID);
      const list: PresenceMember[] = [];
      memberData.each((m: PresenceMember) => list.push(m));
      setMembers(list);
    };

    const handleAdded = (member: PresenceMember) => {
      setMembers((prev) => {
        if (prev.some((m) => m.id === member.id)) return prev;
        return [...prev, member];
      });
    };

    const handleRemoved = (member: PresenceMember) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    };

    channel.bind("pusher:subscription_succeeded", handleSubscribed);
    channel.bind("pusher:member_added", handleAdded);
    channel.bind("pusher:member_removed", handleRemoved);

    return () => {
      channel.unbind("pusher:subscription_succeeded", handleSubscribed);
      channel.unbind("pusher:member_added", handleAdded);
      channel.unbind("pusher:member_removed", handleRemoved);
      client.unsubscribe(channelName);
      channelRef.current = null;
      setMembers([]);
      setMyId(null);
    };
  }, [client, channelName]);

  return { members, myId, channel: channelRef.current };
}

export function useChannelEvent<T = unknown>(
  channelName: string | null,
  event: string,
  callback: (data: T) => void,
) {
  const { client } = usePusher();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!client || !channelName) return;

    const channel = client.channel(channelName);
    if (!channel) return;

    const handler = (data: T) => callbackRef.current(data);
    channel.bind(event, handler);

    return () => {
      channel.unbind(event, handler);
    };
  }, [client, channelName, event]);
}

export function useTypingIndicator(channelName: string | null) {
  const { client } = usePusher();
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { name: string; timeout: ReturnType<typeof setTimeout> }>
  >(new Map());

  useChannelEvent<{ userId: string; name: string }>(
    channelName,
    PUSHER_EVENTS.CLIENT_TYPING,
    useCallback((data) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) clearTimeout(existing.timeout);
        const timeout = setTimeout(() => {
          setTypingUsers((p) => {
            const n = new Map(p);
            n.delete(data.userId);
            return n;
          });
        }, 3000);
        next.set(data.userId, { name: data.name, timeout });
        return next;
      });
    }, []),
  );

  const triggerTyping = useCallback(
    (userId: string, name: string) => {
      if (!client || !channelName) return;
      const channel = client.channel(channelName);
      if (channel) {
        channel.trigger(PUSHER_EVENTS.CLIENT_TYPING, { userId, name });
      }
    },
    [client, channelName],
  );

  const typingNames = Array.from(typingUsers.values()).map((u) => u.name);

  return { typingNames, triggerTyping };
}

export { PUSHER_EVENTS };

/**
 * Subscribe to a private Pusher channel and bind to a specific event.
 * Returns the latest event data received.
 */
export function usePrivateChannel<T = unknown>(
  channelName: string | null | undefined,
  event: string,
  onEvent: (data: T) => void,
) {
  const { client } = usePusher();
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!client || !channelName) return;

    const channel = client.subscribe(channelName);

    const handler = (data: T) => callbackRef.current(data);
    channel.bind(event, handler);

    return () => {
      channel.unbind(event, handler);
      client.unsubscribe(channelName);
    };
  }, [client, channelName, event]);
}
