/**
 * Calcula el % de avance hacia la beta pública por cara + global.
 *
 * Modelo: cada capacidad tiene un PESO (criticidad para lanzar) y un SCORE
 * (cuánto está hecho hoy). El % de una cara es la suma ponderada sobre el
 * máximo posible. Esto hace el número reproducible y auditable: si cambia el
 * estado de una capacidad, se cambia acá y el número se recalcula.
 *
 * PESO:  3 = bloqueante de lanzamiento · 2 = importante · 1 = deseable
 * SCORE: 1.00 FUNCIONAL · 0.60 PARCIAL · 0.30 HARDCODE · 0.15 STUB · 0 AUSENTE
 *        (se permiten valores intermedios cuando la evidencia lo justifica)
 *
 * Las HORAS no viven acá: se leen de la tabla de backlog de
 * docs/estado-beta-publica.md, que es la misma que está cargada en Jira. Antes
 * había dos juegos de horas (este script y la tabla) y derivaron 18h; una sola
 * fuente hace que no pueda volver a pasar.
 *
 * Uso: node scripts/beta-score.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const F = 1.0;
const P = 0.6;
const H = 0.3;
const S = 0.15;
const A = 0.0;

/** [capacidad, peso, score, tag de alcance] */
const CARAS = {
  Cliente: [
    ["Home feed de comercios publicados", 3, F, "core"],
    ["Promo banners (hoy con slugs ficticios)", 3, P, "core"],
    ["Filtros de categoría del header (no filtran)", 2, S, "core"],
    ["Búsqueda de comercios y productos", 2, F, "core"],
    ["Carta pública /c/[slug]", 3, F, "core"],
    ["Feed reels del menú", 1, F, "core"],
    ["Carrito (no persiste entre refrescos)", 3, P, "core"],
    ["Checkout con pago rápido (MP Checkout Pro)", 3, 0.7, "core"],
    ["Pantalla de resultado de pago", 2, F, "core"],
    ["Tracking de pedido y mapa", 3, P, "core"],
    ["Direcciones de entrega con geofence Bolívar", 3, F, "core"],
    ["Favoritos / likes", 1, F, "core"],
    ["Perfil de usuario", 2, F, "core"],
    ["Notificaciones in-app", 2, F, "core"],
    ["Push notifications PWA", 2, P, "core"],
    ["Login / registro (email + Google)", 3, F, "core"],
    ["Recuperar y confirmar contraseña", 2, F, "core"],
    ["Instalación PWA", 2, F, "core"],
    ["Costo de envío y pedido mínimo reales (hoy $0 fijo)", 3, H, "core"],
    ["Abierto/cerrado por horarios cargados (hoy flag manual)", 3, H, "core"],
    ["Páginas legales: términos, privacidad, contacto", 3, A, "core"],
    ["Empty states y error boundaries", 2, P, "core"],
    ["Reseñas y ratings de comercio", 1, H, "extra"],
    ['Botón "Seguir comercio" (stub sin persistencia)', 1, S, "extra"],
    ["Insignias de cliente (diferido por decisión)", 1, P, "diferido"],
  ],

  Comercio: [
    // typecheck ya pasa (arreglado sin commitear); lint sigue con 11 errores.
    ["Build verde: typecheck + lint sin errores", 3, 0.5, "core"],
    ["Hub de membresías", 3, 0.9, "core"],
    ["Login negocio", 3, F, "core"],
    ["Alta self-serve de comercio (wizard)", 3, F, "core"],
    ["Onboarding por claim token (lead aprobado)", 2, F, "core"],
    ["Dashboard: métricas de ventas", 3, F, "core"],
    ["Dashboard: gráfico de ventas", 2, F, "core"],
    ["Dashboard: pedidos recientes", 2, F, "core"],
    ["Dashboard: stock rápido", 1, F, "core"],
    ["Publicar comercio", 3, F, "core"],
    // El error de tsc se silencio haciendo la prop opcional: la seccion existe
    // pero renderiza siempre el empty state. La feature esta desactivada, no hecha.
    ["Dashboard: métricas por repartidor (desactivada, sin data layer)", 2, H, "core"],
    ["Tutorial de onboarding (tareas promos/QR falsas)", 1, P, "core"],
    ["Comandera realtime", 3, F, "core"],
    ["Alertas sonoras de pedido nuevo", 3, F, "core"],
    ["Editor de carta (CRUD productos)", 3, F, "core"],
    ["Categorías de menú", 2, F, "core"],
    ["Imágenes de producto, logo y banner", 2, F, "core"],
    ["Límites del plan Free (25 prod / 5 cat)", 2, F, "core"],
    ["Horarios semanales", 3, F, "core"],
    ["Configuración general", 3, F, "core"],
    ["Configuración de operación (abierto/cerrado, prep time)", 3, F, "core"],
    ["Conexión OAuth MercadoPago", 3, F, "core"],
    // Decision 2026-09-05: canal unico pago rapido, sin toggle de absorber.
    // La comision la come el comercio y el cliente ve el precio de lista.
    ["Canal de cobro migrado a pago rápido (deprecar QR)", 3, 0.5, "core"],
    ["Panel de salud MercadoPago (textos QR-céntricos)", 1, P, "core"],
    ["WhatsApp: OAuth Meta self-service", 2, 0.7, "core"],
    ["WhatsApp: bot n8n de pedidos (sin superficie en panel)", 1, 0.5, "core"],
    ["Chat de WhatsApp en el panel", 2, F, "core"],
    ["Equipo: invitaciones", 3, F, "core"],
    ["Equipo: roles owner/staff/driver", 3, F, "core"],
    ["Protección del último owner", 2, F, "core"],
    ["Panel de reparto accesible desde navegación", 3, 0.9, "core"],
    ["RBAC de rutas del panel por rol", 3, 0.2, "core"],
    ["Responsive / uso en teléfono", 2, 0.7, "core"],
    ["Zona de peligro: baja de comercio", 1, F, "core"],
    ["Búsqueda interna del panel", 1, F, "core"],
    ["Instalación PWA negocio", 1, F, "core"],
    ["Notificaciones en el panel", 2, F, "core"],
    ["Planes pagos y cobro de comisión (billing)", 2, S, "extra"],
    ["Rangos y logros del comercio (gamificación)", 1, A, "extra"],
    ["CRUD de promociones", 1, A, "extra"],
    ["Generador de menú QR imprimible", 1, A, "extra"],
  ],

  Delivery: [
    ["Postulación de repartidor con KYC", 3, F, "core"],
    ["Revisión admin de postulaciones (actions sin UI)", 3, H, "core"],
    ["Contratar repartidor aprobado", 3, F, "core"],
    ["Hub de invitaciones del driver", 3, F, "core"],
    ["Cola de despacho", 3, F, "core"],
    ["Asignar / reasignar / quitar pedido", 3, F, "core"],
    ["Claim race-safe del pedido", 3, F, "core"],
    ["Consola del repartidor", 3, 0.8, "core"],
    ["Confirmación por PIN de entrega", 3, 0.9, "core"],
    ["GPS en vivo (con fallback simulado)", 3, P, "core"],
    ["Push al driver al asignarle un pedido", 2, P, "core"],
    ["Métricas por repartidor", 2, 0.4, "core"],
    ["Navegación / mapa (deep link a Google Maps)", 2, P, "core"],
    ["Realtime de la cola", 2, F, "core"],
    ["Experiencia mobile-first dedicada del driver", 3, H, "core"],
    ["QA end-to-end en dos dispositivos", 3, A, "core"],
  ],

  Admin: [
    ["Gate de acceso admin", 3, 0.9, "core"],
    ["Roles de plataforma (JWT + platform_users)", 3, F, "core"],
    ["KPIs de red", 3, 0.85, "core"],
    ["Top 5 comercios", 1, F, "core"],
    ["Listado de comercios con búsqueda", 3, 0.8, "core"],
    ["Publicar / despublicar comercio", 3, F, "core"],
    ["Cambiar plan del comercio", 2, P, "core"],
    ["Aprobar / rechazar leads", 3, F, "core"],
    ["Generar claim token", 2, F, "core"],
    ["Modo Escudo (impersonación con auditoría)", 3, 0.9, "core"],
    ["Auditoría", 2, F, "core"],
    ["Equipo de plataforma y RBAC", 2, F, "core"],
    ["Hub de soporte WhatsApp", 1, F, "core"],
    ["UI de revisión de KYC de repartidores", 3, A, "core"],
    ["Layout admin con navegación por rol", 2, F, "core"],
    ["Pantalla de gestión de planes", 1, 0.4, "extra"],
    ["Botón de acceso admin en el sidebar de negocio", 1, A, "core"],
  ],

  "Infra y lanzamiento": [
    ["Deploy productivo (VPS propio / Render)", 3, A, "core"],
    ["Dominio, DNS y TLS", 3, A, "core"],
    ["Variables de entorno de producción + .env.example al día", 3, H, "core"],
    ["Migraciones Supabase sincronizadas con la DB viva", 3, 0.8, "core"],
    ["Backups de base de datos verificados", 2, A, "core"],
    ["Cron de respaldo para timeouts y expiración de sesiones", 2, A, "core"],
    ["Monitoreo de errores y logs", 2, A, "core"],
    ["CI en verde sobre main", 3, A, "core"],
    ["Review de la app de Meta para WhatsApp (dependencia externa)", 2, 0.2, "core"],
    ["Comercios piloto reclutados y con carta cargada", 3, A, "core"],
    ["QA end-to-end general y pasada de fixes", 3, A, "core"],
  ],
};

