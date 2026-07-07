# Plan de Implementación: Estilización y Espaciado de Tabla de Solicitudes de Centros

Este documento detalla el plan para corregir el espaciado de las filas, las líneas de separación, formatear la fecha y refinar la interfaz de la tabla de centros de bienestar.

## Análisis del Problema

1. **Falta de Líneas y Espaciado**: En `WellnessCentersTable.tsx`, las etiquetas `thead` y `tbody` no tienen asignadas las clases `.tableHeader` y `.tableBody`. Esto evita que se apliquen las reglas de `border-bottom` y `padding` en las celdas, haciendo que las filas estén pegadas verticalmente y no haya líneas separadoras.
2. **Fecha de Registro Simple**: La fecha de registro se renderiza con el formato nativo simple `7/6/2026`, en lugar de un formato más estético como `07 jun 2026`.
3. **Botón de Ver Detalles**: El botón carece de aire vertical debido a la falta de padding en las celdas (`td`).

## Propuesta de Solución

1. **Asignación de Clases CSS en Tabla**:
   - Agregar `className={styles.tableHeader}` a la etiqueta `thead` de `WellnessCentersTable.tsx`.
   - Agregar `className={styles.tableBody}` a la etiqueta `tbody` de `WellnessCentersTable.tsx`.
   - Esto heredará inmediatamente el padding vertical (`var(--spacing-md)`), el border-bottom sutil, y la transición de hover de las filas.

2. **Formateo de la Fecha**:
   - Modificar la renderización de la fecha de registro en la columna "Registro" para usar `toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })` y envolverla en un estilo premium semi-bold.

## Archivos a Modificar

### [Componentes de Administración]

#### [MODIFY] [WellnessCentersTable.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/WellnessCentersTable.tsx)
- Asignar `className={styles.tableHeader}` al `thead` y `className={styles.tableBody}` al `tbody`.
- Formatear el campo de fecha de registro.

---

## Plan de Verificación

### QA y Compilación
- Validar mediante:
  ```bash
  npm run type-check
  npm run lint
  npm run build
  ```
