import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BusinessOnboardingWizard } from "@/components/business/BusinessOnboardingWizard";
import { RegistroLanding } from "./RegistroLanding";

export default async function RegistroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingBusinessId: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .eq("status", "active")
      .maybeSingle();
    existingBusinessId = data?.business_id ?? null;
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Wizard zone — accent background */}
      <div className="relative bg-gradient-to-b from-[#9a0002] via-[#8a0002] to-[#7a0001] pb-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,_rgba(255,255,255,0.12)_0%,_transparent_50%)]" />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-white/80 transition hover:text-white"
          >
            <span className="transition group-hover:-translate-x-0.5">←</span>
            Volver al inicio
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-base font-black text-white ring-1 ring-white/25 backdrop-blur-sm">
              B
            </div>
            <span className="hidden font-extrabold tracking-tight text-white sm:inline">
              BolivarPide Socios
            </span>
          </div>
        </header>

        <BusinessOnboardingWizard
          isAuthenticated={Boolean(user)}
          existingBusinessId={existingBusinessId}
        />

        {/* Curved cut into landing */}
        <div
          className="relative -mb-px h-10 w-full bg-[#f3efe8] dark:bg-[#141210]"
          style={{ borderTopLeftRadius: "2rem", borderTopRightRadius: "2rem", marginTop: "2rem" }}
        />
      </div>

      {/* Landing — neutral background */}
      <div className="bg-[#f3efe8] dark:bg-[#141210]">
        <RegistroLanding />
      </div>
    </div>
  );
}
