import type { Metadata } from "next";
import { ProductPage } from "@/features/home";

export const metadata: Metadata = {
  title: "Product - Code Catch",
  description:
    "Explore every feature of Code Catch — AI-powered code review, team collaboration, security scanning, analytics, and automated architecture diagrams.",
};

export default function Page() {
  return <ProductPage />;
}
