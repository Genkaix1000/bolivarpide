import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/paths";

const RECOVERY_ERROR_CODES = new Set([
  "otp_expired",
  "otp_disabled",
  "flow_state_not_found",
  "flow_state_expired",
  "bad_code_verifier",
  "token_exchanged",
]);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), origin);

  let exchangeErrorCode: string | undefined;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const url = new URL(next, origin);
      url.searchParams.set("toast", "login");
      return NextResponse.redirect(url);
    }
    exchangeErrorCode = error.code;
  }

  // Los links de email (recovery/confirmación) fallan con error_code de GoTrue;
  // llevá al usuario a pedir un link nuevo en vez de a un login confuso.
  const errorCode = searchParams.get("error_code") ?? exchangeErrorCode;
  if (errorCode && RECOVERY_ERROR_CODES.has(errorCode)) {
    return NextResponse.redirect(`${origin}/auth/olvide-pass?error=link`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
