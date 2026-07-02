import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function AuthBackLink() {
  return (
    <Link
      href="/"
      className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
      <Logo className="h-6" />
      <span className="hidden sm:inline">Back to Home</span>
    </Link>
  );
}
