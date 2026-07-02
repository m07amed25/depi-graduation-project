import { db } from "@/server/db";

export function getLegalPage(slug: "privacy" | "terms") {
  return db.legalPage.findUnique({ where: { slug } });
}
