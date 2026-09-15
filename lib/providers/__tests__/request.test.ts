import { describe, it, expect, vi, afterEach } from "vitest";
import { robustFetch, ProviderError } from "../request";

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("robustFetch — success paths", () => {
  it("returns the response immediately on first success, no retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await robustFetch("https://example.test", {});
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes through a non-retryable client error (e.g. 400) without throwing or retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, { error: "bad request" }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await robustFetch("https://example.test", {});
    expect(res.status).toBe(400);
    expect(res.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("robustFetch — retry on transient failures", () => {
  it("retries a 500 and succeeds on the second attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await robustFetch("https://example.test", {}, { retries: 2 });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws a ProviderError with code server_error after exhausting retries on repeated 5xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(robustFetch("https://example.test", {}, { retries: 1 })).rejects.toMatchObject({
      code: "server_error",
      status: 503,
    } satisfies Partial<ProviderError>);
    expect(fetchMock).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it("throws a ProviderError with code rate_limited after exhausting retries on repeated 429", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(429));
    vi.stubGlobal("fetch", fetchMock);

    await expect(robustFetch("https://example.test", {}, { retries: 1 })).rejects.toMatchObject({
      code: "rate_limited",
    });
  });

  it("wraps a thrown network error as ProviderError with code network_error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(robustFetch("https://example.test", {}, { retries: 0 })).rejects.toMatchObject({
      code: "network_error",
    });
  });
});

describe("robustFetch — timeout", () => {
  it("aborts and throws a ProviderError with code timeout when the request hangs", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted.");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      robustFetch("https://example.test", {}, { timeoutMs: 30, retries: 0 })
    ).rejects.toMatchObject({ code: "timeout" });
  });
});
