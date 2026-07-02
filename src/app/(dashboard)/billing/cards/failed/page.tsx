"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fawaterakMessage =
    searchParams.get("message") ??
    searchParams.get("error_message") ??
    searchParams.get("errorMessage");

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="text-center">
          <CardHeader>
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Card Not Saved</CardTitle>
            <CardDescription>
              Fawaterak could not save your card before returning to Code Catch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-left text-sm text-muted-foreground">
            {fawaterakMessage && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                {fawaterakMessage}
              </p>
            )}
            <ul className="list-disc pl-5 space-y-2">
              <li>Use a valid Egyptian bank card (Visa / Mastercard).</li>
              <li>
                Update billing info with your real mobile number (
                <span className="font-mono">01xxxxxxxxx</span>).
              </li>
              <li>Complete 3-D Secure if your bank prompts for it.</li>
              <li>Try again within 10 minutes — the Fawaterak link expires quickly.</li>
            </ul>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => router.push("/billing")} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Billing
              </Button>
              <Button variant="outline" onClick={() => router.push("/billing")} className="w-full">
                Update billing info & retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
