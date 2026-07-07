# Plan de Implementación: Corrección de Cierre de Sesión al Recargar la Página

Este documento detalla el plan para solucionar el problema del cierre de sesión automático involuntario que ocurre al recargar la página.

## Contexto del Problema

Actualmente, el sistema implementa un "guard" de sesión temporal interceptando el prototipo de almacenamiento (`Storage.prototype`) de manera global. En la inicialización, remueve los tokens de `localStorage` real y los copia a `sessionStorage` para forzar que la sesión expire al cerrar el navegador.

Sin embargo, al recargar la página o al navegar en Webflow, se produce una condición de carrera:
1. El script de Memberstack en Webflow (declarado en el Head) se carga e inicializa **antes** de que el widget de Pata Amiga (en el Body) intercepte los métodos de `Storage`.
2. Como los tokens se eliminaron del `localStorage` real en la sesión anterior, Memberstack lee un `localStorage` vacío y asume que el usuario no tiene sesión activa, forzando un logout.

## Propuesta de Solución: Cookie de Sesión Centinela

En lugar de interceptar `Storage.prototype` globalmente (lo que altera el comportamiento nativo y genera incompatibilidades de sincronización), utilizaremos una **cookie de sesión centinela** (`pata_session_active=true` sin expiración):

1. **Nueva sesión del navegador** (la cookie de sesión no existe):
   - Al cargar el sitio, el guard detecta que la cookie no existe.
   - Limpia los tokens `_ms-mid` y `_ms-mem` del `localStorage` real.
   - Crea la cookie de sesión.
   - Memberstack inicia sin sesión (comportamiento correcto de cierre de sesión al cerrar navegador).
2. **Sesión activa** (recarga o navegación, la cookie sí existe):
   - El guard detecta que la cookie existe.
   - **No borra nada** del `localStorage` real.
   - Memberstack lee directamente de `localStorage` de manera nativa sin interceptores.
   - La sesión se mantiene perfectamente al recargar o navegar.
3. **Cierre de navegador**:
   - El navegador destruye la cookie de sesión automáticamente.
   - En el próximo inicio del navegador, el flujo vuelve al paso 1, limpiando la sesión.

Al eliminar el proxy de `Storage.prototype`, el comportamiento del almacenamiento vuelve a ser 100% nativa para Memberstack, eliminando por completo las condiciones de carrera y fallos de recarga.

## Archivos a Modificar

### [Componente Principal]

#### [MODIFY] [layout.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/layout.tsx)
- Reemplazar el script inline `memberstack-session-storage-guard` con la nueva lógica basada en la cookie de sesión centinela, removiendo la interceptación de `Storage.prototype`.

### [Componentes de Widgets Externos]

#### [MODIFY] [ambassador-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/ambassador-widget.js)
#### [MODIFY] [unified-membership-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/unified-membership-widget.js)
#### [MODIFY] [wellness-center-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/wellness-center-widget.js)
- Reemplazar la función interna `enforceMemberstackSessionStorage` con la nueva lógica basada en la cookie de sesión centinela.

---

## Plan de Verificación

### Verificación Manual
1. **Prueba de Recarga**: Iniciar sesión, recargar la página y verificar que la sesión permanezca activa.
2. **Prueba de Navegación**: Navegar entre pestañas o diferentes rutas del sitio y validar la permanencia de la sesión.
3. **Prueba de Cierre de Navegador**: Simular el cierre del navegador (borrando la cookie `pata_session_active` en las herramientas de desarrollo del navegador), recargar y validar que se limpie la sesión.

### Verificación de Calidad y Compilación
- Ejecutar `npm run build` para asegurar la compilación del proyecto Next.js.
- Ejecutar `npm run type-check` para validar la integridad de TypeScript.
- Ejecutar `npm run lint` para validar la calidad del código.
