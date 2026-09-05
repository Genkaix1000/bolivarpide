"use server";

import { requireBusinessAccess } from "@/lib/business/queries";
import { listProductsSafe } from "@/lib/business/menuQueries";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { createServiceClient } from "@/lib/supabase/service";
import { STATUS_LABEL } from "@/components/orders/comandaTicketShared";
import type { OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import type { UserAvatar } from "@/lib/userProfile";

export type PanelSearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Product thumbnail (carta). */
  image?: string;
  /** Team member avatar. */
  avatar?: UserAvatar;
  /** Formatted amount in ARS (pedidos). */
  amount?: string;
  /** Status badge text (pedidos). */
  statusLabel?: string;
  /** Status code (e.g. pending, preparing, delivering). */
  statusVariant?: string;
};

export type PanelSearchResult = {
  orders: PanelSearchHit[];
  menu: PanelSearchHit[];
  team: PanelSearchHit[];
  pages: PanelSearchHit[];
};

const PAGES: { title: string; subtitle: string; path: string; keywords: string }[] = [
  { title: "Dashboard", subtitle: "Resumen del local", path: "dashboard", keywords: "inicio home resumen metricas ventas" },
  { title: "Pedidos", subtitle: "Comandas y estados en vivo", path: "pedidos", keywords: "comanda orden order cocina despacho" },
  { title: "WhatsApp", subtitle: "Chats con clientes", path: "whatsapp", keywords: "chat mensajes mensajes soporte" },
  { title: "Carta", subtitle: "Productos y categorías", path: "carta", keywords: "menu menú productos platos precios stock" },
  { title: "Configuración", subtitle: "Datos del negocio y horarios", path: "configuracion", keywords: "ajustes settings horarios operacion" },
  { title: "Equipo", subtitle: "Miembros y roles", path: "configuracion/equipo", keywords: "staff miembros invitaciones colaboradores" },
  { title: "Canales", subtitle: "WhatsApp y conexiones", path: "configuracion/canales", keywords: "meta api qr" },
];

function matchText(q: string, ...parts: (string | null | undefined)[]) {
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q);
}

