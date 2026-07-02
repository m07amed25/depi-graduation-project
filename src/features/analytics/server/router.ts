import { mergeRouters } from "@/server/api/trpc";
import { analyticsQueriesRouter } from "./queries";
import { analyticsAggregationsRouter } from "./aggregations";

export const analyticsRouter = mergeRouters(
  analyticsQueriesRouter,
  analyticsAggregationsRouter,
);
