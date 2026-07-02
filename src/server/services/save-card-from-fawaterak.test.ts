import crypto from "crypto";
import {
  parseTokenizationWebhookBody,
  verifyTokenizationWebhookHash,
} from "./save-card-from-fawaterak";

jest.mock("@/server/services/fawaterak/config", () => ({
  fawaterakConfig: {
    vendorKey: "test-vendor-key",
    apiKey: "test-api-key",
  },
}));

describe("parseTokenizationWebhookBody", () => {
  it("parses camelCase payload", () => {
    const parsed = parseTokenizationWebhookBody({
      customerUniqueId: "user-1",
      customerCardToken: "tok_123",
      customerCard: "512345xxxxxx0008",
      cardTokenUniqueId: "2345",
      cardBrand: "MASTERCARD",
      hashKey: "abc",
    });
    expect(parsed?.customerUniqueId).toBe("user-1");
    expect(parsed?.customerCardToken).toBe("tok_123");
  });

  it("parses snake_case payload", () => {
    const parsed = parseTokenizationWebhookBody({
      customer_unique_id: "user-2",
      customer_card_token: "tok_456",
      customer_card: "411111xxxxxx1111",
    });
    expect(parsed?.customerUniqueId).toBe("user-2");
    expect(parsed?.customerCardToken).toBe("tok_456");
  });
});

describe("verifyTokenizationWebhookHash", () => {
  it("accepts hash signed with vendor key", () => {
    const customerUniqueId = "user-1";
    const customerCardToken = "9731673377207107";
    const queryParam = `customerUniqueId=${customerUniqueId}&customerCardToken=${customerCardToken}`;
    const hashKey = crypto
      .createHmac("sha256", "test-vendor-key")
      .update(queryParam)
      .digest("hex");

    expect(
      verifyTokenizationWebhookHash(customerUniqueId, customerCardToken, hashKey),
    ).toBe(true);
  });
});
