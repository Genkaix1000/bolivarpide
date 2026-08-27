/** Marks first visit and returns true only once per key (localStorage). */
export function consumeFirstVisit(key: string): boolean {
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}

export const SPLASH_HOME = "bp_splash_home";
export const SPLASH_NEGOCIO = "bp_splash_negocio";
