import type { Metadata } from "next";
import { PrivacyPolicyPage } from "@/features/legal";

export const metadata: Metadata = {
  title: "Privacy Policy - Code Catch",
  description:
    "Privacy Policy for Code Catch — how we collect, use, and protect your data.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <PrivacyPolicyPage />;
}
