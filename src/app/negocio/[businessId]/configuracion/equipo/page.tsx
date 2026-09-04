import { requireBusinessAccess } from "@/lib/business/queries";
import { TabEquipo } from "@/components/business/settings/TabEquipo";
import { createServiceClient } from "@/lib/supabase/service";
import type { UserAvatar } from "@/lib/userProfile";

export default async function ConfiguracionEquipoPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { supabase, user, member, business } = await requireBusinessAccess(businessId);

  const { data: rawMembers } = await supabase
    .from("business_members")
    .select("id, role, status, user_id, invited_at")
    .eq("business_id", businessId)
    .order("created_at");

  const membersList = rawMembers ?? [];
  const userIds = membersList.map((m) => m.user_id);

  // Profiles de otros miembros: RLS solo deja leer el propio → service.
  type ProfileRow = {
    user_id: string;
    display_name: string | null;
    identity_verified: boolean | null;
    avatar_type: string | null;
    avatar_value: string | null;
    avatar_gradient_id: string | null;
  };
  let profiles: ProfileRow[] = [];
  const userEmailMap: Record<string, string> = {};

  try {
    const service = createServiceClient();
    if (userIds.length > 0) {
      const { data } = await service
        .from("user_profiles")
        .select(
          "user_id, display_name, identity_verified, avatar_type, avatar_value, avatar_gradient_id",
        )
        .in("user_id", userIds);
      profiles = (data as ProfileRow[] | null) ?? [];
    }
    const { data: authData } = await service.auth.admin.listUsers({ perPage: 1000 });
    for (const u of authData?.users ?? []) {
      if (u.email) userEmailMap[u.id] = u.email;
    }
  } catch {
    // sin service: al menos el perfil propio vía supabase del usuario
    if (userIds.length > 0) {
      const { data } = await supabase
        .from("user_profiles")
        .select(
          "user_id, display_name, identity_verified, avatar_type, avatar_value, avatar_gradient_id",
        )
        .in("user_id", userIds);
      profiles = (data as ProfileRow[] | null) ?? [];
    }
  }

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  const members = membersList.map((m) => {
    const p = profileMap.get(m.user_id);
    const email = userEmailMap[m.user_id];
    const displayName = p?.display_name || undefined;
    const fallbackInitials = (displayName || email?.split("@")[0] || "?").slice(0, 2).toUpperCase();
    const avatar: UserAvatar = {
      type: (p?.avatar_type as UserAvatar["type"]) || "initials",
      value: p?.avatar_value || fallbackInitials,
      gradientId: p?.avatar_gradient_id || "cherry",
    };
    return {
      id: m.id,
      role: m.role,
      status: m.status,
      user_id: m.user_id,
      invited_at: m.invited_at,
      displayName,
      email,
      isVerified: Boolean(p?.identity_verified),
      avatar,
    };
  });

  return (
    <TabEquipo
      businessId={businessId}
      businessName={business.name}
      currentUserId={user.id}
      currentUserRole={member?.role || "staff"}
      initialMembers={members}
    />
  );
}
