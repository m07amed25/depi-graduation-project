import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Security", href: "/security" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
  { label: "Changelog", href: "/changelog" },
  { label: "Status", href: "/status" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function HomeFooter() {
  return (
    <footer className="border-t border-border" role="contentinfo">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-auto" />
            <span className="text-sm font-medium text-foreground">Code Catch</span>
          </div>

          {/* Links - single row, wraps on mobile */}
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-muted-foreground/50 font-mono">
          <span>Built for developers who ship.</span>
          <span>&copy; {new Date().getFullYear()} Code Catch</span>
        </div>
      </div>
    </footer>
  );
}
