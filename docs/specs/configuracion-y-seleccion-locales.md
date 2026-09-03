# Especificación Técnica & Diseño: Hub de Locales y Centro de Configuración

Documento de especificación para la modernización de la experiencia de administración de comercios en **BolivarPide**:
1. **Hub de Selección de Locales (`/negocio`)**: Rediseño visual en formato grid de tarjetas con acción destacada para registrar un nuevo comercio mediante el wizard.
2. **Centro de Configuración Unificada (`/negocio/[businessId]/configuracion`)**: Layout de dos columnas con sub-navegación lateral por solapas (General, Operación, Pagos, Canales, Equipo), integrando la configuración operativa y la pasarela de pagos en un único espacio.

---

## 1. Hub de Selección de Locales (`/negocio`)

### 1.1. Objetivo & Referencia Visual
Transformar el listado actual en un tablero visual moderno inspirado en la referencia compartida:
- Visualización de comercios en una cuadrícula (grid responsivo: 1 col en móvil, 2 cols en tablet, 3-4 cols en desktop).
- Cada tarjeta representa un local vinculado al usuario, destacando su identidad de marca, estado y plan.
- Integración de una tarjeta de acción ("Registrar nuevo comercio") que redirige directamente al Wizard de Onboarding (`/negocio/registro`).

### 1.2. Anatomía de las Tarjetas

#### A. Tarjeta de Acción: Registrar Nuevo Comercio
- **Aspecto**: Borde punteado sutil o fondo diferenciado con elevación suave al hover.
- **Icono Central**: Botón circular contenedor con símbolo `+` (Material Symbol `add` o SVG estilizado).
- **Texto Principal**: *"Registrar nuevo comercio"*
- **Subtexto**: *"Abrí una nueva sucursal o suma otro negocio a tu cuenta"*
- **Comportamiento**: Al hacer clic, navega a `/negocio/registro` donde inicia el wizard de onboarding.

#### B. Tarjetas de Comercio Activo (Estilo Menú / Showcase)
- **Portada / Banner Superior**:
  - Imagen de portada (`banner_path`) en formato horizontal con overlay de degradado oscuro.
  - Insignia de estado operativo en tiempo real: *Abierto* (verde pulsante) o *Cerrado* (gris) en la esquina superior izquierda.
  - Badge de plan (*Free*, *Impulso*, *Líder*) en la esquina superior derecha.
  - Eslogan / Tagline centrado en la parte inferior de la portada si está configurado.
- **Avatar de Marca Central**:
  - Logotipo circular (`logo_path`) de 72px que solapa la portada con borde blanco y sombra suave.
- **Identidad**:
  - Nombre del local en tipografía bold (`text-base`).
- **Métricas Clave (Estilo Showcase del Menú)**:
  - Tres columnas con divisores verticales:
    1. **Seguidores** (conteo de seguidores).
    2. **Productos** (total de platos/ítems en la carta).
    3. **Rating** (calificación numérica acompañada de estrella dorada).
- **Pie de Tarjeta**:
  - Rol asignado al usuario (*Dueño / Titular*, *Encargado*, etc.).
  - Botón de acción *"Gestionar →"* que redirige al dashboard del comercio (`/negocio/[businessId]/dashboard`).

#### C. Sección de Invitaciones Pendientes
- Si el usuario tiene invitaciones con estado `invited`, se muestran arriba del grid como tarjetas de atención destacada con acciones inmediatas: *Aceptar* o *Rechazar*.

---

## 2. Centro de Configuración Unificada (`/negocio/[businessId]/configuracion`)

### 2.1. Arquitectura de Navegación & Layout
Inspirado en la interfaz de referencia (*Crisply*):
- **Estructura**:
  - **Cabecera de página**: Título contextual, breadcrumb y descripción breve.
  - **Layout de 2 columnas**:
    - **Columna Izquierda (Tabs / Menú lateral interno)**: Menú vertical agrupado por secciones que conmuta la solapa activa sin recargar la página completa (vía estado o query param `?tab=...`).
    - **Columna Derecha (Panel de Configuración)**: Formularios y paneles agrupados en tarjetas con bordes suaves, toggles directos y botones de confirmación alineados a la derecha.

### 2.2. Detalle de Solapas (Tabs)

```
Configuración
├── 🏢 General (Perfil & Marca)
├── ⏱️ Operación (Horarios & Modalidades)
├── 💳 Pagos (Mercado Pago QR & Métodos Offline)
├── 💬 Canales (WhatsApp & Alertas)
└── 👥 Equipo (Miembros & Permisos)
```

