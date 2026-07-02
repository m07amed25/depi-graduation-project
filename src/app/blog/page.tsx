import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home";

export const metadata: Metadata = {
  title: "Blog",
  description: "Engineering insights and product news — coming soon.",
};

export default function BlogPage() {
  return (
    <ComingSoonPage
      title="Blog"
      description="Deep dives into code quality, AI-assisted reviews, and engineering best practices. Articles coming soon."
    />
  );
}
