import type { Metadata } from "next";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { ContactForm } from "@/features/contact";
import { HomeFooter } from "@/features/home";

export const metadata: Metadata = {
  title: "Contact - Code Catch",
  description: "Get in touch with the Code Catch team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UnifiedNavbar />
      <main className="mx-auto max-w-[1100px] px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Get in touch</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-[50ch]">
          Questions, feedback, or partnership inquiries. We typically respond within 24 hours.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_2fr]">
          {/* Info */}
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-semibold text-foreground">Email</h3>
              <a href="mailto:codecatch27@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                codecatch27@gmail.com
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Response time</h3>
              <p className="text-muted-foreground">Usually within 24 hours on business days.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Location</h3>
              <p className="text-muted-foreground">Remote-first team.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Social</h3>
              <div className="flex flex-col gap-1 mt-1">
                <a href="https://x.com/codecatchdev" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors">X / Twitter</a>
                <a href="https://www.instagram.com/code.catch/" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
                <a href="https://github.com/m07amed25/DevReview-AI" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
