import { fawaterakClient } from "./client";
import type {
  ExecutePaymentRequest,
  ExecutePaymentResponse,
  GetPaymentMethodsResponse,
  CreateInvoiceLinkRequest,
  CreateInvoiceLinkResponse,
  TransactionDataResponse,
} from "./types";

export const payments = {
  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<GetPaymentMethodsResponse["data"]> {
    const response = await fawaterakClient.get<GetPaymentMethodsResponse>(
      "/api/v2/getPaymentmethods"
    );
    return response.data;
  },

  /**
   * Execute a payment transaction
   */
  async executePayment(
    data: ExecutePaymentRequest
  ): Promise<ExecutePaymentResponse["data"]> {
    const response = await fawaterakClient.post<ExecutePaymentResponse>(
      "/api/v2/invoiceInitPay",
      data
    );
    return response.data;
  },

  /**
   * Create an invoice link
   */
  async createInvoiceLink(
    data: CreateInvoiceLinkRequest
  ): Promise<CreateInvoiceLinkResponse["data"]> {
    const response = await fawaterakClient.post<CreateInvoiceLinkResponse>(
      "/api/v2/createInvoiceLink",
      data
    );
    return response.data;
  },

  /**
   * Get transaction data by invoice ID
   */
  async getTransactionData(invoiceId: number): Promise<TransactionDataResponse["data"]> {
    const response = await fawaterakClient.get<TransactionDataResponse>(
      `/api/v2/getInvoiceData/${invoiceId}`
    );
    return response.data;
  },
} as const;
