import type { Metadata } from "next";
import { AboutPage } from "@/features/home";

export const metadata: Metadata = {
  title: "About - Code Catch",
  description: "The team and mission behind Code Catch.",
};

export default function Page() {
  return <AboutPage />;
}
