export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallCookieState = "installed" | "dismissed";

export const BP_INSTALL_COOKIE = "bp_pwa_install";
export const BP_INSTALL_VALUE = "installed";
export const BP_DISMISS_VALUE = "dismissed";
export const BP_INSTALL_MAX_AGE_S = 365 * 24 * 60 * 60;
export const BP_DISMISS_MAX_AGE_S = 30 * 24 * 60 * 60;

// Jar duck-type de next/headers cookies() para mantener este módulo isomórfico.
export type CookieJar = { get(name: string): { value?: string } | undefined };

/** Server: lee el estado de la cookie de instalación desde el cookie jar. */
export function readInstallCookie(jar: CookieJar): InstallCookieState | null {
  const value = jar.get(BP_INSTALL_COOKIE)?.value;
  return value === BP_INSTALL_VALUE || value === BP_DISMISS_VALUE
    ? (value as InstallCookieState)
    : null;
}

/** Client: lee el estado de la cookie directamente. */
export function readInstallCookieClient(): InstallCookieState | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";").map((s) => s.trim())) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) !== BP_INSTALL_COOKIE) continue;
    const value = part.slice(eq + 1);
    if (value === BP_INSTALL_VALUE || value === BP_DISMISS_VALUE) {
      return value as InstallCookieState;
    }
  }
  return null;
}

/** Client: setea la cookie de instalación (installed 365d | dismissed 30d). */
export function setInstallCookie(state: InstallCookieState): void {
  if (typeof document === "undefined") return;
  const maxAge = state === BP_INSTALL_VALUE ? BP_INSTALL_MAX_AGE_S : BP_DISMISS_MAX_AGE_S;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${BP_INSTALL_COOKIE}=${state}; path=/; max-age=${maxAge}; SameSite=Lax` + secure;
}

declare global {
  interface Window {
    __bpDeferredPrompt?: BeforeInstallPromptEvent | null;
    __bpAppInstalled?: boolean;
  }
}

/**
 * Script inline en el <head> (beforeInteractive) para capturar
 * `beforeinstallprompt` desde el parse inicial (evita la race con la
 * hidratación) y registrar la instalación en la cookie aunque ocurra sin el
 * FAB montado.
 */
export const PWA_BOOTSTRAP_SCRIPT = `(function () {
  window.__bpDeferredPrompt = null;
  window.__bpAppInstalled = false;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__bpDeferredPrompt = event;
  });
  window.addEventListener("appinstalled", function () {
    var secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = "bp_pwa_install=installed; path=/; max-age=31536000; SameSite=Lax" + secure;
    window.__bpAppInstalled = true;
  });
})();`;

export {};