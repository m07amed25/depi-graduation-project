import { serve } from "inngest/next";
import { inngest, functions } from "@/server/inngest";

export const dynamic = "force-dynamic";

export const maxDuration = 30;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
