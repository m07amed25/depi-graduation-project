/**
 * Fawaterak HTTP client
 * @see https://fawaterk.com/docs
 */

import { fawaterakConfig } from "./config";

export class FawaterakError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "FawaterakError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${fawaterakConfig.baseUrl}${endpoint}`;

  console.log("[Fawaterak] Requesting:", url);

  const response = await fetch(
    new Request(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${fawaterakConfig.apiKey}`,
        ...options.headers,
      },
    }),
    { cache: "no-store" }
  );

  // Check content-type before parsing
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error("[Fawaterak] Non-JSON response:", response.status, text.slice(0, 500));
    throw new FawaterakError(
      `Fawaterak API error (${response.status}). Check API key and base URL.`,
      response.status,
      text
    );
  }

  const data = await response.json();

  if (!response.ok || data.status !== "success") {
    console.error("[Fawaterak] API error:", data);
    const msg =
      typeof data.message === "string"
        ? data.message
        : typeof data.message === "object" && data.message !== null
          ? Object.values(data.message).flat().join("; ")
          : "Fawaterak API request failed";
    throw new FawaterakError(msg, response.status, data);
  }

  return data;
}

export const fawaterakClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
} as const;
