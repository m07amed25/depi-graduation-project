import { mergeRouters } from "../../trpc";
import { adminStatsRouter } from "./stats";
import { adminUsersRouter } from "./users";
import { adminReviewsRouter } from "./reviews";
import { adminSettingsRouter } from "./settings";
import { adminSecurityRouter } from "./security";
import { adminLegalRouter } from "./legal";
import { adminMessagesRouter } from "./messages";
import { adminNewsletterRouter } from "./newsletter";
import { adminInvoicesRouter } from "./invoices";
import { adminEmailTemplatesRouter } from "./email-templates";

export const adminRouter = mergeRouters(
  adminStatsRouter,
  adminUsersRouter,
  adminReviewsRouter,
  adminSettingsRouter,
  adminSecurityRouter,
  adminLegalRouter,
  adminMessagesRouter,
  adminNewsletterRouter,
  adminInvoicesRouter,
  adminEmailTemplatesRouter,
);
