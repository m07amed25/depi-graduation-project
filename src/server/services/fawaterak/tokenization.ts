import { fawaterakClient, FawaterakError } from "./client";
import { fawaterakConfig } from "./config";
import type {
  CreateCardTokenRequest,
  CreateCardTokenResponse,
  PayWithTokenRequest,
  PayWithTokenResponse,
} from "./types";

export const tokenization = {
  /**
   * Create a card token screen URL for hosted card capture
   */
  async createCardTokenScreen(
    data: CreateCardTokenRequest
  ): Promise<CreateCardTokenResponse> {
    const response = await fawaterakClient.post<
      CreateCardTokenResponse & {
        redirect_url?: string;
        data?: { redirectUrl?: string; redirect_url?: string };
      }
    >("/api/v2/createCardTokenScreen", data);

    const redirectUrl =
      response.redirectUrl ??
      response.redirect_url ??
      response.data?.redirectUrl ??
      response.data?.redirect_url;

    if (!redirectUrl) {
      throw new FawaterakError(
        "Fawaterak did not return a card token screen URL.",
        500,
        response,
      );
    }

    return { status: "success", redirectUrl };
  },

  /**
   * Charge a saved card token
   */
  async payWithToken(
    data: PayWithTokenRequest
  ): Promise<PayWithTokenResponse["data"]> {
    const response = await fawaterakClient.post<PayWithTokenResponse>(
      "/api/v2/createTokenizationPayRequest",
      data
    );
    return response.data;
  },

  /**
   * Delete a saved card token from Fawaterak
   */
  async deleteCustomerToken(
    customerUniqueId: string,
    cardTokenUniqueId: string
  ): Promise<boolean> {
    try {
      await fawaterakClient.post("/api/v2/deleteCustomerToken", {
        customer_unique_id: customerUniqueId,
        card_token_unique_id: cardTokenUniqueId,
      });
      return true;
    } catch (error) {
      // Log but don't throw - we still want to remove the local record
      console.error("Fawaterak token deletion failed:", error);
      return false;
    }
  },
} as const;
