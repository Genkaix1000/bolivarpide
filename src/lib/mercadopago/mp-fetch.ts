export const MP_API = "https://api.mercadopago.com";
export const MP_HTTP_TIMEOUT_MS = 25_000;

export class MpApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly causes: string[] = [],
  ) {
    super(message);
    this.name = "MpApiError";
  }
}

type MpErrorItem = {
  code?: string;
  message?: string;
  description?: string;
  details?: string[];
};

type MpErrorBody = {
  message?: string;
  error?: string;
  code?: string;
  causes?: { code?: string | number; description?: string }[];
  /** Orders API (QR / in-person) — formato nuevo */
  errors?: MpErrorItem[];
};

/** Exported for the self-check; also used by mpFetch. */
export function parseMpError(body: MpErrorBody, status: number): MpApiError {
  const fromErrors = (body.errors ?? []).flatMap((e) => {
    const head = e.message ?? e.description ?? e.code ?? "";
    const details = (e.details ?? []).filter(Boolean);
    if (head && details.length) return [`${head}: ${details.join("; ")}`];
    if (head) return [head];
    return details;
  });
  const fromCauses = (body.causes ?? [])
    .map((c) => c.description ?? String(c.code ?? ""))
    .filter(Boolean);
  const causes = fromErrors.length ? fromErrors : fromCauses;
  const detail = causes[0] ?? body.message ?? body.error;
  const code =
    body.errors?.[0]?.code ??
    (causes.find((c) => /point_of_sale|already exists|duplicate/i.test(c)) != null
      ? "point_of_sale_exists"
      : body.error ?? body.code);
  return new MpApiError(detail ?? "Error Mercado Pago", status, code, causes);
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

  const body = (await response.json().catch(() => ({}))) as MpErrorBody;
  if (!response.ok) {
    throw parseMpError(body, response.status);
  }
  return body as T;
}
