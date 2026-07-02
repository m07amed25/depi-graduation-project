import { pullRequestRouter } from "@/features/repo/server/pull-request-router";
import { profileRouter } from "./routers/profile";
import { repositoryRouter } from "@/features/repo/server/router";
import { reviewRouter } from "@/features/review/server/router";
import { settingsRouter } from "@/features/settings/server/router";
import { collaborationRouter } from "./routers/collaboration";
import { teamRouter } from "@/features/teams/server/router";
import { notificationRouter } from "@/features/notifications/server/router";
import { analyticsRouter } from "@/features/analytics/server/router";
import { automationRouter } from "@/features/settings/server/automation-router";
import { diagramRouter } from "./routers/diagram";
import { adminRouter } from "./routers/admin";
import { adminPricingRouter } from "./routers/admin-pricing";
import { rulesRouter } from "@/features/settings/server/rules-router";
import { securityRouter } from "./routers/security";
import { homeRouter } from "@/features/home/server/router";
import { billingRouter } from "./routers/billing";
import { paymentRouter } from "./routers/payment";
import { createCallerFactory, createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date(),
    };
  }),
  home: homeRouter,
  profile: profileRouter,
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
  settings: settingsRouter,
  collaboration: collaborationRouter,
  team: teamRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
  automation: automationRouter,
  diagram: diagramRouter,
  admin: adminRouter,
  adminPricing: adminPricingRouter,
  rules: rulesRouter,
  security: securityRouter,
  billing: billingRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
