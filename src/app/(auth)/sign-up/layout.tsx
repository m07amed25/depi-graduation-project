import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Code Catch account and start catching bugs, security issues, and code quality problems with AI-powered code reviews.",
  robots: { index: true, follow: true },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
