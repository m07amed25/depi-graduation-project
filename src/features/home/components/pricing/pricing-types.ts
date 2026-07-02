export interface PricingSettings {
  annualDiscount: number;
  trialDays: number;
  trialPlan: string;
  freeSignupEnabled: boolean;
  promoCodesAtCheckout: boolean;
}

export interface DbPricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  highlight: boolean;
  visible: boolean;
  features: string[];
  reposLimit: number | null;
  reviewsLimit: number | null;
  seatsLimit: number | null;
  privateRepos: boolean;
  sortOrder: number;
  accentColor: string;
  cta?: string | null;
  badge?: string | null;
}

export interface MergedPlan extends DbPricingPlan {
  icon: React.ElementType;
  color: string;
  borderColor: string;
  badge: string | null;
  badgeColor: string;
  cta: string;
  ctaVariant: "default" | "outline";
  glow: string;
  borderGlow: string;
  iconShadow: string;
  buttonBg: string;
  buttonHoverBg: string;
  buttonShadow: string;
  buttonOutlineHoverBg: string;
  checkBg: string;
  dividerVia: string;
}

export interface PlanFeature {
  label: string;
  values: (boolean | string)[];
}

export interface CapabilityRow {
  key: string;
  label: string;
  kind: string;
  sortOrder: number;
  plans: { planId: string; enabled: boolean }[];
}
