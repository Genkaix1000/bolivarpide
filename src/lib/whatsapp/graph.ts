/**
 * Cliente único de la Graph API de Meta.
 *
 * Antes la URL base estaba duplicada en cuatro archivos, con versiones
 * distintas (`v21.0` en los envíos, `v22.0` en el OAuth) y sin timeout ni
 * reintentos: un pico de latencia de Meta colgaba el server action hasta que
 * el runtime lo cortara, y un 500 transitorio perdía el mensaje.
 *
 * Acá vive: resolución de versión, timeout, reintentos de fallas transitorias
 * y errores tipados con el `code` de Meta (que es lo que distingue "fuera de
 * la ventana de 24 h" de "token vencido").
 */

const DEFAULT_GRAPH_VERSION = "v22.0";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;

/** Acepta `v22.0` o `22.0` en la env var; siempre devuelve con la `v`. */
export function metaGraphVersion(): string {
  const raw = process.env.META_GRAPH_VERSION?.trim();
  if (!raw) return DEFAULT_GRAPH_VERSION;
  return /^v/i.test(raw) ? raw : `v${raw}`;
}

export function metaGraphBase(): string {
  return `https://graph.facebook.com/${metaGraphVersion()}`;
}

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

type MetaErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number | string;
    error_subcode?: number | string;
    error_data?: { details?: string };
    fbtrace_id?: string;
  };
};

/** Códigos de Meta que vale la pena distinguir en la UI. */
export const META_ERROR_REENGAGEMENT = 131047; // fuera de la ventana de 24 h
export const META_ERROR_INVALID_TOKEN = 190; // token vencido o revocado

export class MetaGraphError extends Error {
  readonly status: number;
  readonly code: number | null;
  readonly subcode: number | null;
  readonly details: string | null;
  readonly fbtraceId: string | null;

  constructor(input: {
    message: string;
    status: number;
    code?: number | null;
    subcode?: number | null;
    details?: string | null;
    fbtraceId?: string | null;
  }) {
    super(input.message);
    this.name = "MetaGraphError";
    this.status = input.status;
    this.code = input.code ?? null;
    this.subcode = input.subcode ?? null;
    this.details = input.details ?? null;
    this.fbtraceId = input.fbtraceId ?? null;
  }

  get isExpiredToken(): boolean {
    return this.code === META_ERROR_INVALID_TOKEN;
  }

  get isOutsideWindow(): boolean {
    return this.code === META_ERROR_REENGAGEMENT;
  }
}

/** 429 y 5xx son transitorios; los 4xx restantes no se reintentan. */
function isTransientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function backoffMs(attempt: number): number {
  // 300ms, 900ms… con jitter para no sincronizar reintentos entre instancias.
  return 300 * 3 ** attempt + Math.floor(Math.random() * 200);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** `fetch` con timeout duro. Exportado para la descarga binaria de media. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type GraphRequest = {
  /** Path sin barra inicial ni versión, p. ej. `"1234567/messages"`. */
  path: string;
  token: string;
  method?: "GET" | "POST" | "DELETE";
  query?: Record<string, string>;
  /** Body JSON (solo POST). */
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
};

/**
 * Llama a la Graph API y devuelve el JSON tipado.
 *
 * El token viaja en el header `Authorization`, nunca en la query string: la
 * URL termina en logs de acceso y trazas.
 */
export async function graphFetch<T>(req: GraphRequest): Promise<T> {
  const {
    path,
    token,
    method = "GET",
    query,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = req;

  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  const url = `${metaGraphBase()}/${path}${qs}`;

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) await sleep(backoffMs(attempt - 1));

    let res: Response;
    try {
      res = await fetchWithTimeout(
        url,
        {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        },
        timeoutMs,
      );
    } catch (err) {
      // Red caída o timeout: transitorio, se reintenta.
      lastError = new MetaGraphError({
        message:
          err instanceof Error && err.name === "AbortError"
            ? `Meta no respondió en ${timeoutMs}ms`
            : "No se pudo conectar con Meta",
        status: 0,
      });
      continue;
    }

    const json = (await res.json().catch(() => null)) as (T & MetaErrorBody) | null;

    if (res.ok && json && !json.error) return json;

    const metaError = json?.error;
    const error = new MetaGraphError({
      message: metaError?.message || `Error de la API de Meta (HTTP ${res.status})`,
      status: res.status,
      code: toNum(metaError?.code),
      subcode: toNum(metaError?.error_subcode),
      details: metaError?.error_data?.details ?? null,
      fbtraceId: metaError?.fbtrace_id ?? null,
    });

    if (!isTransientStatus(res.status)) throw error;
    lastError = error;
  }

  throw lastError instanceof Error
    ? lastError
    : new MetaGraphError({ message: "Error de la API de Meta", status: 0 });
}
