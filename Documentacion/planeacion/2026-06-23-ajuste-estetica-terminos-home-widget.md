# Plan: Ajuste de Estética, Separación en Hero, Reemplazo de Término "Mascota" a "Peludo", Alineación en Móvil y Animaciones Scroll en Home Widget

Este plan detalla los ajustes estéticos, de texto y de animación solicitados para el widget de inicio (`home-widget.js`).

## Cambios Propuestos

### 1. Limpieza de Navegación en Footer
- Remover el enlace de "Nosotros" en el menú de navegación del footer, ya que no existe dicha sección.

### 2. Ajuste de Estilo en Hero (Mayor Ancho y Separación)
- Aumentar el ancho máximo del contenedor del Hero para permitir que la imagen y el contenido tengan mayor separación.
- Aumentar el `max-width` de `.pata-hero-content` para asegurar que el texto de la segunda línea de título ("para tu peludo") quepa en una sola línea sin saltos involuntarios.
- Modificar el espacio (`gap`) entre la columna de texto y la de imagen.

### 3. Alineación de Viñetas de Características en Móvil
- Corregir el comportamiento en pantallas móviles donde las viñetas se centran de forma individual (causando un efecto escalonado desalineado).
- Definir un bloque con un ancho máximo centrado, pero con las viñetas alineadas a la izquierda para un aspecto de lista limpio y profesional.

### 4. Animaciones de Entrada (Slide-in)
- Crear una clase CSS `.pata-animate-on-scroll` que inicie con `opacity: 0` y `transform: translateY(30px)`.
- Usar un `IntersectionObserver` de JavaScript para activar la clase `.pata-visible` de manera no invasiva y progresiva (suave con una curva de transición cubic-bezier) a medida que el usuario hace scroll sobre las secciones/tarjetas.
- Asegurar un fallback para navegadores antiguos que no soporten IntersectionObserver.

### 5. Reemplazo de Terminología ("Mascota" -> "Peludo")
- Reemplazar sistemáticamente las menciones de "mascota" y "mascotas" por "peludo" y "peludos" en los textos visibles del widget y atributos `alt` de las imágenes:
  - Título principal: "Plan de Salud para tu peludo".
  - Viñetas de beneficios: "Incluye hasta 3 peludos".
  - Título de sección: "Todo lo que tu peludo necesita".
  - Opción de establecimiento en formulario de bienestar: "Tienda para peludos" (tanto en la etiqueta visual como en el valor del checkbox enviado a la API).

---

## Archivos Modificados

### [Widgets]

#### [MODIFY] [home-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/home-widget.js)
- Eliminar la línea del link de Nosotros en el footer HTML.
- Actualizar las reglas de estilo CSS para `.pata-hero-section` y `.pata-hero-content`.
- Modificar las reglas CSS en la media query para móviles de `.pata-hero-grid` y `.pata-hero-bullet`.
- Inyectar las clases CSS de animación y transiciones.
- Inicializar el `IntersectionObserver` en JavaScript.
- Añadir la clase `pata-animate-on-scroll` a las secciones/tarjetas principales.

---

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm run type-check` y `npm run build` para asegurar la integridad de la compilación y tipado.

### Verificación Manual
- Visualizar `http://localhost:3000/widgets/home-widget-preview.html`.
- Confirmar que el menú del footer no tiene la opción "Nosotros".
- Verificar que el título del Hero ("para tu peludo") quede en una sola línea y tenga suficiente separación de la imagen en desktop.
- Probar en vista móvil (simulando viewport angosto) que las viñetas se alinean verticalmente a la izquierda en una columna ordenada.
- Probar las animaciones al deslizarse por la página, observando que las secciones emerjan suavemente desde abajo.
