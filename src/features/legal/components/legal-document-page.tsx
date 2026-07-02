import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home";
import { getLegalPage } from "../server/get-legal-page";
import { LegalMarkdown } from "./legal-markdown";

type LegalDocumentPageProps = {
  emptyMessage: string;
  slug: "privacy" | "terms";
  title: string;
};

export async function LegalDocumentPage({
  emptyMessage,
  slug,
  title,
}: LegalDocumentPageProps) {
  const page = await getLegalPage(slug);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <UnifiedNavbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          {title}
        </h1>
        {page?.updatedAt ? (
          <p className="text-muted-foreground mb-12">
            Last updated: {page.updatedAt.toLocaleDateString()}
          </p>
        ) : null}
        {page?.content ? (
          <LegalMarkdown content={page.content} />
        ) : (
          <p className="text-muted-foreground">{emptyMessage}</p>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
