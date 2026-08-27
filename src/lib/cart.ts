import type { TrendingItem } from "@/lib/mockData";

export type SelectedOptions = Record<string, string>; // optionId → choiceId

export interface CartLine {
  key: string;
  productId: string;
  chainId: string;
  name: string;
  image?: string;
  emoji: string;
  unitPrice: number;
  qty: number;
  note?: string;
  selectedOptions?: SelectedOptions;
  optionLabels?: string[];
}

export interface CartState {
  chainId: string | null;
  lines: CartLine[];
}

export function lineKey(productId: string, selected?: SelectedOptions, note?: string): string {
  const opt = selected ? Object.entries(selected).sort().map(([k, v]) => `${k}:${v}`).join("|") : "";
  return `${productId}__${opt}__${note ?? ""}`;
}

export function unitPrice(item: TrendingItem, selected?: SelectedOptions): number {
  let p = item.price;
  if (!selected || !item.options) return p;
  for (const opt of item.options) {
    const choiceId = selected[opt.id];
    if (!choiceId) continue;
    const choice = opt.choices.find((c) => c.id === choiceId);
    if (choice?.priceDelta) p += choice.priceDelta;
  }
  return p;
}

export function optionLabels(item: TrendingItem, selected?: SelectedOptions): string[] {
  if (!selected || !item.options) return [];
  const labels: string[] = [];
  for (const opt of item.options) {
    const choiceId = selected[opt.id];
    if (!choiceId) continue;
    const choice = opt.choices.find((c) => c.id === choiceId);
    if (choice) labels.push(choice.label);
  }
  return labels;
}

export function requiredOptionsMissing(item: TrendingItem, selected?: SelectedOptions): boolean {
  if (!item.options) return false;
  return item.options.some((o) => o.required && !selected?.[o.id]);
}

/** Empty cart or same chain → ok; different chain → needs switch confirm */
export function addNeedsSwitch(cart: CartState, chainId: string): boolean {
  return Boolean(cart.chainId && cart.chainId !== chainId && cart.lines.length > 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.qty, 0);
}

export function amountToMinOrder(subtotal: number, minOrder: number): number {
  return Math.max(0, minOrder - subtotal);
}

export function canCheckout(subtotal: number, minOrder: number): boolean {
  return subtotal >= minOrder;
}

export function addLine(
  cart: CartState,
  item: TrendingItem,
  qty: number,
  selected?: SelectedOptions,
  note?: string
): CartState {
  const key = lineKey(item.id, selected, note);
  const price = unitPrice(item, selected);
  const labels = optionLabels(item, selected);
  const existing = cart.lines.find((l) => l.key === key);
  const lines = existing
    ? cart.lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
    : [
        ...cart.lines,
        {
          key,
          productId: item.id,
          chainId: item.chainId,
          name: item.name,
          image: item.image,
          emoji: item.emoji,
          unitPrice: price,
          qty,
          note: note || undefined,
          selectedOptions: selected,
          optionLabels: labels.length ? labels : undefined,
        },
      ];
  return { chainId: item.chainId, lines };
}

export function setLineQty(cart: CartState, key: string, qty: number): CartState {
  if (qty <= 0) {
    const lines = cart.lines.filter((l) => l.key !== key);
    return { chainId: lines.length ? cart.chainId : null, lines };
  }
  return { ...cart, lines: cart.lines.map((l) => (l.key === key ? { ...l, qty } : l)) };
}

export function clearCart(): CartState {
  return { chainId: null, lines: [] };
}