const RECOMENDADO_FUERA = new Set(["extra", "diferido"]);

/**
 * Backlog de docs/estado-beta-publica.md = las 50 tarjetas cargadas en Jira.
 * Única fuente de horas. Columnas: ID | Épica | Tarea | Cara | Prio | Est.
 */
const BACKLOG = readFileSync(
  new URL("../docs/estado-beta-publica.md", import.meta.url),
  "utf8",
)
  .split("\n")
  .map((l) => l.match(/^\|\s*(BP-\d+b?)\s*\|([^|]*)\|[^|]*\|([^|]*)\|([^|]*)\|\s*(\d+)h\s*\|/))
  .filter(Boolean)
  .map(([, id, epica, cara, prio, horas]) => ({
    id,
    epica: epica.trim(),
    cara: cara.trim(),
    prio: prio.trim(),
    horas: Number(horas),
  }));

/** Las 6 tarjetas que el alcance recomendado dejaría afuera (post-beta). */
const EXTRA = new Set(["BP-43", "BP-44", "BP-45", "BP-46", "BP-47", "BP-49"]);

/** La tabla usa 6 caras; el modelo de scoring 5. Transversal e Infra colapsan. */
const CARA_DE = {
  Cliente: "Cliente",
  Comercio: "Comercio",
  Delivery: "Delivery",
  Admin: "Admin",
  Infra: "Infra y lanzamiento",
  Transversal: "Infra y lanzamiento",
};