---

### Tab 1: General (Perfil & Marca)
Configuración de la identidad del negocio y presencia pública:
- **Identidad**:
  - Nombre del comercio.
  - Slug / URL pública (`bolivarpide.com/[slug]`).
  - Eslogan / Tagline corto.
- **Imágenes de Marca**:
  - Logotipo del comercio: selector de archivo, previsualización circular y botón para cambiar o quitar.
  - Portada / Banner: selector de archivo y previsualización horizontal.
- **Ubicación & Contacto**:
  - Dirección física.
  - Ciudad / Localidad.
  - Teléfono público o de contacto.

---

### Tab 2: Operación & Horarios
Ajustes del ritmo operativo del negocio:
- **Estado de Atención**:
  - Toggle de apertura manual ("Abierto ahora" / "Cerrado temporalmente").
  - Opción de regirse estrictamente por la grilla horaria.
- **Tiempos de Preparación**:
  - Tiempo estimado de entrega / cocina en minutos (ej. 30 min).
- **Grilla de Horarios Semanales**:
  - Configuración por día (Lunes a Domingo).
  - Rango de apertura y cierre (soporte para turnos partidos/doble turno).
  - Switch de día cerrado.
- **Modalidades de Entrega**:
  - Delivery propio (activar/desactivar).
  - Retiro en el local / Takeaway (activar/desactivar).

---

### Tab 3: Pagos & Facturación (Integración Completa)
Unifica la pantalla existente de `/pagos` dentro del flujo natural de configuración:
- **Mercado Pago (Cobros QR)**:
  - Tarjeta de estado de cuenta vinculada (Email, Nombre de cuenta, Fecha de enlace).
  - Botón de vinculación OAuth / Botón de desvincular cuenta.
  - Configuración de Sucursal y Caja (POS) asociadas automáticamente.
  - **Toggles operativos**:
    - *Habilitar cobro con QR en el checkout*: permite a los clientes pagar con QR interoperable en la web.
    - *Absorber comisión Fast Pay*: define si el comercio asume el costo o si se traslada al cliente.
- **Cobros Manuales / Offline**:
  - Efectivo contra entrega (activar/desactivar).
  - Transferencia bancaria (Datos de CBU/CVU, Alias y Titular de cuenta).
- **Plan & Suscripción**:
  - Resumen del plan contratado (Comisión sobre ventas, beneficios activos).
  - Accesos a mejoras de plan (Impulso / Líder).

---

### Tab 4: Canales & Notificaciones
- **Conexión WhatsApp**:
  - Estado de sesión (Conectado / Desconectado).
  - Código QR de vinculación para escaneo desde el celular del negocio.
  - Mensaje automático de confirmación de pedidos.
- **Alertas del Local**:
  - Alerta de audio en tiempo real al ingresar un nuevo pedido.
  - Notificaciones al número de WhatsApp del encargado.

---

### Tab 5: Equipo & Seguridad
- **Miembros del Comercio**:
  - Lista de usuarios con acceso, roles asignados (*Owner*, *Manager*, *Kitchen/Staff*, *Driver*) y estados.
  - Formulario de invitación por correo electrónico.
- **Zona de Precaución**:
  - Pausar visibilidad pública del comercio.
  - Desvincularse del comercio.

---

## 3. Plan de Implementación

### Fase 1: Rediseño del Hub de Locales (`/negocio`)
1. Crear componente de tarjeta de local (`BusinessCard.tsx`) con diseño basado en la imagen de referencia.
2. Crear componente de tarjeta de acción (`CreateBusinessCard.tsx`) con botón `+` que navega a `/negocio/registro`.
3. Actualizar `src/app/negocio/page.tsx` para renderizar el grid responsivo y mantener las invitaciones en la parte superior.

### Fase 2: Layout de Configuración en Dos Columnas (`/negocio/[businessId]/configuracion`)
1. Crear el contenedor con navegación lateral secundaria (`SettingsTabsNav.tsx`).
2. Adaptar la ruta para soportar las pestañas vía query param o subcomponentes modulares:
   - `TabGeneral.tsx`
   - `TabOperacion.tsx`
   - `TabPagos.tsx` (reutilizando y estilizando el contenido de `PagosSection.tsx`)
   - `TabCanales.tsx` (reutilizando `WhatsAppConnectionCard.tsx`)
   - `TabEquipo.tsx`
3. Ajustar enlaces de navegación del `BusinessSidebar` para que `/pagos` redirija o resalte como parte de Configuración.
