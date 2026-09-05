/** Map Supabase Auth errors to Spanish UI copy. */

const BY_CODE: Record<string, string> = {
  over_email_send_rate_limit: "Superaste el límite de emails. Esperá un rato e intentá de nuevo.",
  over_request_rate_limit: "Demasiados intentos. Esperá un momento e intentá de nuevo.",
  email_not_confirmed: "Confirmá tu email antes de iniciar sesión.",
  invalid_credentials: "Email o contraseña incorrectos.",
  user_already_exists: "Ya existe una cuenta con ese email.",
  email_exists: "Ya existe una cuenta con ese email.",
  email_address_invalid: "El email no es válido.",
  weak_password: "La contraseña es demasiado débil.",
  signup_disabled: "El registro por email está deshabilitado.",
  user_banned: "Esta cuenta está suspendida.",
  session_not_found: "La sesión expiró. Volvé a iniciar sesión.",
  refresh_token_not_found: "La sesión expiró. Volvé a iniciar sesión.",
  otp_expired: "El código o link expiró. Pedí uno nuevo.",
  otp_disabled: "Ese método de verificación no está disponible.",
  provider_disabled: "Ese método de acceso no está disponible.",
  validation_failed: "Revisá los datos e intentá de nuevo.",
  same_password: "La nueva contraseña tiene que ser distinta a la actual.",
  reauthentication_needed: "Por seguridad, volvé a iniciar sesión.",
  current_password_mismatch: "La contraseña actual no es correcta.",
  insufficient_aal: "Por seguridad, completá la verificación de dos pasos.",
  unexpected_failure: "Algo salió mal. Intentá de nuevo.",
};

const BY_MESSAGE: Array<[RegExp, string]> = [
  [/email rate limit exceeded/i, BY_CODE.over_email_send_rate_limit],
  [/rate limit/i, BY_CODE.over_request_rate_limit],
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/user already registered/i, BY_CODE.user_already_exists],
  [/already (been )?registered/i, BY_CODE.user_already_exists],
  [/email signups? are disabled/i, BY_CODE.signup_disabled],
  [/signups? (not allowed|disabled)/i, BY_CODE.signup_disabled],
  [/password should be at least/i, BY_CODE.weak_password],
  [/password is known to be weak/i, BY_CODE.weak_password],
  [/unable to validate email/i, BY_CODE.email_address_invalid],
  [/invalid email/i, BY_CODE.email_address_invalid],
  [/current password/i, BY_CODE.current_password_mismatch],
  [/user not found/i, "No encontramos una cuenta con esos datos."],
  [/network/i, "Error de red. Revisá tu conexión."],
  [/for security purposes/i, "Por seguridad tenés que esperar un momento antes de reintentar."],
];

export function authErrorEs(error: { message?: string; code?: string } | string | null | undefined) {
  if (!error) return "Error inesperado.";
  const message = typeof error === "string" ? error : error.message ?? "";
  const code = typeof error === "string" ? undefined : error.code;

  if (code && BY_CODE[code]) return BY_CODE[code];
  for (const [re, es] of BY_MESSAGE) {
    if (re.test(message)) return es;
  }
  if (message.trim()) return message;
  return "Error inesperado.";
}
