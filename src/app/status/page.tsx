import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home";

export const metadata: Metadata = {
  title: "Status",
  description: "System status and uptime information — coming soon.",
};

export default function StatusPage() {
  return (
    <ComingSoonPage
      title="System Status"
      description="Real-time uptime monitoring, incident history, and service health checks will be available here."
    />
  );
}
