# Automatización de Seguimiento de Documentación Faltante de Mascotas

> **Fecha de implementación:** 2026-04-23
> **Responsable:** Antigravity / Club Pata Amiga

---

## 1. Resumen

Sistema automatizado para detectar miembros activos que tienen mascotas con documentación incompleta (foto y/o certificado médico) y enviarles correos recordatorios en momentos clave durante los primeros 15 días desde su registro.

### Documentos que se verifican por mascota

| Campo Memberstack | Descripción | ¿Siempre requerido? |
|---|---|---|
| `pet-N-photo-1-url` | Foto principal de la mascota | ✅ Sí |
| `pet-N-vet-certificate-url` | Certificado médico veterinario | Solo si `pet-N-vet-certificate-required = true` |

---

## 2. Flujo General

```
Registro de mascota
      │
      ▼
  ¿Docs completos? ──────Yes──► Sin acción
      │
      No
      ▼
Día 0  → Email inmediato: "¡Casi listo!"
Día 10 → Email amistoso: "¿Necesitas ayuda?"
Día 13 → Email informativo: "No queremos que pierdas beneficios"
Día 14 → Email urgencia leve: "Mañana es el último día"
Día 15 → Email final: "Última oportunidad"
      │
      ▼
Usuario hace clic → app.pataamiga.mx/completar-documentacion
      │
      ▼
Sube archivos → API routes → Supabase Storage
      │
      ▼
Memberstack actualizado con URLs → Pantalla de éxito
```

---

## 3. Archivos Creados / Modificados

### Modificados

| Archivo | Cambio |
|---|---|
| `src/lib/resend.ts` | Nuevas constantes: `MEMBERS_FROM_EMAIL`, `MEMBERS_FROM_NAME`, `REPLY_TO_EMAIL` |
| `src/app/actions/comm.actions.ts` | Nueva función `sendMissingPetDocsEmail()` + tipos `MissingDocType`, `FollowupDay` |
| `.env.example` | Nuevas variables: `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` |

### Creados

| Archivo | Propósito |
|---|---|
| `src/app/api/cron/missing-info-followup/route.ts` | Cron job diario — detecta y envía emails |
| `src/app/api/upload/vet-certificate/route.ts` | Upload API para certificados veterinarios |
| `src/app/completar-documentacion/page.tsx` | Página de carga de documentos (destino del email) |
| `src/app/completar-documentacion/completar-documentacion.module.css` | Estilos de la página |
| `vercel.json` | Configuración del cron en Vercel |

---

## 4. Configuración de Correo

```
FROM:     miembros@app.pataamiga.mx  ← Dominio verificado en Resend
REPLY-TO: miembros@pataamiga.mx     ← Buzón principal con bandeja activa
```

> **¿Por qué dos dominios?**
> Resend requiere que el dominio del remitente esté verificado. El dominio principal
> `pataamiga.mx` tiene configuraciones en conflicto con otro proveedor de mailing,
> por lo que se usa el subdominio `app.pataamiga.mx`. El `reply-to` apunta al
> buzón real donde el equipo recibe y responde mensajes.

### Secuencia de emails

| Día | Tono | Asunto ejemplo |
|---|---|---|
| 0 | Bienvenida + recordatorio suave | "¡Casi listo! Solo falta la foto de Luna 🐾" |
| 10 | Amistoso / apoyo | "¿Necesitas ayuda con la foto de Luna? 🤝" |
| 13 | Informativo | "No queremos que Luna pierda sus beneficios 💛" |
| 14 | Urgencia leve | "Mañana es el último día para completar el perfil de Luna ⏳" |
| 15 | Final | "Última oportunidad: activa la protección de Luna hoy 🛡️" |

---

## 5. Cron Job: `/api/cron/missing-info-followup`

### Horario

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/missing-info-followup", "schedule": "0 16 * * *" }
  ]
}
```

Ejecuta a las **16:00 UTC = 10:00 AM Ciudad de México** (horario de verano CDT).
Ajustar a `0 17 * * *` en invierno si se prefiere mantener las 10:00 AM CST.

### Protección con `CRON_SECRET`

En producción, Vercel envía automáticamente el header `Authorization: Bearer <CRON_SECRET>`.
El endpoint lo verifica. Para pruebas manuales:

```bash
# Prueba local (solo en desarrollo)
curl http://localhost:3000/api/cron/missing-info-followup

