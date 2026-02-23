# 🚀 Configuración de Resend para Emails

## 1. Configuración Local (desarrollo)

Edita el archivo `.env.local` en la raíz del proyecto y agrega:

```env
RESEND_API_KEY=re_VSwJ6hrK_DQGkyegeop21f2kLwp7h8g8c
```

**IMPORTANTE:** Este archivo NO se sube a GitHub (está en .gitignore)

---

## 2. Configuración en Vercel (producción)

1. Ve a [vercel.com](https://vercel.com) → Tu proyecto → Settings → Environment Variables
2. Agrega una nueva variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_VSwJ6hrK_DQGkyegeop21f2kLwp7h8g8c`
3. Guarda y redeploya el proyecto

---

## 3. Verificar Dominio en Resend

Para que los emails lleguen correctamente (y no a spam), debes verificar tu dominio:

1. Ve a [resend.com/domains](https://resend.com/domains)
2. Agrega tu dominio: `pataamiga.mx` (o `clubpataamiga.com`)
3. Sigue los pasos para verificar (agregar registros DNS)
4. Espera la verificación (puede tomar minutos a horas)

---

## 4. Probar el Envío de Emails

### Test rápido desde terminal:
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_VSwJ6hrK_DQGkyegeop21f2kLwp7h8g8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "notificaciones@pataamiga.mx",
    "to": "tu-email@ejemplo.com",
    "subject": "Test Club Pata Amiga",
    "html": "<p>¡Funciona! 🎉</p>"
  }'
```

### Test desde la app:
1. Registra un nuevo embajador
2. Apruébalo desde el admin
3. Verifica que llegue el email con el link para elegir código

---

## 5. Configuración del Email de Envío

Edita `src/lib/resend.ts` si necesitas cambiar el email remitente:

```typescript
export const DEFAULT_FROM_EMAIL = 'notificaciones@pataamiga.mx';
export const DEFAULT_FROM_NAME = 'Club Pata Amiga';
```

**Nota:** El dominio del email debe estar verificado en Resend.

---

## 6. Solución de Problemas

### Los emails no llegan:
- Verifica que el dominio esté verificado en Resend
- Revisa la carpeta de spam
- Usa un email de Gmail/Outlook para pruebas
- Verifica los logs en Vercel (Functions)

### Error "Domain not verified":
- Debes verificar tu dominio en Resend antes de enviar emails
- O usa `onboarding@resend.dev` solo para pruebas (llega a cualquier lado)

### Error "API key invalid":
- Verifica que `RESEND_API_KEY` esté configurada correctamente
- En local: revisa `.env.local`
- En producción: revisa las variables de entorno en Vercel

---

## 📧 Emails que se envían automáticamente

| Evento | Función | Email destino |
|--------|---------|---------------|
| Embajador aprobado | `notifyAmbassadorApproval` | Embajador |
| Código establecido | `notifyAmbassadorReferralCodeSet` | Embajador |
| Código cambiado | `notifyAmbassadorReferralCodeChanged` | Embajador |
| Cambio habilitado | `notifyAmbassadorCodeChangeEnabled` | Embajador |

---

## 🔒 Seguridad

⚠️ **NUNCA** subas la API key a GitHub:
- Usa `.env.local` (local)
- Usa Variables de Entorno en Vercel (producción)
- La API key empieza con `re_` y debe mantenerse privada

Si accidentalmente expusiste la key:
1. Rota la API key en Resend (Settings → API Keys)
2. Actualiza la variable en todos lados
