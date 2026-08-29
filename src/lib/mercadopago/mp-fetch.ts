export const MP_API = "https://api.mercadopago.com";
export const MP_HTTP_TIMEOUT_MS = 25_000;

export class MpApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "MpApiError";
  }
}

export async function mpFetch<T>(
  token: string,
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${MP_API}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(MP_HTTP_TIMEOUT_MS),
    });
  } catch {
    throw new MpApiError(`Mercado Pago no respondió a tiempo (${path})`);
  }

  const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
  if (!response.ok) {
    throw new MpApiError(body.message ?? response.statusText, response.status, body.error);
  }
  return body as T;
}
