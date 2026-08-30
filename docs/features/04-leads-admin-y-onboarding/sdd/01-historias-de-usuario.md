# SDD — 01: Historias de Usuario (Onboarding Wizard & Planes)

> **Módulo:** `04-leads-admin-y-onboarding`  
> **Fase:** 4  

---

## HU-4.1: Stepper Paso 1 — Autenticación en 1 Clic
> **Como** comerciante que inicia el alta de su local,  
> **Quiero** autenticarme con un solo clic con Google o Apple (o ver el paso ya aprobado si ya estoy logueado),  
> **Para** no perder tiempo creando contraseñas.

```gherkin
Escenario: Comerciante ya autenticado ingresa al Wizard
  Dado que un usuario con sesión activa ingresa a "/negocio/nuevo"
  Entonces el Paso 1 ("Crear cuenta") se marca automáticamente como completado ✅
  Y el Wizard abre directamente en el Paso 2 ("Datos de tu negocio")

Escenario: Visitante no autenticado inicia el Wizard
  Dado que un visitante sin sesión ingresa a "/negocio/nuevo"
  Entonces ve el Paso 1 activo con las opciones "Continuar con Google" y "Continuar con Apple"
  Y al completar el inicio de sesión, avanza fluidamente al Paso 2 sin recargar ni perder contexto
```

---

## HU-4.2: Stepper Paso 2 — Datos Esenciales & Rubro Predictivo
> **Como** comerciante,  
> **Quiero** elegir mi rubro rápidamente mediante botones visuales o escribir mi variante con texto predictivo,  
> **Para** que mi local quede bien categorizado sin esfuerzo.

```gherkin
Escenario: Selección de rubro principal rápido
  Dado que el comerciante se encuentra en el Paso 2 del Wizard
  Cuando hace clic en el pill "Pizzería"
  Entonces el rubro queda fijado como "pizzeria"

Escenario: Comerciante con rubro no listado (Fallback inteligente)
  Dado que el comerciante elige la opción "Otros..."
  Cuando escribe "Chocolatería artesanal" (rubro no existente en la lista oficial)
  Entonces el sistema asigna internamente la categoría base "variados"
  Y almacena "custom_category_input = 'Chocolatería artesanal'" para que el administrador pueda crear el rubro formalmente
```

---

## HU-4.3: Stepper Paso 3 — Selección de Plan de Monetización
> **Como** comerciante que da de alta su negocio,  
> **Quiero** ver con total claridad los planes disponibles y poder elegir el Plan Inicial sin pagar nada,  
> **Para** probar la plataforma con costo fijo $0.

```gherkin
Escenario: Selección del Plan Inicial Free por defecto
  Dado que el comerciante avanza al Paso 3 del Wizard
  Entonces ve las 3 tarjetas de planes:
    | Plan               | Costo Fijo | Comisión | Botón de Acción              |
    | Plan Inicial (Free)| $0 / mes   | 7%       | "Empezar Gratis" (Default)   |
    | Plan Impulso       | $45.000/mes| 3.5%     | "Seleccionar Impulso"        |
    | Plan Líder         | $95.000/mes| 0%       | "Seleccionar Líder"          |
  Cuando presiona "Crear mi Comercio Gratis" (con Plan Inicial seleccionado)
  Entonces no se le solicita ninguna tarjeta de crédito
  Y su local se crea en la base de datos de inmediato
```

---

## HU-4.4: Cero Fricción Bancaria (Mercado Pago OAuth)
> **Como** comerciante,  
> **Quiero** no tener que tipear números de CBU, Alias ni datos bancarios manuales durante el registro,  
> **Para** configurar mis cobros después con un simple botón de "Conectar con Mercado Pago".

```gherkin
Escenario: Registro libre de datos bancarios
  Dado que el comerciante completa el Wizard de Onboarding
  En ningún momento se le solicitan CBUs, cuentas bancarias ni datos fiscales complejos
  Y el local nace listo para cargar su carta
```

---

## HU-4.5: Verificación Nivel 2 Diferida (DNI / CUIT)
> **Como** dueño de un local que ya terminó de cargar su menú,  
> **Quiero** validar mi DNI/CUIT desde mi panel cuando decida abrir al público,  
> **Para** que mi local aparezca en el mapa de Bolívar y reciba pedidos.

```gherkin
Escenario: Comercio en borrador solicita verificación
  Dado un comercio creado con "verification_level = 1" y "published = false"
  Cuando el dueño completa la verificación Nivel 2 en el panel y el admin la aprueba
  Entonces se desbloquea el switch "Publicar en Bolívar" y puede empezar a despachar pedidos
```
