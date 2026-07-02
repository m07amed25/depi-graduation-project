import { LegalDocumentPage } from "./legal-document-page";

export function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      slug="terms"
      title="Terms of Service"
      emptyMessage="Terms of Service content is being prepared."
    />
  );
}
