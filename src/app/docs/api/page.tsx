import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Developer API documentation — coming soon.",
};

export default function ApiReferencePage() {
  return (
    <ComingSoonPage
      title="API Reference"
      description="Comprehensive documentation for integrating Code Catch into your own tools and workflows."
    />
  );
}
