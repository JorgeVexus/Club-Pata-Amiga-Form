# Design System - Club Pata Amiga (Neo-Brutalismo Premium)

Este documento define las reglas visuales y funcionales del sistema de diseño **Neo-Brutalista** utilizado en el flujo de registro V2 y componentes administrativos. Este sistema busca un balance entre la estética audaz y la usabilidad premium.

---

## 🎨 Paleta de Colores

### Colores Base
- **Negro Primario**: `#181C1C` (`--color-black`) - Utilizado para bordes, sombras y texto principal.
- **Blanco Puro**: `#FFFFFF` (`--color-white`) - Fondos de tarjetas y contenedores.
- **Gris de Texto**: `#2D3748` (`--color-text-dark`) y `#718096` (`--color-text-light`).

### Colores de Marca (Vibrantes)
- **Turquesa (Principal)**: `#15BEB2` (`--color-primary`) - Usado en badges, enlaces y acentos principales.
- **Naranja (Acción)**: `#FE8F15` (`--color-action-orange`) - Reservado para botones de "Siguiente" o acciones críticas.
- **Rosa**: `#FE0063` (`--color-pink`) - Acento decorativo y beneficios.
- **Lima**: `#9FD406` (`--color-lime`) - Éxito y beneficios.
- **Amarillo**: `#FEBD01` (`--color-yellow`) - Advertencias y acentos secundarios.

---

## ✍️ Tipografía

### Headings (Títulos)
- **Fuente**: `Fraiche`, sans-serif.
- **Uso**: Títulos de formularios (`h1`, `h2`), botones y badges.
- **Transformación**: Generalmente `uppercase` (mayúsculas) para títulos de pasos y botones.
- **Peso**: 300 (Light) para botones, 600 (Bold) para titulares.

### Body (Cuerpo)
- **Fuente**: `Outfit`, sans-serif.
- **Uso**: Párrafos, labels de inputs, textos de ayuda y descripciones.
- **Peso**: 400 (Regular) para lectura, 600-700 (Semi-bold/Bold) para énfasis.

---

## 📐 Reglas de Neo-Brutalismo

### 1. Bordes y Sombras (The "Hard" Look)
- **Bordes**: Todos los contenedores principales y elementos interactivos deben tener un borde sólido.
  - `border: 2px solid #181C1C;`
- **Sombras (Hard Shadows)**: No se usan sombras difusas (`blur`). Se usan sombras sólidas desplazadas.
  - `box-shadow: 4px 4px 0px #181C1C;` (Estándar)
  - `box-shadow: 8px 8px 0px #181C1C;` (Modales o elementos flotantes)

### 2. Bordes Redondeados (The "Modern" Twist)
A diferencia del brutalismo clásico, usamos radios de borde generosos para suavizar la interfaz:
- **Tarjetas Principales**: `48px` (Desktop), `24px` (Mobile).
- **Inputs y Botones**: `9999px` (Pill-shaped).
- **Badges y Etiquetas**: `32px` o `9999px`.

### 3. Profundidad y Capas
- **Opacidad**: Los patrones de fondo o imágenes decorativas deben usar una opacidad del `20%` (`--opacity-20` / `0.2`) para no interferir con la legibilidad.
- **Backgrounds**: Se prefieren gradientes suaves de fondo (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`) para contrastar con las tarjetas sólidas.

---

## 🧩 Componentes Base

### 1. Form Card (El Contenedor Maestro)
```css
.formCard {
    background: var(--color-white);
    border: 2px solid var(--color-black);
    box-shadow: 4px 4px 0px var(--color-black);
    border-radius: 48px;
    padding: 40px;
    position: relative;
    overflow: hidden;
}
```

### 2. Step Badge (Indicador de Paso)
- **Color**: `--color-primary` (Turquesa).
- **Contenido**: Logo de Pata Amiga + Texto del paso (ej. "PASO 1 DE 6").
- **Alineación**: Siempre centrado en la parte superior del `formCard`.

### 3. Inputs (Campos de Entrada)
- **Estructura**: `inputGroup` (Label + Wrapper + Field).
- **Wrapper**: `border: 2px solid var(--color-black)`, `border-radius: 9999px`.
- **Focus**: `border-color: var(--color-primary)`, `box-shadow: 0 0 0 4px rgba(21, 190, 178, 0.15)`.

### 4. Botones
- **Primario**: Naranja con borde negro. Al hacer hover, se desplaza `-2px` y aumenta la sombra.
- **Secundario**: Turquesa con borde negro.
- **Texto**: `Fraiche`, `uppercase`.

---

## 📱 Responsividad (Mobile First)
- **Espaciado**: Reducir `padding` y `gap` en móviles para evitar scroll excesivo.
- **Fuentes**: Usar `clamp()` o `rem` con breakpoints para que los titulares escalen correctamente.
- **Radios**: Reducir radios de `48px` a `24px` en pantallas pequeñas para optimizar el espacio visual.

---

## 🔄 Animaciones
- **Easing**: Siempre usar curvas de desaceleración decisivas.
  - `--ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Entrada**: Los elementos deben entrar con un pequeño desplazamiento vertical (`translateY`) y un ligero escalado (`scale(0.95) -> 1`).
- **Micro-interacciones**:
  - `Hover`: Desplazamiento sutil hacia arriba (`-2px` a `-4px`).
  - `Active`: Pequeña reducción de tamaño (`scale(0.98)`).

---
**Última Actualización**: 4 de Mayo, 2026
**Autor**: Antigravity AI
