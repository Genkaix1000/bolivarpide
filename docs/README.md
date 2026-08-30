# 📚 Documentación — BolivarPide

Bienvenido a la documentación arquitectónica y funcional de **BolivarPide**.  
El proyecto se rige bajo las metodologías **SDD** (*Software / System Design Document* — *Qué* y *Para quién*) y **TDD** (*Technical Design Document & Test-Driven Development* — *Cómo*, *Esquemas* y *Tests*).

---

## 🏛️ Documentos Raíz

| Documento | Enfoque | Descripción |
|---|---|---|
| [ARQUITECTURA.md](file:///home/cipher/Projects/delivery/ARQUITECTURA.md) | Arquitectura Global | Modelo general, convenciones de stack, patrones SSR y despliegue. |
| [SDD.md](file:///home/cipher/Projects/delivery/docs/SDD.md) | Sistema & Roadmap | Visión macro, actores, matriz de PWAs y orden de expansión en fases. |
| [TDD.md](file:///home/cipher/Projects/delivery/docs/TDD.md) | Técnico & Seguridad | Convenciones técnicas, clientes Supabase, RLS global y plan de tests. |
| [estrategia-monetizacion-y-planes.md](file:///home/cipher/Projects/delivery/docs/estrategia-monetizacion-y-planes.md) | Negocio | Modelo comercial, planes Free / Premium y monetización local. |

---

## 📦 Paquetes Modulares por Fase (SDD + TDD Desacoplados)

Cada módulo se encuentra empaquetado en su propia carpeta con archivos atómicos y cortos para máxima legibilidad:

```text
docs/features/
├── 00-auth-e-identidad/              # Fase 0: OAuth, sesión SSR, guards y middleware
│   ├── README.md                     # Índice y checklist de fase
│   ├── sdd/                          # Historias de usuario y flujos UI
│   └── tdd/                          # Esquemas Zod, RLS, middleware y tests Vitest
├── 01-negocio-y-membresias/          # Fase 1: Multi-tenancy, Hub /negocio, roles owner/staff
│   ├── README.md
│   ├── sdd/
│   └── tdd/
├── 02-catalogo-y-carta/              # Fase 2: CRUD de productos, categorías, disponibilidad
│   ├── README.md
│   ├── sdd/
│   └── tdd/
├── 03-equipo-e-invitaciones/         # Fase 3: Invitaciones, roles staff/driver, bajas
│   ├── README.md
│   ├── sdd/
│   └── tdd/
├── 04-leads-admin-y-onboarding/      # Fase 4: Postulaciones, PWA Admin, claim token, impersonar
│   ├── README.md
│   ├── sdd/
│   └── tdd/
├── 05-pedidos-y-comandera/           # Fase 5: Comandera realtime, Web Audio API, estados
│   ├── README.md
│   ├── sdd/
│   └── tdd/
└── 06-marketplace-cliente/           # Fase 6: Feed público /, carta digital /c/[slug]
    ├── README.md
    ├── sdd/
    └── tdd/
```

---

## 🗺️ Mapa Detallado de Especificaciones

| Módulo / Fase | Módulo Hub | Especificación SDD (Qué) | Especificación TDD & Tests (Cómo) |
|---|---|---|---|
| **00: Auth & Identidad** | [README.md](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/README.md) | • [Historias de Usuario](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/sdd/01-historias-de-usuario.md)<br>• [Flujos y Estados](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/sdd/02-flujos-y-estados.md) | • [Arquitectura & Zod](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/tdd/01-arquitectura-y-contratos.md)<br>• [Base de Datos & RLS](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/tdd/02-base-de-datos-y-rls.md)<br>• [Plan de Pruebas](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/tdd/03-plan-de-pruebas.md) |
| **01: Negocios & Hub** | [README.md](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/README.md) | • [Historias de Usuario](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/sdd/01-historias-de-usuario.md)<br>• [Flujos y Scoping](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/sdd/02-flujos-y-estados.md) | • [Arquitectura & Actions](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/tdd/01-arquitectura-y-contratos.md)<br>• [Base de Datos & RLS](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/tdd/02-base-de-datos-y-rls.md)<br>• [Plan de Pruebas](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/tdd/03-plan-de-pruebas.md) |
| **02: Catálogo & Carta** | [README.md](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/README.md) | • [Historias de Usuario](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/sdd/01-historias-de-usuario.md)<br>• [Dominio & Reglas](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/sdd/02-flujos-y-estados.md) | • [Arquitectura & Moneda](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/tdd/01-arquitectura-y-contratos.md)<br>• [Storage & RLS](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/tdd/02-base-de-datos-y-storage.md)<br>• [Plan de Pruebas](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/tdd/03-plan-de-pruebas.md) |
| **03: Equipo & Staff** | [README.md](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/README.md) | • [Historias de Usuario](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/sdd/01-historias-de-usuario.md)<br>• [Ciclo de Vida](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/sdd/02-flujos-y-estados.md) | • [Arquitectura & Zod](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/tdd/01-arquitectura-y-contratos.md)<br>• [RLS de Invitaciones](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/tdd/02-base-de-datos-y-rls.md)<br>• [Plan de Pruebas](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/tdd/03-plan-de-pruebas.md) |
| **04: Alta Free, KYC & Admin** | [README.md](file:///home/cipher/Projects/delivery/docs/features/04-leads-admin-y-onboarding/README.md) | • [Historias de Usuario](file:///home/cipher/Projects/delivery/docs/features/04-leads-admin-y-onboarding/sdd/01-historias-de-usuario.md)<br>• [Onboarding, KYC & PWA](file:///home/cipher/Projects/delivery/docs/features/04-leads-admin-y-onboarding/sdd/02-flujos-y-estados.md) | • [Zod & Server Actions](file:///home/cipher/Projects/delivery/docs/features/04-leads-admin-y-onboarding/tdd/01-arquitectura-y-contratos.md)<br>• [KYC Storage & Audit DB](file:///home/cipher/Projects/delivery/docs/features/04-leads-admin-y-onboarding/tdd/02-base-de-datos-y-auditoria.md)<br>• [Plan de Pruebas](file:///home/cipher/Projects/delivery/docs/features/04-leads-admin-y-onboarding/tdd/03-plan-de-pruebas.md) |
| **05: Pedidos & Comandera** | [README.md](file:///home/cipher/Projects/delivery/docs/features/05-pedidos-y-comandera/README.md) | • [Historias de Usuario](file:///home/cipher/Projects/delivery/docs/features/05-pedidos-y-comandera/sdd/01-historias-de-usuario.md)<br>• [Máquina de Estados](file:///home/cipher/Projects/delivery/docs/features/05-pedidos-y-comandera/sdd/02-flujos-y-estados.md) | • [Hook Realtime & Audio](file:///home/cipher/Projects/delivery/docs/features/05-pedidos-y-comandera/tdd/01-arquitectura-y-contratos.md)<br>• [DB Orders & RLS](file:///home/cipher/Projects/delivery/docs/features/05-pedidos-y-comandera/tdd/02-base-de-datos-y-realtime.md)<br>• [Plan de Pruebas](file:///home/cipher/Projects/delivery/docs/features/05-pedidos-y-comandera/tdd/03-plan-de-pruebas.md) |
| **06: Marketplace Cliente** | [README.md](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/README.md) | • [Historias de Usuario](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/sdd/01-historias-de-usuario.md)<br>• [Reglas de Catálogo](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/sdd/02-flujos-y-estados.md) | • [Helper Horarios](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/tdd/01-arquitectura-y-contratos.md)<br>• [Query de Comercios](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/tdd/02-base-de-datos-y-queries.md)<br>• [Plan de Pruebas](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/tdd/03-plan-de-pruebas.md) |

---

## 🎨 Diseños y Referencias Visuales

- [disenos/](file:///home/cipher/Projects/delivery/docs/disenos) — Planes de rediseño visual y layouts UI.
- [assets/](file:///home/cipher/Projects/delivery/docs/assets) — Capturas de referencia, mockups y diagramas.
- [features/aplicados/](file:///home/cipher/Projects/delivery/docs/features/aplicados) — Especificaciones históricas de UI ya aplicadas.
- [features/rangos-y-logros/](file:///home/cipher/Projects/delivery/docs/features/rangos-y-logros) — Feature gamificación en definición.
