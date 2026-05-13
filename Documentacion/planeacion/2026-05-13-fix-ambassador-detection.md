# Plan de Implementación: Corrección de Detección de Rol de Embajador

Este plan detalla los cambios necesarios para corregir el problema donde el widget de Embajadores no detecta correctamente a los usuarios registrados, mostrándoles el formulario de registro nuevamente.

## Problema Identificado

1.  **Uso de API Incorrecta**: El widget (`ambassador-widget.js`) intenta consultar `/api/ambassadors?search={email}`, el cual es un endpoint protegido para administradores. Esto resulta en un error 401 para usuarios normales.
2.  **Dependencia de Búsqueda por Email**: La búsqueda por email puede ser imprecisa. Es preferible usar el `memberstackId` que es único y está disponible en el contexto del widget.
3.  **Múltiples Llamadas Innecesarias**: El widget realiza una llamada para buscar y otra para obtener detalles, ambas a endpoints potencialmente restringidos.

## Cambios Propuestos

### 1. API: `src/app/api/ambassadors/by-memberstack/route.ts`

-   [MODIFY] Actualizar el endpoint para que devuelva la información completa del embajador (incluyendo estadísticas y referidos recientes) en una sola respuesta.
-   [MODIFY] Asegurar que la estructura de respuesta sea consistente con lo que espera el widget.

### 2. Widget: `public/widgets/ambassador-widget.js`

-   [MODIFY] Actualizar la función `checkAmbassadorStatus` para:
    -   Recibir `memberstackId` en lugar de `email`.
    -   Consultar `/api/ambassadors/by-memberstack?memberstackId=...`.
    -   Simplificar la lógica de procesamiento (ya no requiere la segunda llamada a `/[id]`).
-   [MODIFY] Mejorar el logging para facilitar el debugging en producción.

## Plan de Verificación

1.  **Pruebas Manuales**:
    -   Iniciar sesión con una cuenta que tenga solicitud de embajador pendiente. Verificar que muestre el estado "Pendiente".
    -   Iniciar sesión con una cuenta de embajador aprobado. Verificar que muestre el dashboard con estadísticas.
    -   Iniciar sesión con una cuenta que NO sea embajador. Verificar que muestre el botón "Quiero ser Embajador".
2.  **Logs de Servidor**: Verificar que no haya errores 401 o 404 al cargar el widget.
