import type { Metadata } from "next";
import { TermsOfServicePage } from "@/features/legal";

export const metadata: Metadata = {
  title: "Terms of Service - Code Catch",
  description:
    "Terms of Service for Code Catch — the rules and guidelines for using our AI-powered code review platform.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <TermsOfServicePage />;
}
