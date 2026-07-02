export interface FawaterakCustomer {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  customer_unique_id?: string;
}

export interface FawaterakCartItem {
  name: string;
  price: string;
  quantity: string;
}

export interface FawaterakRedirectionUrls {
  successUrl?: string;
  failUrl?: string;
  pendingUrl?: string;
  webhookUrl?: string;
}

export interface ExecutePaymentRequest {
  payment_method_id: number;
  cartTotal: string;
  currency: string;
  customer: FawaterakCustomer;
  cartItems: FawaterakCartItem[];
  redirectionUrls: FawaterakRedirectionUrls;
  invoice_number?: string;
  payLoad?: Record<string, unknown>;
}

export interface ExecutePaymentResponse {
  status: "success";
  data: {
    invoice_id: number;
    invoice_key: string;
    payment_data: {
      redirectTo?: string;
      fawryCode?: string;
      expireDate?: string;
      amanCode?: string;
      masaryCode?: string;
      meezaReference?: number;
      meezaQrCode?: string;
    };
  };
}

export interface PaymentMethod {
  paymentId: number;
  name_en: string;
  name_ar: string;
  redirect: string;
  logo: string;
}

export interface GetPaymentMethodsResponse {
  status: "success";
  data: PaymentMethod[];
}

export interface CreateInvoiceLinkRequest {
  invoice_amount: string;
  invoice_description: string;
  currency: string;
  customer?: FawaterakCustomer;
  webhookUrl?: string;
  redirect_url?: string;
  expire_date?: string;
}

export interface CreateInvoiceLinkResponse {
  status: "success";
  data: {
    url: string;
    invoice_id: number;
    invoice_key: string;
  };
}

export interface TransactionDataResponse {
  status: "success";
  data: {
    id: number;
    invoice_key: string;
    /** Amount in original checkout currency (e.g. "79.00") */
    total_paid: string;
    /** Total in EGP after conversion */
    total: number;
    currency: string;
    status_text: "paid" | "pending" | "failed" | "expired" | "refund";
    payment_method: string;
    customer_data: string;
    created_at: string;
    paid_at?: string | null;
  };
}

export interface CreateCardTokenRequest {
  deduct_total_amount?: boolean;
  customerData: {
    customer_unique_id: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order: {
    currency: string;
    cartTotal?: string | number;
    cartItems?: { name: string; price: string | number; quantity: string | number }[];
  };
  allowedCardTypes?: string[];
  redirectionUrls: {
    success_url: string;
    fail_url: string;
    /** Receives customerCardToken after the customer saves their card. */
    webhook_url: string;
    /** CamelCase alias — some Fawaterak environments accept this key instead. */
    webhookUrl?: string;
  };
}

export interface CreateCardTokenResponse {
  status: "success";
  redirectUrl: string;
}

export interface PayWithTokenRequest {
  cartTotal: string;
  currency: string;
  customer: FawaterakCustomer;
  cartItems: FawaterakCartItem[];
  redirectionUrls: FawaterakRedirectionUrls;
  card_token: string;
  invoice_number?: string;
  payLoad?: Record<string, unknown>;
}

export interface PayWithTokenResponse {
  status: "success";
  data: {
    invoice_id: number;
    invoice_key: string;
    transaction_id: string;
  };
}

export interface WebhookPayload {
  invoice_id: number;
  invoice_key: string;
  invoice_amount: string;
  invoice_status: "paid" | "pending" | "failed" | "expired" | "refund";
  payment_method: string;
  customer: FawaterakCustomer;
  created_at: string;
  paid_at?: string;
  transaction_id?: string;
  reference_number?: string;
}
