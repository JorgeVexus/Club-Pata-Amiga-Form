# Propuesta: Widget Unificado de Membresía (Smart Multi-Pet Widget) 🐾⚖️

Esta propuesta busca fusionar el panel de **Período de Carencia** con el **Módulo de Apelaciones** en una sola interfaz inteligente basada en pestañas.

## 🎯 Objetivo
Que el usuario tenga un solo lugar en su dashboard donde vea el estado real de cada mascota:
- **Aprobada:** Muestra el progreso de carencia y días restantes (estilo `waiting-period-panel`).
- **Rechazada:** Muestra el motivo y el formulario de apelación (estilo `appeal-widget`).
- **Acción Requerida:** Muestra las notas del admin y campos para corregir.

---

## 🏗️ Cómo funcionaría (Estructura)

### 1. Interfaz de Pestañas (Tabs)
Mantendremos la lógica de navegación del `waiting-period-panel.js`. Si el usuario tiene 3 mascotas, aparecerán 3 pestañas con sus nombres.

### 2. Estados Dinámicos por Pestaña (UX Mejorada)
Al cambiar de pestaña, el contenido del panel se adaptará según el estado de esa mascota:

| Estado | Lo que muestra el Widget |
| :--- | :--- |
| **Approved** | Barra de progreso animada + Días restantes. |
| **Rejected** | Banner rojo con motivo + **Botón "Apelar mi solicitud"**. |
| **Action Required** | Banner azul + Notas del admin + Instrucciones de corrección. |
| **Pending** | Mensaje de "Revisión en curso". |

> [!TIP]
> **UX de Apelación:** El formulario (textarea) no estará visible de entrada. Solo aparecerá si el usuario presiona el botón "Apelar". Esto mantiene el dashboard limpio y enfocado.

### 3. Sincronización de Datos
El widget seguirá usando el endpoint `/api/user/pets?userId=XXX` que creé anteriormente, el cual devuelve toda la info de Supabase (nombres, estados, notas del admin y fechas de registro).

---

## 🛠️ Cambios Técnicos

### CSS Unificado
Fusionaremos `waiting-period-panel.css` con los estilos del `appeal-widget` para que el diseño sea coherente (mismo radio de borde, tipografía Outfit/Inter, y sombras).

### Lógica de JS Refactorizada
El nuevo `unified-membership-widget.js` hará lo siguiente:
1. **Fetch:** Obtiene datos del miembro y sus mascotas.
2. **Cálculo de Carencia:** Para las mascotas aprobadas, calcula el % y los días restantes usando la lógica actual.
3. **Renderizado de Apelación:** Para las rechazadas, inyecta el formulario de apelación.
4. **Tabs Reactivos:** Al hacer clic en una mascota, renderiza el "cascarón" (Approved vs Rejected) correspondiente.
