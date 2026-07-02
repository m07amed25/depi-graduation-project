"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, ArrowLeft, CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const errorMessage = searchParams.get("error");
  const gatewayCode = searchParams.get("gatewayCode");

  const { data } = trpc.payment.getPaymentStatus.useQuery(
    { invoiceId: invoiceId! },
    { enabled: !!invoiceId }
  );

  const getUserMessage = () => {
    if (errorMessage?.includes("3D Secure")) {
      return "Card authentication failed. Please try again or use a different card.";
    }
    if (errorMessage?.includes("cancelled")) {
      return "Payment was cancelled. You can try again when ready.";
    }
    if (gatewayCode === "DECLINED") {
      return "Your card was declined. Please try a different card or contact your bank.";
    }
    return "Payment could not be processed. Please try again or use a different payment method.";
  };

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
              <XCircle className="h-16 w-16 text-destructive" />
            </motion.div>
            <CardTitle className="text-2xl">Payment Failed</CardTitle>
            <CardDescription>{getUserMessage()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push("/billing/pay")} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/billing/pay")}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Use a Different Payment Method
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
