/** Normaliza choices legacy (string[]) y nuevas ({ label, price_cents }). */

export type MenuOptionChoice = {
  label: string;
  price_cents: number;
};

export type MenuOptionGroup = {
  id?: string;
  title: string;
  /** select = elige uno; extras = multi con precio */
  kind?: "select" | "extras";
  required?: boolean;
  choices: MenuOptionChoice[] | string[];
};

export function normalizeMenuChoice(raw: string | MenuOptionChoice): MenuOptionChoice | null {
  if (typeof raw === "string") {
    const label = raw.trim();
    return label ? { label, price_cents: 0 } : null;
  }
  const label = String(raw.label ?? "").trim();
  if (!label) return null;
  const cents = Number(raw.price_cents);
  return { label, price_cents: Number.isFinite(cents) && cents > 0 ? Math.round(cents) : 0 };
}

export function normalizeMenuOptionGroup(raw: MenuOptionGroup): ParsedMenuOptionGroup | null {
  const title = String(raw.title ?? "").trim();
  if (!title || !Array.isArray(raw.choices)) return null;
  const choices = raw.choices.map(normalizeMenuChoice).filter(Boolean) as MenuOptionChoice[];
  if (choices.length === 0) return null;
  const kind = raw.kind === "extras" ? "extras" : "select";
  return {
    id: raw.id,
    title,
    kind,
    required: kind === "select" ? Boolean(raw.required) : false,
    choices,
  };
}

export type ParsedMenuOptionGroup = {
  id?: string;
  title: string;
  kind: "select" | "extras";
  required: boolean;
  choices: MenuOptionChoice[];
};

export function parseMenuOptionGroups(raw: unknown): ParsedMenuOptionGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g) => normalizeMenuOptionGroup(g as MenuOptionGroup))
    .filter(Boolean) as ParsedMenuOptionGroup[];
}

export function splitExtrasFromOptions(groups: ParsedMenuOptionGroup[]) {
  const extrasGroup = groups.find((g) => g.kind === "extras");
  const optionGroups = groups.filter((g) => g.kind !== "extras");
  return { extrasGroup, optionGroups };
}

export function extrasGroupFromRows(
  rows: Array<{ label: string; pricePesos: number }>,
  title = "Extras",
): ParsedMenuOptionGroup | null {
  const choices = rows
    .map((r) => {
      const label = r.label.trim();
      if (!label) return null;
      const pesos = Math.round(r.pricePesos);
      return {
        label,
        price_cents: pesos > 0 ? pesos * 100 : 0,
      };
    })
    .filter(Boolean) as MenuOptionChoice[];
  if (choices.length === 0) return null;
  return { title, kind: "extras", required: false, choices };
}
