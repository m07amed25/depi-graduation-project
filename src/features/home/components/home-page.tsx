import { UnifiedNavbar } from "@/components/unified-navbar";
import { api, HydrateClient } from "@/lib/trpc/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { HomeFooter } from "./HomeFooter";
import { LandingContent } from "./LandingContent";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Code Catch",
  operatingSystem: "Any",
  applicationCategory: "DeveloperApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly.",
  url: "https://code-catch-psi.vercel.app",
};

export async function HomePage() {
  void api.home.getStats.prefetch();
  void api.home.getRecentUsers.prefetch();

  const session = await auth.api.getSession({ headers: await headers() });
  const banner = session?.user ? null : await api.admin.getBannerSettings();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-sm"
        >
          Skip to main content
        </a>

        {banner?.enabled && banner.text && (
          <AnnouncementBanner
            text={banner.text}
            link={banner.link ?? undefined}
            linkText={banner.linkText ?? undefined}
            color={banner.color ?? undefined}
          />
        )}

        <UnifiedNavbar />

        <main id="main-content">
          <LandingContent />
        </main>

        <HomeFooter />
      </div>
    </HydrateClient>
  );
}
