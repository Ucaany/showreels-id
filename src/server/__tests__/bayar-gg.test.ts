import { webcrypto } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
import {
  createBayarGGPayment,
  createBayarGGWebhookSignature,
  mapBayarGGStatusToInternal,
  mapBayarGGStatusToSubscription,
  verifyBayarGGWebhookSignature,
} from "../bayar-gg";

const originalEnv = process.env;
const fetchMock = jest.fn();

describe("bayar-gg gateway", () => {
  beforeAll(() => {
    Object.defineProperty(global, "crypto", {
      value: webcrypto,
      configurable: true,
    });
    Object.defineProperty(global, "TextEncoder", {
      value: TextEncoder,
      configurable: true,
    });
    Object.defineProperty(global, "TextDecoder", {
      value: TextDecoder,
      configurable: true,
    });
    global.fetch = fetchMock as typeof fetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    process.env = {
      ...originalEnv,
      BAYAR_GG_API_KEY: "API-test-key",
      BAYAR_GG_WEBHOOK_SECRET: "super-secret",
      BAYAR_GG_DEFAULT_PAYMENT_METHOD: "qris",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps provider statuses to internal transaction statuses", () => {
    expect(mapBayarGGStatusToInternal("pending")).toBe("pending");
    expect(mapBayarGGStatusToInternal("paid")).toBe("paid");
    expect(mapBayarGGStatusToInternal("expired")).toBe("expired");
    expect(mapBayarGGStatusToInternal("cancelled")).toBe("cancelled");
  });

  it("maps provider statuses to subscription statuses", () => {
    expect(mapBayarGGStatusToSubscription("pending")).toBe("pending");
    expect(mapBayarGGStatusToSubscription("paid")).toBe("active");
    expect(mapBayarGGStatusToSubscription("expired")).toBe("expired");
    expect(mapBayarGGStatusToSubscription("cancelled")).toBe("expired");
  });

  it("verifies webhook signatures using invoice, status, amount, and timestamp", async () => {
    const signature = await createBayarGGWebhookSignature({
      invoiceId: "INV-123",
      status: "paid",
      finalAmount: 25000,
      timestamp: "1710000000",
      webhookSecret: "super-secret",
    });

    await expect(
      verifyBayarGGWebhookSignature({
        payload: {
          invoice_id: "INV-123",
          status: "paid",
          final_amount: 25000,
          timestamp: 1710000000,
        },
        callbackSignature: signature,
        timestamp: "1710000000",
        webhookSecret: "super-secret",
      })
    ).resolves.toBe(true);

    await expect(
      verifyBayarGGWebhookSignature({
        payload: {
          invoice_id: "INV-123",
          status: "paid",
          final_amount: 26000,
          timestamp: 1710000000,
        },
        callbackSignature: signature,
        timestamp: "1710000000",
        webhookSecret: "super-secret",
      })
    ).resolves.toBe(false);
  });

  it("creates a Bayar.gg payment and sends the expected payload", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          invoice_id: "BG-001",
          status: "pending",
          payment_method: "qris",
          payment_url: "https://pay.example/checkout",
          qris_dynamic_image_url: "https://pay.example/qr.png",
        },
      }),
    });

    const result = await createBayarGGPayment({
      amount: 25000,
      description: "Creator monthly",
      customerName: "Test User",
      customerEmail: "test@example.com",
      callbackUrl: "https://showreels.id/api/billing/bayar-gg/callback",
      redirectUrl: "https://showreels.id/dashboard/billing?payment=success&invoice=INV-LOCAL",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          invoice_id: "BG-001",
          payment_method: "qris",
        }),
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://www.bayar.gg/api/create-payment.php");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        "X-API-Key": "API-test-key",
      })
    );

    const body = JSON.parse(String(init.body)) as Record<string, string | number>;
    expect(body.amount).toBe(25000);
    expect(body.description).toBe("Creator monthly");
    expect(body.payment_method).toBe("qris");
    expect(body.callback_url).toBe("https://showreels.id/api/billing/bayar-gg/callback");
    expect(body.redirect_url).toBe(
      "https://showreels.id/dashboard/billing?payment=success&invoice=INV-LOCAL"
    );
  });

  it("maps provider auth failures to Bayar.gg auth errors", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: "Invalid API key",
      }),
    });

    const result = await createBayarGGPayment({
      amount: 25000,
      description: "Creator monthly",
      callbackUrl: "https://showreels.id/api/billing/bayar-gg/callback",
      redirectUrl: "https://showreels.id/dashboard/billing?payment=success&invoice=INV-LOCAL",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: "auth",
      })
    );
  });

  it("maps provider validation failures to Bayar.gg validation errors", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: "payment_method is required",
      }),
    });

    const result = await createBayarGGPayment({
      amount: 25000,
      description: "Creator monthly",
      callbackUrl: "https://showreels.id/api/billing/bayar-gg/callback",
      redirectUrl: "https://showreels.id/dashboard/billing?payment=success&invoice=INV-LOCAL",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: "validation",
      })
    );
  });

  it("maps fetch failures to Bayar.gg network errors", async () => {
    fetchMock.mockRejectedValue(new Error("socket hang up"));

    const result = await createBayarGGPayment({
      amount: 25000,
      description: "Creator monthly",
      callbackUrl: "https://showreels.id/api/billing/bayar-gg/callback",
      redirectUrl: "https://showreels.id/dashboard/billing?payment=success&invoice=INV-LOCAL",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: "network",
      })
    );
  });
});
