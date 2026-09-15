export type ProviderErrorCode = "timeout" | "rate_limited" | "server_error" | "network_error" | "http_error";

export class ProviderError extends Error {
  code: ProviderErrorCode;
  status?: number;

  constructor(message: string, code: ProviderErrorCode, status?: number) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch with a hard timeout and retry-with-backoff on transient failures
 * (429, 5xx, network errors, timeouts). Non-transient HTTP errors (4xx other
 * than 429) are returned as-is for the caller to read the response body from
 * — those carry provider-specific error detail we don't want to swallow.
 */
export async function robustFetch(
  url: string,
  init: RequestInit,
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const retries = opts.retries ?? 2;
  let lastError: ProviderError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        lastError = new ProviderError(
          `Provider returned ${res.status}`,
          res.status === 429 ? "rate_limited" : "server_error",
          res.status
        );
        if (attempt < retries) {
          await sleep(300 * 2 ** attempt);
          continue;
        }
        throw lastError;
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof ProviderError) throw err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      lastError = isAbort
        ? new ProviderError("Request timed out", "timeout")
        : new ProviderError(`Network error: ${err instanceof Error ? err.message : String(err)}`, "network_error");
      if (attempt < retries) {
        await sleep(300 * 2 ** attempt);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new ProviderError("Request failed", "network_error");
}
