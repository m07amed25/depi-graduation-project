"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportDialog } from "@/components/support/support-dialog";


export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background text-foreground px-6 py-12 selection:bg-primary/10 overflow-hidden font-sans">
      {/* Subtle background detail */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-border to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-border to-transparent" />
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="flex flex-col items-center animate-fade-in-up">
          <div className="mb-8 flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 shadow-sm transition-transform hover:scale-105 duration-500">
            <FileQuestion className="w-8 h-8 text-primary/70" />
          </div>

          <div className="space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              404 Error
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Page not found
            </h1>
            <p className="text-muted-foreground text-lg max-w-[380px] mx-auto leading-relaxed">
              The page you are looking for doesn&apos;t exist or has been moved
              to a new location.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm mx-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:flex-1 h-12 rounded-xl gap-2 font-medium transition-all border-border/60 hover:border-border hover:bg-muted/50 active:scale-[0.98]"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              Go back
            </Button>
            <Button
              variant="default"
              size="lg"
              className="w-full sm:flex-1 h-12 rounded-xl gap-2 font-medium shadow-sm active:scale-[0.98]"
              asChild
            >
              <Link href="/">
                <Home className="w-4 h-4" />
                Return home
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="mt-24 pt-8 border-t border-border/40 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground">
            Think this is a mistake?{" "}
            <SupportDialog 
              trigger={
                <button className="text-primary hover:underline font-medium transition-colors">
                  Contact Support
                </button>
              } 
            />

          </p>
        </div>
      </div>
    </div>
  );
}
