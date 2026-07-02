import { mergeRouters } from "@/server/api/trpc";
import { teamCrudRouter } from "./crud";
import { teamMembersRouter } from "./members";

export const teamRouter = mergeRouters(teamCrudRouter, teamMembersRouter);
