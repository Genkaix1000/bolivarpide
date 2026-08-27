export const PASSWORD_RULES = [
  { id: "len", label: "Mínimo 8 caracteres", short: "8+", test: (p: string) => p.length >= 8 },
  { id: "lower", label: "Una minúscula (a-z)", short: "a-z", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "Una mayúscula (A-Z)", short: "A-Z", test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit", label: "Un número (0-9)", short: "0-9", test: (p: string) => /\d/.test(p) },
  { id: "symbol", label: "Un símbolo (!@#$…)", short: "!@#", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function unmetPasswordRules(password: string) {
  return PASSWORD_RULES.filter((r) => !r.test(password));
}

export function passwordIsValid(password: string) {
  return unmetPasswordRules(password).length === 0;
}
