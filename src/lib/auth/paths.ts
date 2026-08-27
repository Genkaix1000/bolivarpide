/** Shared auth path helpers (proxy + callback + checks). */

export function isPublicNegocio(pathname: string) {
  return (
    pathname === "/negocio/login" ||
    pathname.startsWith("/negocio/login/") ||
    pathname === "/negocio/registro" ||
    pathname.startsWith("/negocio/registro/") ||
    pathname.startsWith("/negocio/onboarding")
  );
}

export function safeNextPath(next: string | null | undefined, origin?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (!origin) return next;
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}
