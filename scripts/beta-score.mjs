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
 * Uso: node scripts/beta-score.mjs
 */

const F = 1.0;
const P = 0.6;
const H = 0.3;
const S = 0.15;
const A = 0.0;

/** [capacidad, peso, score, horas restantes estimadas, tag de alcance] */
const CARAS = {
  Cliente: [
    ["Home feed de comercios publicados", 3, F, 0, "core"],
    ["Promo banners (hoy con slugs ficticios)", 3, P, 2, "core"],
    ["Filtros de categoría del header (no filtran)", 2, S, 5, "core"],
    ["Búsqueda de comercios y productos", 2, F, 0, "core"],
    ["Carta pública /c/[slug]", 3, F, 0, "core"],
    ["Feed reels del menú", 1, F, 0, "core"],
    ["Carrito (no persiste entre refrescos)", 3, P, 3, "core"],
    ["Checkout con pago rápido (MP Checkout Pro)", 3, 0.7, 6, "core"],
    ["Pantalla de resultado de pago", 2, F, 0, "core"],
    ["Tracking de pedido y mapa", 3, P, 3, "core"],
    ["Direcciones de entrega con geofence Bolívar", 3, F, 0, "core"],
    ["Favoritos / likes", 1, F, 0, "core"],
    ["Perfil de usuario", 2, F, 0, "core"],
    ["Notificaciones in-app", 2, F, 0, "core"],
    ["Push notifications PWA", 2, P, 3, "core"],
    ["Login / registro (email + Google)", 3, F, 0, "core"],
    ["Recuperar y confirmar contraseña", 2, F, 0, "core"],
    ["Instalación PWA", 2, F, 0, "core"],
    ["Costo de envío y pedido mínimo reales (hoy $0 fijo)", 3, H, 10, "core"],
    ["Abierto/cerrado por horarios cargados (hoy flag manual)", 3, H, 4, "core"],
    ["Páginas legales: términos, privacidad, contacto", 3, A, 6, "core"],
    ["Empty states y error boundaries", 2, P, 3, "core"],
    ["Reseñas y ratings de comercio", 1, H, 10, "extra"],
    ['Botón "Seguir comercio" (stub sin persistencia)', 1, S, 4, "extra"],
    ["Insignias de cliente (diferido por decisión)", 1, P, 0, "diferido"],
  ],

  Comercio: [
    // typecheck ya pasa (arreglado sin commitear); lint sigue con 11 errores.
    ["Build verde: typecheck + lint sin errores", 3, 0.5, 4, "core"],
    ["Hub de membresías", 3, 0.9, 1, "core"],
    ["Login negocio", 3, F, 0, "core"],
    ["Alta self-serve de comercio (wizard)", 3, F, 0, "core"],
    ["Onboarding por claim token (lead aprobado)", 2, F, 0, "core"],
    ["Dashboard: métricas de ventas", 3, F, 0, "core"],
    ["Dashboard: gráfico de ventas", 2, F, 0, "core"],
    ["Dashboard: pedidos recientes", 2, F, 0, "core"],
    ["Dashboard: stock rápido", 1, F, 0, "core"],
    ["Publicar comercio", 3, F, 0, "core"],
    // El error de tsc se silencio haciendo la prop opcional: la seccion existe
    // pero renderiza siempre el empty state. La feature esta desactivada, no hecha.
    ["Dashboard: métricas por repartidor (desactivada, sin data layer)", 2, H, 4, "core"],
    ["Tutorial de onboarding (tareas promos/QR falsas)", 1, P, 3, "core"],
    ["Comandera realtime", 3, F, 0, "core"],
    ["Alertas sonoras de pedido nuevo", 3, F, 0, "core"],
    ["Editor de carta (CRUD productos)", 3, F, 0, "core"],
    ["Categorías de menú", 2, F, 0, "core"],
    ["Imágenes de producto, logo y banner", 2, F, 0, "core"],
    ["Límites del plan Free (25 prod / 5 cat)", 2, F, 0, "core"],
    ["Horarios semanales", 3, F, 0, "core"],
    ["Configuración general", 3, F, 0, "core"],
    ["Configuración de operación (abierto/cerrado, prep time)", 3, F, 0, "core"],
    ["Conexión OAuth MercadoPago", 3, F, 0, "core"],
    // Decision 2026-09-05: canal unico pago rapido, sin toggle de absorber.
    // La comision la come el comercio y el cliente ve el precio de lista.
    ["Canal de cobro migrado a pago rápido (deprecar QR)", 3, 0.5, 9, "core"],
    ["Panel de salud MercadoPago (textos QR-céntricos)", 1, P, 2, "core"],
    ["WhatsApp: OAuth Meta self-service", 2, 0.7, 4, "core"],
    ["WhatsApp: bot n8n de pedidos (sin superficie en panel)", 1, 0.5, 4, "core"],
    ["Chat de WhatsApp en el panel", 2, F, 0, "core"],
    ["Equipo: invitaciones", 3, F, 0, "core"],
    ["Equipo: roles owner/staff/driver", 3, F, 0, "core"],
    ["Protección del último owner", 2, F, 0, "core"],
    ["Panel de reparto accesible desde navegación", 3, 0.9, 1, "core"],
    ["RBAC de rutas del panel por rol", 3, 0.2, 6, "core"],
    ["Responsive / uso en teléfono", 2, 0.7, 4, "core"],
    ["Zona de peligro: baja de comercio", 1, F, 0, "core"],
    ["Búsqueda interna del panel", 1, F, 0, "core"],
    ["Instalación PWA negocio", 1, F, 0, "core"],
    ["Notificaciones en el panel", 2, F, 0, "core"],
    ["Planes pagos y cobro de comisión (billing)", 2, S, 30, "extra"],
    ["Rangos y logros del comercio (gamificación)", 1, A, 25, "extra"],
    ["CRUD de promociones", 1, A, 12, "extra"],
    ["Generador de menú QR imprimible", 1, A, 6, "extra"],
  ],

  Delivery: [
    ["Postulación de repartidor con KYC", 3, F, 0, "core"],
    ["Revisión admin de postulaciones (actions sin UI)", 3, H, 8, "core"],
    ["Contratar repartidor aprobado", 3, F, 0, "core"],
    ["Hub de invitaciones del driver", 3, F, 0, "core"],
    ["Cola de despacho", 3, F, 0, "core"],
    ["Asignar / reasignar / quitar pedido", 3, F, 0, "core"],
    ["Claim race-safe del pedido", 3, F, 0, "core"],
    ["Consola del repartidor", 3, 0.8, 3, "core"],
    ["Confirmación por PIN de entrega", 3, 0.9, 2, "core"],
    ["GPS en vivo (con fallback simulado)", 3, P, 4, "core"],
    ["Push al driver al asignarle un pedido", 2, P, 4, "core"],
    ["Métricas por repartidor", 2, 0.4, 0, "core"],
    ["Navegación / mapa (deep link a Google Maps)", 2, P, 3, "core"],
    ["Realtime de la cola", 2, F, 0, "core"],
    ["Experiencia mobile-first dedicada del driver", 3, H, 10, "core"],
    ["QA end-to-end en dos dispositivos", 3, A, 4, "core"],
  ],

  Admin: [
    ["Gate de acceso admin", 3, 0.9, 1, "core"],
    ["Roles de plataforma (JWT + platform_users)", 3, F, 0, "core"],
    ["KPIs de red", 3, 0.85, 2, "core"],
    ["Top 5 comercios", 1, F, 0, "core"],
    ["Listado de comercios con búsqueda", 3, 0.8, 4, "core"],
    ["Publicar / despublicar comercio", 3, F, 0, "core"],
    ["Cambiar plan del comercio", 2, P, 2, "core"],
    ["Aprobar / rechazar leads", 3, F, 0, "core"],
    ["Generar claim token", 2, F, 0, "core"],
    ["Modo Escudo (impersonación con auditoría)", 3, 0.9, 2, "core"],
    ["Auditoría", 2, F, 0, "core"],
    ["Equipo de plataforma y RBAC", 2, F, 0, "core"],
    ["Hub de soporte WhatsApp", 1, F, 0, "core"],
    ["UI de revisión de KYC de repartidores", 3, A, 0, "core"],
    ["Layout admin con navegación por rol", 2, F, 0, "core"],
    ["Pantalla de gestión de planes", 1, 0.4, 3, "extra"],
    ["Botón de acceso admin en el sidebar de negocio", 1, A, 2, "core"],
  ],

  "Infra y lanzamiento": [
    ["Deploy productivo (VPS propio / Render)", 3, A, 10, "core"],
    ["Dominio, DNS y TLS", 3, A, 3, "core"],
    ["Variables de entorno de producción + .env.example al día", 3, H, 2, "core"],
    ["Migraciones Supabase sincronizadas con la DB viva", 3, 0.8, 4, "core"],
    ["Backups de base de datos verificados", 2, A, 3, "core"],
    ["Cron de respaldo para timeouts y expiración de sesiones", 2, A, 4, "core"],
    ["Monitoreo de errores y logs", 2, A, 4, "core"],
    ["CI en verde sobre main", 3, A, 0, "core"],
    ["Review de la app de Meta para WhatsApp (dependencia externa)", 2, 0.2, 4, "core"],
    ["Comercios piloto reclutados y con carta cargada", 3, A, 12, "core"],
    ["QA end-to-end general y pasada de fixes", 3, A, 12, "core"],
  ],
};