function matchOrder(
  q: string,
  order: {
    order_number: number;
    customer_name: string | null;
    customer_phone: string | null;
    delivery_address: string | null;
    total_cents: number;
    status: string;
    order_items?: { name: string; quantity: number }[] | null;
  },
) {
  const query = q.trim().toLowerCase();
  if (!query) return false;

  // 1. Número de pedido directo (#12 o 12)
  const cleanOrderNum = query.replace(/^#/, "").trim();
  if (cleanOrderNum && /^\d+$/.test(cleanOrderNum)) {
    if (String(order.order_number) === cleanOrderNum) return true;
  }

  // 2. Monto / precio (ej: "$17", "$17.500", "17500", "17.500", "17")
  const pesos = Math.max(0, Math.round((order.total_cents || 0) / 100));
  const pesosStr = String(pesos);
  const formattedPesos = `$${pesos.toLocaleString("es-AR")}`.toLowerCase();

  // Si la consulta contiene explícitamente el símbolo $
  if (query.includes("$") && formattedPesos.includes(query)) return true;

  // Si son números solos o con puntos/comas (ej: "17", "17.500", "17500")
  const numericOnly = query.replace(/[\$\.,\s]/g, "");
  if (numericOnly.length > 0 && /^\d+$/.test(numericOnly)) {
    // Si puso $ buscamos con 1 dígito o más; si no puso $, exigimos al menos 2 dígitos
    // para evitar que escribir "1" traiga todos los pedidos que empiezan con 1
    if (query.includes("$") || numericOnly.length >= 2) {
      if (pesosStr.startsWith(numericOnly) || pesosStr === numericOnly) {
        return true;
      }
    }
  }

  // 3. Estado del pedido (ej: "pendiente", "cocina", "reparto")
  const statusLabel =
    STATUS_LABEL[order.status as OrderLifecycleStatus]?.toLowerCase() || order.status.toLowerCase();
  if (statusLabel.includes(query)) return true;

  // 4. Ítems del pedido (ej: "hamburguesa", "muzzarella")
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  if (items.some((it) => it.name.toLowerCase().includes(query))) return true;

  // 5. Nombre del cliente, teléfono o dirección
  if (order.customer_name?.toLowerCase().includes(query)) return true;
  if (order.customer_phone?.toLowerCase().includes(query)) return true;
  if (order.delivery_address?.toLowerCase().includes(query)) return true;

  return false;
}

export async function searchBusinessPanelAction(
  businessId: string,
  query: string,
): Promise<PanelSearchResult> {
  const q = query.trim().toLowerCase();
  const empty: PanelSearchResult = { orders: [], menu: [], team: [], pages: [] };
  if (!businessId || q.length < 1) return empty;

  const base = `/negocio/${businessId}`;
  const pages = PAGES.filter((p) => matchText(q, p.title, p.subtitle, p.keywords)).map((p) => ({
    id: `page-${p.path}`,
    title: p.title,
    subtitle: p.subtitle,
    href: `${base}/${p.path}`,
  }));

  const { supabase } = await requireBusinessAccess(businessId);
  const service = createServiceClient();

  const [{ data: members }, products, { data: orderRows }] = await Promise.all([
    supabase
      .from("business_members")
      .select("user_id, role, status")
      .eq("business_id", businessId)
      .eq("status", "active")
      .limit(40),
    listProductsSafe(businessId).catch(() => []),
    service
      .from("orders")
      .select(
        "id, order_number, status, customer_name, customer_phone, delivery_address, fulfillment_type, payment_status, payment_method, total_cents, created_at, order_items(name, quantity)",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  // 1. Pedidos (con formato de monto y estado)
  const orders: PanelSearchHit[] = (orderRows ?? [])
    .filter((o) => matchOrder(q, o))
    .slice(0, 10)
    .map((o) => {
      const pesos = Math.max(0, Math.round((o.total_cents || 0) / 100));
      const amount = `$${pesos.toLocaleString("es-AR")}`;
      const statusLabel = STATUS_LABEL[o.status as OrderLifecycleStatus] || o.status;

      const items = Array.isArray(o.order_items) ? o.order_items : [];
      const itemsSummary = items
        .slice(0, 3)
        .map((it: { name: string; quantity: number }) =>
          it.quantity > 1 ? `${it.quantity}x ${it.name}` : it.name,
        )
        .join(", ");
      const extraItems = items.length > 3 ? ` +${items.length - 3} más` : "";
      const fullItems = itemsSummary ? `${itemsSummary}${extraItems}` : "";

      const destination =
        o.delivery_address?.trim() ||
        (o.fulfillment_type === "pickup" ? "Retiro en local" : "Delivery");

      const subtitle = [fullItems, destination].filter(Boolean).join(" · ");
      const customer = o.customer_name?.trim() || "Cliente";

      return {
        id: `order-${o.id}`,
        title: `#${o.order_number} · ${customer}`,
        subtitle: subtitle || undefined,
        href: `${base}/pedidos?orderId=${o.id}#ticket-${o.id}`,
        amount,
        statusLabel,
        statusVariant: o.status,
      };
    });

  // 2. Carta / Productos
  const menu: PanelSearchHit[] = (products ?? [])
    .filter((p) => matchText(q, p.name, p.description, p.category))
    .slice(0, 12)
    .map((p) => {
      const raw =
        ("icon_path" in p && p.icon_path ? p.icon_path : null) || p.image_path;
      return {
        id: `product-${p.id}`,
        title: p.name,
        subtitle: p.category || (p.available ? "Disponible" : "Pausado"),
        href: `${base}/carta`,
        image: resolveBusinessAssetUrl(raw) ?? undefined,
      };
    });

  // 3. Equipo
  const ids = (members ?? []).map((m) => m.user_id);
  let team: PanelSearchHit[] = [];
  if (ids.length > 0) {
    const { data: profiles } = await service
      .from("user_profiles")
      .select("user_id, display_name, avatar_type, avatar_value, avatar_gradient_id")
      .in("user_id", ids);

    const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    team = (members ?? [])
      .map((m) => {
        const profile = byId.get(m.user_id);
        const title = profile?.display_name?.trim() || "Miembro";
        const fallback = title.slice(0, 2).toUpperCase();
        const type =
          profile?.avatar_type === "symbol" ||
          profile?.avatar_type === "emoji" ||
          profile?.avatar_type === "initials"
            ? profile.avatar_type
            : "initials";
        const avatar: UserAvatar = {
          type,
          value: (profile?.avatar_value || fallback).slice(0, type === "emoji" ? 8 : 24),
          gradientId: profile?.avatar_gradient_id || "cherry",
        };
        return {
          id: `member-${m.user_id}`,
          title,
          subtitle: m.role,
          href: `${base}/configuracion/equipo`,
          avatar,
          _hay: `${title} ${m.role}`.toLowerCase(),
        };
      })
      .filter((m) => m._hay.includes(q))
      .slice(0, 12)
      .map(({ id, title, subtitle, href, avatar }) => ({
        id,
        title,
        subtitle,
        href,
        avatar,
      }));
  }

  return { orders, menu, team, pages };
}
