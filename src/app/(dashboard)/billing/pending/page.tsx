"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Copy, Check, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function PendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const referenceCode = searchParams.get("code");

  const [copied, setCopied] = useState(false);

  const { data } = trpc.payment.getPaymentStatus.useQuery(
    { invoiceId: invoiceId! },
    { enabled: !!invoiceId, refetchInterval: 10000 }
  );

  const copyCode = async () => {
    if (referenceCode) {
      await navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      toast.success("Reference code copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (data?.status === "paid" && invoiceId) {
      router.push(`/billing/success?invoice=${invoiceId}`);
    }
  }, [data?.status, invoiceId, router]);

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="text-center">
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <Clock className="h-16 w-16 text-yellow-500" />
            </motion.div>
            <CardTitle className="text-2xl">Payment Pending</CardTitle>
            <CardDescription>
              Use the reference code below to complete your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {referenceCode && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Reference Code</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-3xl font-mono font-bold tracking-wider bg-muted px-4 py-2 rounded-lg">
                    {referenceCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCode}>
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3 text-sm">
              <p className="font-medium">Instructions:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Visit the nearest payment location</li>
                <li>Provide the reference code above</li>
                <li>Pay the exact amount shown</li>
                <li>Keep your receipt for confirmation</li>
              </ol>
            </div>

            {data?.invoice && (
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {data.invoice.amount} {data.invoice.currency}
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              This page will automatically update when payment is confirmed
            </p>

            <Button variant="outline" onClick={() => router.push("/billing")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Billing
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
