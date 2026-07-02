"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const token = searchParams.get("token");
  const utils = trpc.useUtils();
  const activationAttempted = useRef(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const { data } = trpc.payment.getPaymentStatus.useQuery(
    { invoiceId: invoiceId! },
    { enabled: !!invoiceId, refetchInterval: (query) => query.state.data?.status === "paid" ? false : 3000 }
  );

  const activate = trpc.payment.activatePlan.useMutation({
    onSuccess: () => {
      setActivationError(null);
      void utils.payment.getPaymentStatus.invalidate();
      void utils.profile.get.invalidate();
    },
    onError: (error) => {
      // If the DB already shows paid (webhook processed), ignore activation errors
      if (data?.status === "paid") {
        setActivationError(null);
      } else {
        setActivationError(error.message);
      }
    },
  });

  useEffect(() => {
    if (invoiceId && token && data?.status !== "paid" && !activate.isPending && !activationAttempted.current) {
      activationAttempted.current = true;
      activate.mutate({ invoiceId, token });
    }
  }, [activate, data?.status, invoiceId, token]);

  // Clear error and stop retrying once polling confirms paid
  useEffect(() => {
    if (data?.status === "paid" && activationError) {
      setActivationError(null);
      void utils.profile.get.invalidate();
    }
  }, [data?.status, activationError, utils.profile.get]);

  const isPaid = data?.status === "paid";
  const isVerifying = !isPaid && (activate.isPending || !!token);

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
              {isPaid ? (
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              ) : activationError ? (
                <AlertCircle className="h-16 w-16 text-amber-500" />
              ) : (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              )}
            </motion.div>
            <CardTitle className="text-2xl">
              {isPaid
                ? "Payment Successful"
                : activationError
                  ? "Payment Verification Pending"
                  : "Verifying your payment..."}
            </CardTitle>
            <CardDescription>
              {isPaid
                ? "Your plan has been upgraded successfully!"
                : activationError
                  ? activationError
                  : "Please wait while we confirm the payment with the provider."}
            </CardDescription>
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
                {data.invoice.planId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{data.invoice.planId}</span>
                  </div>
                )}
              </div>
            )}
            {isVerifying && (
              <p className="text-xs text-muted-foreground">
                This page will update automatically once payment is confirmed.
              </p>
            )}
            <Button onClick={() => router.push("/billing")} className="w-full" disabled={!isPaid}>
              Back to Billing
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
