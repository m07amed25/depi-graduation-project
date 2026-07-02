import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release notes and feature updates — coming soon.",
};

export default function ChangelogPage() {
  return (
    <ComingSoonPage
      title="Changelog"
      description="A full history of features, fixes, and improvements. We'll be publishing release notes here soon."
    />
  );
}
