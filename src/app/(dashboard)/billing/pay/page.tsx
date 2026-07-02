"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import {
  CreditCard,
  Building2,
  Smartphone,
  Loader2,
  ArrowLeft,
  Check,
  Zap,
  Rocket,
  Crown,
} from "lucide-react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const methodIcons: Record<string, React.ReactNode> = {
  Card: <CreditCard className="h-8 w-8" />,
  Fawry: <Building2 className="h-8 w-8" />,
  MobileWallets: <Smartphone className="h-8 w-8" />,
  Meeza: <Smartphone className="h-8 w-8" />,
  Aman: <Building2 className="h-8 w-8" />,
};

const planIcons: Record<string, React.ElementType> = {
  free: Zap,
  pro: Rocket,
  enterprise: Crown,
};

export default function PayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") ?? "";
  const initialCycle =
    (searchParams.get("cycle") as "monthly" | "yearly") ?? "yearly";

  const [planId, setPlanId] = useState(initialPlan);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    initialCycle
  );
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  // Stable idempotency key — regenerated only when the user navigates away and back
  const idempotencyKeyRef = useRef<string>(uuidv4());

  const { data: plans, isLoading: loadingPlans } =
    trpc.payment.getUpgradePlans.useQuery();
  const { data: methods, isLoading: loadingMethods } =
    trpc.payment.getPaymentMethods.useQuery();
  const { data: savedCards } = trpc.payment.getSavedCards.useQuery();
  const { data: checkout } = trpc.payment.getCheckoutSummary.useQuery(
    { planId, billingCycle },
    { enabled: !!planId }
  );

  // Auto-select the plan from URL if available in the list
  useEffect(() => {
    if (plans && initialPlan && plans.some((p) => p.id === initialPlan)) {
      setPlanId(initialPlan);
    } else if (plans && plans.length > 0 && !planId) {
      setPlanId(plans[0]!.id);
    }
  }, [plans, initialPlan, planId]);

  useEffect(() => {
    if (!savedCards?.length || savedCardId || selectedMethod) return;
    const defaultCard = savedCards.find((c) => c.isDefault) ?? savedCards[0];
    if (defaultCard) setSavedCardId(defaultCard.id);
  }, [savedCards, savedCardId, selectedMethod]);

  const selectedPlan = plans?.find((p) => p.id === planId);

  const getDisplayPrice = () => {
    if (!selectedPlan) return null;
    // Approximate — server calculates exact with discounts
    const monthly = selectedPlan.monthlyPrice;
    if (billingCycle === "monthly") return monthly;
    return Math.round(monthly * 12 * 0.8); // ~20% annual discount
  };

  const initiatePayment = trpc.payment.initiatePayment.useMutation({
    onSuccess: (data) => {
      if ("paidWithCredit" in data && data.paidWithCredit) {
        toast.success("Plan activated using your account credit!");
        router.push("/billing");
      } else if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else if (data.referenceCode) {
        router.push(
          `/billing/pending?invoice=${data.invoiceId}&code=${data.referenceCode}`
        );
      } else {
        router.push(`/billing/success?invoice=${data.invoiceId}`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const payWithSavedCard = trpc.payment.payWithSavedCard.useMutation({
    onSuccess: (data) => {
      if ("paidWithCredit" in data && data.paidWithCredit) {
        toast.success("Plan activated using your account credit!");
        router.push("/billing");
        return;
      }
      router.push(`/billing/success?invoice=${data.invoiceId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const payWithCredit = trpc.payment.payWithCredit.useMutation({
    onSuccess: () => {
      toast.success("Plan activated using your account credit!");
      router.push("/billing");
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePay = () => {
    if (!planId) {
      toast.error("No plan selected");
      return;
    }
    // If credit covers the full amount, pay with credit directly
    if (checkout?.canPayWithCredit) {
      payWithCredit.mutate({ planId, billingCycle });
      return;
    }
    if (savedCardId) {
      payWithSavedCard.mutate({ planId, billingCycle, cardId: savedCardId });
    } else if (selectedMethod) {
      initiatePayment.mutate({
        planId,
        billingCycle,
        paymentMethodId: selectedMethod,
        idempotencyKey: idempotencyKeyRef.current,
      });
    }
  };

  const isLoading = initiatePayment.isPending || payWithSavedCard.isPending || payWithCredit.isPending;
  const displayPrice = getDisplayPrice();

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Plan & Cycle Selection */}
        <div className="lg:col-span-3 space-y-6">
          {/* Plan Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Plan</CardTitle>
              <CardDescription>
                Select the plan that fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingPlans ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                plans?.map((plan) => {
                  const Icon = planIcons[plan.id] ?? Zap;
                  return (
                    <motion.button
                      key={plan.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPlanId(plan.id)}
                      className={cn(
                        "w-full rounded-xl border-2 p-4 text-left transition-all",
                        planId === plan.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            plan.id === "pro"
                              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                              : "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{plan.name}</p>
                            {plan.id === "pro" && (
                              <Badge variant="secondary" className="text-xs">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plan.tagline}
                          </p>
                        </div>
                        <p className="text-lg font-bold">
                          ${plan.monthlyPrice}
                          <span className="text-sm font-normal text-muted-foreground">
                            /mo
                          </span>
                        </p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Billing Cycle */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      billingCycle === "monthly"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Monthly
                  </span>
                  <Switch
                    checked={billingCycle === "yearly"}
                    onCheckedChange={(v) =>
                      setBillingCycle(v ? "yearly" : "monthly")
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      billingCycle === "yearly"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Annual
                  </span>
                </div>
                {billingCycle === "yearly" && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Save 20%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose how you&apos;d like to pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saved Cards */}
              {savedCards && savedCards.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Saved Cards
                  </h4>
                  {savedCards.map((card) => (
                    <motion.button
                      key={card.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSavedCardId(card.id);
                        setSelectedMethod(null);
                      }}
                      className={cn(
                        "w-full rounded-lg border-2 p-3 text-left transition-colors",
                        savedCardId === card.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {card.cardBrand} •••• {card.lastFour}
                          </p>
                          {card.isDefault && (
                            <span className="text-xs text-muted-foreground">
                              Default
                            </span>
                          )}
                        </div>
                        {savedCardId === card.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Other Methods */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Other Methods
                </h4>
                {loadingMethods ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : methods && methods.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {methods.map((method) => (
                      <motion.button
                        key={method.paymentId}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMethod(method.paymentId);
                          setSavedCardId(null);
                        }}
                        className={cn(
                          "rounded-lg border-2 p-3 text-left transition-colors",
                          selectedMethod === method.paymentId
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-muted-foreground">
                            {methodIcons[method.name_en] ?? (
                              <CreditCard className="h-8 w-8" />
                            )}
                          </div>
                          <p className="flex-1 font-medium text-sm">
                            {method.name_en}
                          </p>
                          {method.logo && (
                            <Image
                              src={method.logo}
                              alt={method.name_en}
                              width={48}
                              height={24}
                              className="h-6 w-auto object-contain"
                            />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Payment methods unavailable. Please verify your configuration.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlan ? (
                  <>
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{selectedPlan.name}</span>
                        <Badge variant="outline" className="capitalize">
                          {billingCycle}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedPlan.tagline}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {billingCycle === "yearly"
                            ? "Annual total"
                            : "Monthly total"}
                        </span>
                        <span className="font-semibold">
                          ${checkout?.basePrice ?? displayPrice}
                        </span>
                      </div>
                      {checkout && checkout.creditUsed > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Account credit</span>
                          <span className="font-medium">-${checkout.creditUsed}</span>
                        </div>
                      )}
                      {billingCycle === "yearly" && !checkout && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Annual savings</span>
                          <span className="font-medium">
                            -$
                            {selectedPlan.monthlyPrice * 12 -
                              (displayPrice ?? 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>To pay</span>
                        <span>
                          ${checkout?.finalAmount ?? displayPrice}
                          {(checkout?.finalAmount ?? displayPrice) !== 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                              {billingCycle === "yearly" ? "/yr" : "/mo"}
                            </span>
                          )}
                          {checkout?.canPayWithCredit && (
                            <span className="text-sm font-normal text-emerald-500 ml-2">
                              Free with credit
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Features preview */}
                    <div className="border-t pt-3 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Includes
                      </p>
                      {selectedPlan.features.slice(0, 5).map((f) => (
                        <div
                          key={f}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Check className="h-3 w-3 text-green-500 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                      {selectedPlan.features.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{selectedPlan.features.length - 5} more
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select a plan to see summary
                  </p>
                )}

                <Button
                  onClick={handlePay}
                  disabled={
                    isLoading ||
                    !planId ||
                    (!checkout?.canPayWithCredit && !selectedMethod && !savedCardId)
                  }
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : checkout?.canPayWithCredit ? (
                    "Activate with Credit"
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment · Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
