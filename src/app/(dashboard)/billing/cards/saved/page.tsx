"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const POLL_MS = 2000;
const MAX_WAIT_MS = 45_000;

export default function CardSavedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const failed =
    searchParams.get("error") === "failed" ||
    searchParams.get("status") === "failed";
  const [timedOut, setTimedOut] = useState(false);
  const syncAttempted = useRef(false);

  const utils = trpc.useUtils();

  const confirmSavedCard = trpc.payment.confirmSavedCard.useMutation({
    onSuccess: () => {
      void utils.payment.getSavedCards.invalidate();
      void utils.billing.getInfo.invalidate();
    },
  });

  const { data: billing, isLoading } = trpc.billing.getInfo.useQuery(undefined, {
    enabled: !failed,
    refetchInterval: (query) => {
      if (failed || timedOut || confirmSavedCard.isPending) return false;
      if ((query.state.data?.paymentMethods.length ?? 0) > 0) return false;
      return POLL_MS;
    },
  });

  const cardSaved = (billing?.paymentMethods.length ?? 0) > 0;

  // Some Fawaterak flows append token fields to the success redirect URL.
  useEffect(() => {
    if (failed || syncAttempted.current) return;

    const customerCardToken =
      searchParams.get("customerCardToken") ??
      searchParams.get("customer_card_token") ??
      searchParams.get("customer_token");

    if (!customerCardToken) return;

    syncAttempted.current = true;
    confirmSavedCard.mutate({
      customerCardToken,
      customerCard:
        searchParams.get("customerCard") ??
        searchParams.get("customer_card") ??
        undefined,
      hashKey: searchParams.get("hashKey") ?? searchParams.get("hash_key") ?? undefined,
      cardBrand: searchParams.get("cardBrand") ?? searchParams.get("card_brand") ?? undefined,
      cardTokenUniqueId:
        searchParams.get("cardTokenUniqueId") ??
        searchParams.get("card_token_unique_id") ??
        undefined,
    });
  }, [failed, searchParams, confirmSavedCard]);

  useEffect(() => {
    if (failed || cardSaved) return;
    const timer = window.setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [failed, cardSaved]);

  const waiting =
    !failed &&
    !cardSaved &&
    !timedOut &&
    (isLoading || confirmSavedCard.isPending);

  const syncError = confirmSavedCard.error?.message;

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
              {failed ? (
                <AlertCircle className="h-16 w-16 text-destructive" />
              ) : waiting ? (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              ) : timedOut && !cardSaved ? (
                <AlertCircle className="h-16 w-16 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              )}
            </motion.div>
            <CardTitle className="text-2xl">
              {failed
                ? "Card Not Saved"
                : waiting
                  ? "Saving Your Card..."
                  : cardSaved
                    ? "Card Saved"
                    : timedOut
                      ? "Still Processing"
                      : "Card Not Saved"}
            </CardTitle>
            <CardDescription>
              {failed
                ? "Fawaterak could not save your card. Please try again."
                : waiting
                  ? "Confirming with our payment provider. This usually takes a few seconds."
                  : cardSaved
                    ? "Your payment method has been saved successfully."
                    : syncError
                      ? syncError
                      : timedOut
                        ? "We did not receive confirmation from Fawaterak. Ensure the token webhook URL is reachable from the internet, then add the card again."
                        : "We could not confirm your card was saved. Please try again from Billing."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cardSaved && billing?.paymentMethods[0] && (
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">
                  {billing.paymentMethods[0].cardBrand} •••• {billing.paymentMethods[0].lastFour}
                </span>
              </div>
            )}
            <Button
              onClick={() => router.push("/billing")}
              className="w-full"
              disabled={waiting}
            >
              {waiting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                "Back to Billing"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