const RECOMENDADO_FUERA = new Set(["extra", "diferido"]);

function score(items, filtro) {
  let got = 0;
  let max = 0;
  let horas = 0;
  for (const [, peso, sc, hrs, tag] of items) {
    if (!filtro(tag, peso)) continue;
    got += peso * sc;
    max += peso;
    horas += hrs;
  }
  return { pct: max ? (got / max) * 100 : 0, horas, max };
}

const todo = (tag) => tag !== "diferido";
const recomendado = (tag) => !RECOMENDADO_FUERA.has(tag);
/** Mínimo viable: solo lo que bloquea abrir la puerta al público. */
const minimo = (tag, peso) => !RECOMENDADO_FUERA.has(tag) && peso === 3;

function tabla(titulo, filtro) {
  console.log(`\n### ${titulo}\n`);
  console.log("| Cara | % avance | Horas restantes | Peso total |");
  console.log("|---|---:|---:|---:|");
  let g = 0;
  let m = 0;
  let h = 0;
  for (const [cara, items] of Object.entries(CARAS)) {
    const r = score(items, filtro);
    console.log(
      `| ${cara} | ${r.pct.toFixed(1)}% | ${r.horas}h | ${r.max} |`,
    );
    g += (r.pct / 100) * r.max;
    m += r.max;
    h += r.horas;
  }
  console.log(`| **GLOBAL** | **${((g / m) * 100).toFixed(1)}%** | **${h}h** | **${m}** |`);
  return { pct: (g / m) * 100, horas: h };
}

const A_TODO = tabla("Alcance declarado (todo adentro)", todo);
const A_REC = tabla("Alcance recomendado (sin planes pagos, rangos, promos, menú QR, reseñas, seguir)", recomendado);
const A_MIN = tabla("Beta mínima viable (solo bloqueantes de peso 3)", minimo);

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
console.assert(holgura > 0, "el alcance elegido no entra en la ventana");

// Check: el modelo no debe poder dar un numero fuera de rango ni perder items.
const total = Object.values(CARAS).flat().length;
const contados = Object.values(CARAS).reduce(
  (n, items) => n + items.filter(([, , , , t]) => todo(t)).length,
  0,
);
console.assert(A_TODO.pct > 0 && A_TODO.pct < 100, "pct global fuera de rango");
console.assert(A_REC.pct > A_TODO.pct, "recortar alcance deberia subir el %");
console.assert(contados === total - 1, "se esperaba 1 item diferido");
console.log(`\nok: ${total} capacidades evaluadas, ${contados} en alcance declarado`);
