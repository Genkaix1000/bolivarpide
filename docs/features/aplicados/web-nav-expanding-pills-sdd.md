# SDD: Navbar web — pills siempre visibles (sin drawer)

> **Estado:** confirmado / en implementación.
> **Alcance:** desktop/web (`md:`+). Mobile: drawer sigue, sin dirección.
> **Archivo principal:** `src/components/Navbar.tsx`

---

## 1. Problema

En web el navbar metía tabs / apariencia / dirección en un **panel colapsable**. Sobran el paso extra y el duplicado de dirección (ya vive bajo el search en `CurvedHomeHeader`).

---

## 2. Decisiones (cerradas)

| Decisión | Veredicto |
|---|---|
| Quitar drawer en web | **Sí** — nav primaria siempre visible |
| Animación expand-label en tabs desktop | **No** — innecesaria para la estética diner; labels siempre visibles |
| Expand en campana / mobile bottom | **Fuera de alcance** — no restaurar ahora |
| Perfil = avatar redondo (sin “Mi Perfil”) | **Sí** → `onTabChange("profile")` |
| Día/noche en la misma fila desktop | **Sí** — `CherryBtn` círculo, sin label expand |
| Notificaciones en fila desktop | **Sí** — header ovalado las oculta en `md:+`; campana + popover |
| Dirección en este panel | **No** — solo centro del header ovalado, bajo search |

---

## 3. Layout desktop

```
[Logo]  [Search ………]  [🏠 Inicio] [🧭 Explorar] [🛒 Mi Carrito]  [☀/☾] [🔔] [Avatar]
```

- Tabs: ícono + label **siempre** visibles; activo = tint cherry + `fill` en ícono.
- Theme / notif: círculos Cherry Cola (sin expand de texto).
- Avatar: `h-9 w-9`, iniciales mock `SA`; activo = ring cherry.
- Sin drawer / aside en `md:+`.

---

## 4. Mobile (mínimo)

- Hamburguesa → drawer con tabs + theme.
- **Sin** sección de direcciones en el drawer.
- Carrito ícono + avatar (avatar → perfil, o menú según implementación mínima: avatar abre drawer o va a perfil — **avatar → perfil**; menú sigue en hamburguesa).

---

## 5. Criterios de aceptación

- [x] Spec: sin expand-label en tabs desktop
- [x] `md:+` sin drawer para navegar
- [x] Inicio / Explorar / Carrito siempre con ícono + label
- [x] Theme + notificaciones en la fila desktop
- [x] Perfil = avatar only → tab profile
- [x] Sin UI de dirección en Navbar
- [x] Mobile drawer sin direcciones; hamburger-only (`md:hidden`)

---

## 6. Archivos

| Archivo | Cambio |
|---|---|
| `src/components/Navbar.tsx` | Nav desktop inline; quitar addresses; theme/notif desktop; avatar→profile |
| `src/app/page.tsx` | Quitar props de dirección del Navbar |
| `docs/features/aplicados/web-nav-expanding-pills-sdd.md` | Este doc (nombre histórico; expand descartado) |
