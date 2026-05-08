# Plan de Implementación - Estabilización del Fondo Solidario

Este documento detalla la lógica de negocio y los criterios de elegibilidad para el Dashboard del Fondo Solidario.

## Criterios de Elegibilidad (MANDATORIO)

> [!IMPORTANT]
> Para que una mascota sea elegible para solicitar apoyo del Fondo Solidario, debe cumplir con **AMBOS** criterios:
> 1. **Aprobación Administrativa**: El estatus de la mascota debe ser `approved`.
> 2. **Periodo de Carencia Finalizado**: Debe haber transcurrido el tiempo de espera calculado según el tipo de mascota (Mestiza/Adoptada).

## Resumen de Cambios Realizados

### Widget SolidarityDashboard (`solidarity-dashboard.js`)
- **Lógica de Carencia**: Se integraron los métodos `calculateCarencia(pet)` y `getPetStatusContext(pet)` para asegurar consistencia con el widget de tarjetas de mascotas.
- **Renderizado de Fotos**: Se prioriza `primary_photo_url` sobre `photo_url`, con un fallback automático.
- **Límite de Registro**: El disparador para añadir mascotas se oculta automáticamente al alcanzar las 3 mascotas.
- **Estadísticas en Tiempo Real**: Las estadísticas del dashboard se recalculan en el frontend tras cada carga de datos para garantizar que solo las mascotas que cumplen con aprobación + carencia cuenten como "Activas".

### API Backend (`/api/solidarity/stats`)
- Se actualizó el endpoint para validar el estatus `approved` antes de contar una mascota como activa en las métricas globales.

---

## Próximo Paso: Flujo de Solicitud de Apoyo

El siguiente hito es la implementación del formulario de **Solicitud de Apoyo**, el cual debe seguir estas reglas:

1. **Acceso Restringido**: Solo el botón "Solicitar apoyo" en las mascotas marcadas como "✅ Fondo disponible" será funcional.
2. **Flujo Multi-paso**:
   - **Paso 1**: Selección de motivo (Emergencia, Vacunación, Fallecimiento).
   - **Paso 2**: Detalle de la situación y carga de comprobantes/facturas iniciales.
   - **Paso 3**: Confirmación de datos de contacto.
3. **Validación Senior**: Si la mascota es Senior (calculado por edad/tamaño), el sistema debe exigir el certificado médico anual si no existe uno vigente en la base de datos.
4. **Integración**: La solicitud debe crear un registro en `solidarity_requests` y disparar una notificación al administrador.

---
**Fecha de Creación**: 8 de Mayo, 2026
**Estado**: Estabilización del Dashboard Finalizada.
