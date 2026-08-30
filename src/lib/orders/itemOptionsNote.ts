import type { OrderItemOptionDetail } from "@/lib/orders/lifecycle";

const PREFIX = "__opts__:";

/** Guarda añadidos en note hasta que exista options_detail en DB (o como respaldo). */
export function packOrderItemNote(
  userNote?: string,
  optionsDetail?: OrderItemOptionDetail[],
): string | null {
  const trimmed = userNote?.trim() ?? "";
  if (!optionsDetail?.length) return trimmed || null;
  const meta = `${PREFIX}${JSON.stringify(optionsDetail)}`;
  return trimmed ? `${trimmed}\n${meta}` : meta;
}

export function unpackOrderItemNote(note?: string | null): {
  note: string | null;
  optionsDetail: OrderItemOptionDetail[];
} {
  if (!note) return { note: null, optionsDetail: [] };
  const idx = note.indexOf(PREFIX);
  if (idx === -1) return { note, optionsDetail: [] };
  const userNote = note.slice(0, idx).trim() || null;
  try {
    const raw = JSON.parse(note.slice(idx + PREFIX.length)) as unknown;
    if (!Array.isArray(raw)) return { note: userNote, optionsDetail: [] };
    return {
      note: userNote,
      optionsDetail: raw.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const label = (entry as { label?: unknown }).label;
        const priceCents = (entry as { priceCents?: unknown }).priceCents;
        if (typeof label !== "string" || !label.trim()) return [];
        return [{ label: label.trim(), priceCents: typeof priceCents === "number" ? priceCents : 0 }];
      }),
    };
  } catch {
    return { note, optionsDetail: [] };
  }
}

export function resolveItemOptions(
  note?: string | null,
  optionsDetailRaw?: unknown,
): { note: string | null; optionsDetail: OrderItemOptionDetail[] } {
  const fromColumn = Array.isArray(optionsDetailRaw)
    ? optionsDetailRaw.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const label = (entry as { label?: unknown }).label;
        const priceCents = (entry as { priceCents?: unknown }).priceCents;
        if (typeof label !== "string" || !label.trim()) return [];
        return [{ label: label.trim(), priceCents: typeof priceCents === "number" ? priceCents : 0 }];
      })
    : [];
  if (fromColumn.length > 0) return { note: note ?? null, optionsDetail: fromColumn };
  return unpackOrderItemNote(note);
}
