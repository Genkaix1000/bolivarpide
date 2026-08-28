/**
 * Catálogo normalizado de calles, avenidas y barrios de San Carlos de Bolívar (CP 6550)
 */

export const BOLIVAR_STREETS: readonly string[] = [
  "Av. San Martín",
  "Av. Brown",
  "Av. Lavalle",
  "Av. Gral. Paz",
  "Av. Pedro Vignau",
  "Av. Cancio",
  "Av. Calfucurá",
  "Av. Mariano Unzué",
  "Av. 25 de Mayo",
  "Av. Tres de Febrero",
  "Av. Fabrés García",
  "Av. Centenario",
  "Av. 9 de Julio",
  "Av. Coliqueo",
  "Alsina",
  "Alvarado",
  "Alvear",
  "Ameghino",
  "Arenales",
  "Arana",
  "Avellaneda",
  "Azcuénaga",
  "Balcarce",
  "Belgrano",
  "Boer",
  "Boedo",
  "Castelli",
  "Chacabuco",
  "Chile",
  "Colombia",
  "Coronel Suárez",
  "Dorrego",
  "Edison",
  "España",
  "Estrada",
  "Falucho",
  "Florida",
  "French",
  "Garibaldi",
  "Guaminí",
  "Güemes",
  "Hansen",
  "Ignacio Rivas",
  "Ituzaingó",
  "Juan B. Justo",
  "Junín",
  "Lamadrid",
  "Laprida",
  "Las Heras",
  "Levalle",
  "Libertad",
  "Maipú",
  "Matheu",
  "Mitre",
  "Moreno",
  "Necochea",
  "Olazábal",
  "Olascoaga",
  "Paso",
  "Pellegrini",
  "Pringles",
  "Quintana",
  "Rafael Hernández",
  "Rivadavia",
  "Roca",
  "Rodríguez Peña",
  "Rojas",
  "Saavedra",
  "San Lorenzo",
  "Santa Cruz",
  "Santa Fe",
  "Sarmiento",
  "Sucre",
  "Tejedor",
  "Tres Arroyos",
  "Tucumán",
  "Urquiza",
  "Uriburu",
  "Viamonte",
  "Vicente López",
  "Villarino",
  "Zapiola",
  "Barrio Latino",
  "Barrio Pompeya",
  "Barrio Casariego",
  "Barrio Villa Diamante",
  "Barrio Los Zorzales",
  "Barrio Las Flores",
  "Barrio Cooperativa",
  "Barrio Solidaridad",
  "Barrio Jardín",
  "Barrio Colombo",
  "Barrio Anacleto Medina",
  "Barrio Vivanco",
] as const;

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .trim();
}

/**
 * Busca y rankea sugerencias de calles en Bolívar según lo que escribe el usuario.
 */
export function searchBolivarStreets(query: string, limit = 6): string[] {
  const q = normalizeString(query);
  if (!q) return [];

  const matches: { name: string; score: number }[] = [];

  for (const street of BOLIVAR_STREETS) {
    const s = normalizeString(street);
    if (s === q) {
      matches.push({ name: street, score: 100 });
    } else if (s.startsWith(q)) {
      matches.push({ name: street, score: 80 });
    } else if (s.includes(q)) {
      matches.push({ name: street, score: 50 });
    } else {
      const words = s.split(/\s+/);
      if (words.some((w) => w.startsWith(q))) {
        matches.push({ name: street, score: 60 });
      }
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((m) => m.name);
}

/**
 * Intenta encontrar una calle conocida de Bolívar que coincida con una cadena recibida
 */
export function matchBolivarStreet(rawName: string): string | null {
  const norm = normalizeString(rawName);
  if (!norm) return null;

  for (const street of BOLIVAR_STREETS) {
    const s = normalizeString(street);
    if (s === norm || s.includes(norm) || norm.includes(s)) {
      return street;
    }
  }
  return null;
}