/** Horas del backlog por cara del modelo, para el alcance pedido. */
function horasPorCara(filtro) {
  const acc = {};
  for (const t of BACKLOG) {
    if (!filtro(t)) continue;
    const cara = CARA_DE[t.cara];
    acc[cara] = (acc[cara] ?? 0) + t.horas;
  }
  return acc;
}

function score(items, filtro) {
  let got = 0;
  let max = 0;
  for (const [, peso, sc, tag] of items) {
    if (!filtro(tag, peso)) continue;
    got += peso * sc;
    max += peso;
  }
  return { pct: max ? (got / max) * 100 : 0, max };
}

const todo = (tag) => tag !== "diferido";
const recomendado = (tag) => !RECOMENDADO_FUERA.has(tag);
/** Mínimo viable: solo lo que bloquea abrir la puerta al público. */
const minimo = (tag, peso) => !RECOMENDADO_FUERA.has(tag) && peso === 3;

/** Los mismos tres alcances, expresados sobre las tarjetas del backlog. */
const TODO_T = () => true;
const RECOMENDADO_T = (t) => !EXTRA.has(t.id);
const MINIMO_T = (t) => !EXTRA.has(t.id) && t.prio === "P0";

function tabla(titulo, filtro, filtroT) {
  console.log(`\n### ${titulo}\n`);
  console.log("| Cara | % avance | Horas restantes | Peso total |");
  console.log("|---|---:|---:|---:|");
  const horas = horasPorCara(filtroT);
  let g = 0;
  let m = 0;
  let h = 0;
  for (const [cara, items] of Object.entries(CARAS)) {
    const r = score(items, filtro);
    const hc = horas[cara] ?? 0;
    console.log(`| ${cara} | ${r.pct.toFixed(1)}% | ${hc}h | ${r.max} |`);
    g += (r.pct / 100) * r.max;
    m += r.max;
    h += hc;
  }
  console.log(`| **GLOBAL** | **${((g / m) * 100).toFixed(1)}%** | **${h}h** | **${m}** |`);
  return { pct: (g / m) * 100, horas: h };
}

