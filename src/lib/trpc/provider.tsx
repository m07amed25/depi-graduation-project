"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./client";
import { makeQueryClient } from "./query-client";
import { toast } from "sonner";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

function handleGlobalError(error: unknown) {
  if (typeof error === "object" && error !== null && "data" in error) {
    const err = error as { message?: string; data?: { code?: string } };
    if (err.data?.code === "UNAUTHORIZED") return; // Let auth handle it or ignore
    
    toast.error(err.message || "An unexpected error occurred", {
      id: "trpc-error",
    });
  } else if (error instanceof Error) {
    toast.error(error.message, { id: "trpc-error" });
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = makeQueryClient();
    // Wire global error handlers onto the caches
    client.getQueryCache().config.onError = handleGlobalError;
    client.getMutationCache().config.onError = handleGlobalError;
    return client;
  });

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