# Prueba en producción (necesita el secret)
curl -X POST https://app.pataamiga.mx/api/cron/missing-info-followup \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

### Variables de entorno requeridas

```env
CRON_SECRET=un_string_aleatorio_y_largo
NEXT_PUBLIC_APP_URL=https://app.pataamiga.mx
RESEND_API_KEY=re_...
MEMBERSTACK_ADMIN_SECRET_KEY=sk_sb_...
SUPABASE_SERVICE_ROLE_KEY=...
```

Genera el secret con:
```bash
openssl rand -base64 32
```

---

## 6. Página de Carga: `/completar-documentacion`

### URL de enlace en el email

```
https://app.pataamiga.mx/completar-documentacion?m={memberId}&p={petIndex}
```

| Parámetro | Descripción |
|---|---|
| `m` | ID del miembro en Memberstack |
| `p` | Índice de la mascota (1, 2 o 3) |

### Comportamiento

1. **Autenticación**: La página verifica que el usuario esté logueado en Memberstack. Si no, muestra un mensaje y redirige.
2. **Seguridad**: Compara el `memberId` del URL con el ID del miembro autenticado. Si no coinciden, bloquea el acceso.
3. **Detección de faltantes**: Leer los custom fields de Memberstack para determinar qué falta.
4. **Upload condicional**: Muestra solo los campos necesarios (foto, certificado o ambos).
5. **Pantalla de éxito**: Al completar, muestra confirmación con botón "Ver mis mascotas".

### APIs de subida usadas

| Endpoint | Bucket Supabase | Privacidad |
|---|---|---|
| `POST /api/upload/pet-photo` | `pet-photos` | Público |
| `POST /api/upload/vet-certificate` | `vet-certificates` | Privado (URL firmada ~10 años) |

---

## 7. Lógica de Detección de Documentos

```typescript
// En el cron job — para cada mascota (petIndex = 1, 2, 3)
const hasPhoto = !!(customFields[`pet-${idx}-photo-1-url`]?.trim());
const requiresCert = customFields[`pet-${idx}-vet-certificate-required`] === 'true';
const hasCert = !!(customFields[`pet-${idx}-vet-certificate-url`]?.trim());

if (!hasPhoto && requiresCert && !hasCert) return 'both';
if (!hasPhoto) return 'photo';
if (requiresCert && !hasCert) return 'certificate';
return null; // Todo completo, no enviar email
```

---

## 8. Checklist de Deployment

- [ ] Agregar `CRON_SECRET` al panel de Vercel → Settings → Environment Variables
- [ ] Agregar `NEXT_PUBLIC_APP_URL=https://app.pataamiga.mx` en Vercel
- [ ] Verificar que el bucket `vet-certificates` existe en Supabase Storage
- [ ] Confirmar que el campo `pet-N-vet-certificate-required` existe en los custom fields de Memberstack
- [ ] Hacer deploy → Vercel registrará el cron automáticamente

### Verificar que el cron está activo en Vercel

Dashboard de Vercel → Tu proyecto → **Cron Jobs** tab → debe aparecer `/api/cron/missing-info-followup`.

---

## 9. Testing Manual

### Simular un envío (desarrollo local)

```bash
# Iniciar dev server
npm run dev

# En otro terminal, disparar el cron manualmente
curl http://localhost:3000/api/cron/missing-info-followup
```

El endpoint en desarrollo acepta GET sin autenticación para facilitar pruebas.

### Verificar logs de emails enviados

En Supabase → tabla `communication_logs`:

```sql
SELECT * FROM communication_logs
WHERE template_id LIKE 'missing_docs_day_%'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 10. Preguntas Frecuentes

**¿Qué pasa si un usuario completa los documentos antes del día 10?**
El cron verifica los campos en tiempo real antes de enviar. Si ya están completos, no envía el email.

**¿Se pueden agregar más días de seguimiento?**
Sí. Modificar el array `FOLLOWUP_DAYS` en `route.ts` y agregar la entrada correspondiente en los objetos `subjects` y `messages` de `comm.actions.ts`.

**¿Qué pasa con los miembros que aún no han pagado (`pending`)?**
El cron los omite. Solo procesa miembros con `approval-status` diferente de `pending`.

**¿Cómo puedo probar el email sin esperar el cron?**
Llamar directamente al endpoint del cron o usar la función `sendMissingPetDocsEmail()` en una Server Action de prueba.
