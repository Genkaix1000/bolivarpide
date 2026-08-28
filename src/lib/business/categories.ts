export const TOP_CATEGORIES = [
  { id: "pizzeria", label: "Pizzería", icon: "local_pizza" },
  { id: "hamburgueseria", label: "Hamburguesería", icon: "lunch_dining" },
  { id: "empanadas", label: "Empanadas", icon: "bakery_dining" },
  { id: "heladeria", label: "Helados", icon: "icecream" },
] as const;

export const KNOWN_CATEGORIES = [
  ...TOP_CATEGORIES,
  { id: "cafeteria", label: "Cafetería", icon: "local_cafe" },
  { id: "farmacia", label: "Farmacia", icon: "medication" },
  { id: "kiosco", label: "Kiosco", icon: "storefront" },
  { id: "almacen", label: "Almacén", icon: "shopping_cart" },
  { id: "sushi", label: "Sushi", icon: "set_meal" },
  { id: "asado", label: "Parrilla / Asado", icon: "outdoor_grill" },
  { id: "pastas", label: "Pastas / Italiana", icon: "restaurant" },
  { id: "panaderia", label: "Panadería", icon: "breakfast_dining" },
  { id: "rotiseria", label: "Rotisería", icon: "takeout_dining" },
  { id: "saludable", label: "Saludable", icon: "eco" },
  { id: "sandwiches", label: "Sandwiches", icon: "fastfood" },
  { id: "verduleria", label: "Verdulería", icon: "nutrition" },
  { id: "carniceria", label: "Carnicería", icon: "kebab_dining" },
  { id: "dietetica", label: "Dietética", icon: "spa" },
  { id: "bebidas", label: "Bebidas", icon: "local_bar" },
] as const;

export type CategoryId = (typeof KNOWN_CATEGORIES)[number]["id"] | "variados";

export function resolveCategory(rawSelection: string, customInput?: string) {
  const normalizedCustom = customInput?.trim().toLowerCase();

  const match = KNOWN_CATEGORIES.find(
    (c) =>
      c.id === rawSelection ||
      (normalizedCustom &&
        (c.label.toLowerCase() === normalizedCustom || c.id === normalizedCustom)),
  );

  if (match) {
    return { category: match.id, customCategoryInput: null as string | null };
  }

  return {
    category: "variados" as const,
    customCategoryInput: customInput?.trim() || "Otros",
  };
}

export function suggestCategories(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const minRatio = 0.5;

  return KNOWN_CATEGORIES.filter((c) => {
    const label = c.label.toLowerCase();
    const id = c.id.toLowerCase();

    if (id.includes(q) && q.length >= Math.ceil(id.length * minRatio)) return true;
    if (!label.includes(q)) return false;
    return q.length / label.length >= minRatio;
  }).slice(0, 6);
}
