# Estrategia de Reembolsos - Fondo Solidario

Este documento detalla el análisis técnico y la hoja de ruta para implementar la gestión de reembolsos del Fondo Solidario de Club Pata Amiga.

## 1. Análisis de Opciones

### Opción A: Manual Asistido (Recomendada para Fase 1)
**Flujo:**
1. El miembro llena el formulario de solicitud incluyendo datos bancarios (CLABE, Banco, Titular).
2. El administrador revisa la solicitud en el dashboard.
3. El administrador realiza la transferencia manualmente desde el portal de la asociación civil.
4. El administrador marca como "Pagado" en el dashboard, disparando una notificación automática.

**Pros:** Control total, sin costos de integración adicionales, cumplimiento simple.
**Contras:** Riesgo de error humano en la captura, no escala eficientemente con alto volumen.

---

### Opción B: Stripe Payouts
**Análisis:**
Stripe no permite realizar pagos de salida (payouts) directamente a cuentas bancarias de terceros en México desde el balance de la cuenta. Los payouts en Stripe están diseñados para transferir fondos a la cuenta bancaria conectada de la propia organización. Por lo tanto, esta opción queda descartada para el envío de fondos a los miembros.

---

### Opción C: Plataformas de Dispersión (Automatizado)

Existen infraestructuras especializadas en México para realizar transferencias masivas vía SPEI:

| Plataforma | Descripción | Integración |
| :--- | :--- | :--- |
| **Clip / Conekta** | API REST para SPEI masivo y dispersiones. | API Key + Webhooks. |
| **OpenPay** | Herramienta de dispersión masiva muy robusta. | Excelente documentación en MX. |
| **STP** | Conexión directa a la infraestructura SPEI interbancaria. | Requiere convenio formal (ideal para alto volumen). |
| **Cuenca API** | Cuenta digital con capacidades de dispersión vía API. | SDK TypeScript disponible. |

---

## 2. Recomendación Híbrida (Hoja de Ruta)

### Fase 1: Implementación Manual Mejorada (Inmediata)
- **Formulario:** Captura de datos bancarios con validación de CLABE.
- **Seguridad:** Almacenamiento cifrado de datos bancarios en Supabase.
- **UI Admin:** Botón "Copiar CLABE" en el modal de detalle para evitar errores de transcripción.
- **Exportación:** Generación de archivos CSV con formato compatible para carga masiva en portales bancarios (BBVA, Santander, etc.).

### Fase 2: Automatización (Escalamiento)
- **Integración:** Implementar API de **OpenPay** o **Conekta Dispersiones**.
- **Flujo:** Al aprobar una solicitud, el sistema realiza la transferencia automáticamente.
- **Conciliación:** Uso de webhooks para actualizar el estado del reembolso en tiempo real.

---

## 3. Consideraciones de Seguridad y Auditoría

- **Cifrado de Datos:** Los datos sensibles como la CLABE deben estar encriptados en reposo (AES-256).
- **Doble Factor de Autorización:** Para montos superiores a un umbral definido, requerir la aprobación de dos administradores.
- **Logs Inmutables:** Registro estricto de cada movimiento financiero: quién aprobó, cuándo y el ID de rastreo bancario.
- **Límites:** Configurar límites diarios y mensuales de dispersión por seguridad.

---
*Última actualización: 10 de Mayo, 2026*
*Proyecto: Club Pata Amiga - Fondo Solidario*