const A_TODO = tabla("Alcance declarado (todo adentro)", todo, TODO_T);
const A_REC = tabla(
  "Alcance recomendado (sin planes pagos, rangos, promos, menú QR, reseñas, seguir)",
  recomendado,
  RECOMENDADO_T,
);
const A_MIN = tabla("Beta mínima viable (solo bloqueantes P0)", minimo, MINIMO_T);

// Capacidad: 2 personas x 6h efectivas/dia, fines de semana incluidos.
const POR_DIA = 2 * 6;
const AL_17 = POR_DIA * 12; // ventana original descartada
const AL_29 = POR_DIA * 24; // escenario C, decidido el 2026-09-05

console.log(`\n### Contraste con la capacidad real\n`);
console.log(`Capacidad: 2 personas x 6h efectivas = ${POR_DIA} horas-persona por dia\n`);
console.log("| Escenario | Horas necesarias | Ventana | Capacidad | Uso |");
console.log("|---|---:|---|---:|---:|");
const ESCENARIOS = [
  ["Declarado al 17/09 (descartado)", A_TODO, AL_17, "12 dias"],
  ["Recortado al 17/09 (descartado)", A_REC, AL_17, "12 dias"],
  ["Minimo viable al 17/09 (descartado)", A_MIN, AL_17, "12 dias"],
  ["** Declarado al 29/09 (elegido) **", A_TODO, AL_29, "24 dias"],
];
for (const [nombre, r, cap, ventana] of ESCENARIOS) {
  const pct = ((r.horas / cap) * 100).toFixed(0);
  console.log(`| ${nombre} | ${r.horas}h | ${ventana} | ${cap}h | ${pct}% |`);
}

const holgura = AL_29 - A_TODO.horas;
console.log(`\nHolgura del plan elegido: ${holgura}h sobre ${AL_29}h (${((holgura / AL_29) * 100).toFixed(0)}%).`);
assert.ok(holgura > 0, "el alcance elegido no entra en la ventana");

// Check: el modelo no debe poder dar un numero fuera de rango ni perder items.
const total = Object.values(CARAS).flat().length;
const contados = Object.values(CARAS).reduce(
  (n, items) => n + items.filter(([, , , t]) => todo(t)).length,
  0,
);
assert.ok(A_TODO.pct > 0 && A_TODO.pct < 100, "pct global fuera de rango");
assert.ok(A_REC.pct > A_TODO.pct, "recortar alcance deberia subir el %");
assert.ok(contados === total - 1, "se esperaba 1 item diferido");

// El backlog es la unica fuente de horas: si la tabla del doc se edita y deja
// de coincidir con lo cargado en Jira, esto falla en vez de derivar en silencio.
const TARJETAS_ESPERADAS = 51;
assert.ok(
  BACKLOG.length === TARJETAS_ESPERADAS,
  `se parsearon ${BACKLOG.length} tarjetas del backlog, se esperaban ${TARJETAS_ESPERADAS}`,
);
assert.ok(
  BACKLOG.every((t) => t.cara in CARA_DE),
  "hay una cara en el backlog que no mapea a ninguna cara del modelo",
);
assert.ok(
  A_MIN.horas < A_REC.horas && A_REC.horas < A_TODO.horas,
  "los alcances deberian ordenarse minimo < recomendado < declarado",
);
console.log(
  `\nok: ${total} capacidades evaluadas, ${contados} en alcance declarado` +
    `; ${BACKLOG.length} tarjetas de backlog por ${A_TODO.horas}h`,
);
