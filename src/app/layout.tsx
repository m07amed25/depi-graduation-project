import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransitionProvider } from "@/components/animations/page-transition";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "sonner";
import { PusherProvider } from "@/lib/pusher/client";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Code Catch | Smart Automated Code Reviews",
    template: "%s | Code Catch",
  },
  description:
    "AI-powered code reviews that catch bugs, security issues, and maintainability problems before they reach production. Integrates directly with GitHub pull requests.",
  keywords: [
    "code review",
    "AI code review",
    "automated code review",
    "GitHub pull request review",
    "AI developer tools",
    "code quality",
    "security analysis",
    "bug detection",
    "continuous integration",
    "SaaS developer tools",
    "static analysis",
    "code analysis tool",
  ],
  authors: [{ name: "Mohamed Reda" }],
  creator: "Mohamed Reda",
  publisher: "Code Catch",
  applicationName: "Code Catch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Code Catch",
  },
  openGraph: {
    title: "Code Catch | Smart Automated Code Reviews",
    description:
      "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly directly in your GitHub pull requests.",
    type: "website",
    siteName: "Code Catch",
    locale: "en_US",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
         height: 630,
        alt: "Code Catch | Smart Automated Code Reviews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Catch | Smart Automated Code Reviews",
    description:
      "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "ae4f3c860cae5a91",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <TRPCProvider>
            <PusherProvider>
              <PageTransitionProvider>
                <ErrorBoundary>{children}</ErrorBoundary>
              </PageTransitionProvider>
            </PusherProvider>
          </TRPCProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
