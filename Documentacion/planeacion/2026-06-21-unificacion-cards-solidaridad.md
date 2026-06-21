# Unificación de Estilos y Ordenamiento de Mascotas en Widget de Solidaridad

Este documento detalla el plan técnico para unificar y corregir el diseño visual de las tarjetas de selección de mascotas en el formulario de solicitud del fondo de solidaridad (`public/widgets/solidarity-request-form.js`), resolviendo los conflictos de CSS con el dashboard principal (`public/widgets/solidarity-dashboard.js`), e implementando el ordenamiento dinámico solicitado.

## User Review Required

> [!IMPORTANT]
> Se sobrescriben las reglas de visualización de `.pata-pet-card` dentro del formulario de solicitud usando selectores específicos de `#pata-solidarity-form .pata-pet-card` y directivas `!important` para evitar que el estilo del dashboard principal las convierta en cápsulas horizontales.

## Proposed Changes

### [Widgets]

#### [MODIFY] [solidarity-request-form.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-request-form.js)

1. **Corrección de CSS**:
   - Ajustar el estilo de `#pata-solidarity-form .pata-pet-grid` y `#pata-solidarity-form .pata-pet-card` en la inyección de estilos (`renderStyles()`).
   - Forzar el diseño vertical con `display: flex; flex-direction: column; align-items: center; text-align: center;`.
   - Ajustar los bordes, radios y sombras para emular el diseño de tarjetas verticales limpias con fotos cuadradas.
   - En pantallas móviles (max-width: 768px), forzar una grilla de 2 columnas para optimizar espacio.

2. **Función de Ordenamiento (`sortPets`)**:
   - Implementar el método `sortPets(pets)` en la clase `SolidarityRequestForm` para ordenar el listado de mascotas de acuerdo con:
     1. Mascotas con acceso al apoyo (activas y aprobadas y sin tiempo de carencia).
     2. Mascotas con tiempo de espera/pendientes de menor a mayor tiempo restante.
     3. Mascotas dadas de baja (inactivas).
   - Llamar a `sortPets` al obtener las mascotas de la API (`fetchData()`) y al cargar la información mock (`loadMockData()`).

3. **Etiquetado de Mascotas dadas de baja**:
   - Ajustar la lógica de renderizado para detectar y etiquetar explícitamente a las mascotas que están inactivas (`is_active === false`) como "Dada de baja".

## Verification Plan

### Automated Tests
- Ejecutar `npm run build` y `npm run type-check` para garantizar la estabilidad del empaquetado del widget y del proyecto en general.

### Manual Verification
- Visualizar localmente el formulario embebido dentro del dashboard.
- Verificar que las tarjetas se organicen de forma vertical y tengan la foto cuadrada con borde redondeado negro.
- Comprobar que el orden es correcto: primero apoyo activo, luego en espera (ordenados de menor a mayor días), y al final las mascotas dadas de baja.
