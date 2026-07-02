import { PricingPage } from "@/features/home";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing - Code Catch",
  description:
    "Simple, transparent pricing for every team. Free, Pro, and Enterprise plans.",
};

export default function Page() {
  return <PricingPage />;
}
