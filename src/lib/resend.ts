import { Resend } from 'resend';

/**
 * Cliente de Resend para envío de emails
 * Requiere la variable de entorno RESEND_API_KEY
 */
export const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// Email desde el cual se enviarán las comunicaciones del sistema/admin
export const DEFAULT_FROM_EMAIL = 'notificaciones@app.pataamiga.mx'; // Usando subdominio para evitar conflictos con Memberstack
export const DEFAULT_FROM_NAME = 'Club Pata Amiga';

// Email para comunicaciones directas con miembros (ej. seguimiento de documentación)
// El dominio app.pataamiga.mx está verificado en Resend.
export const MEMBERS_FROM_EMAIL = 'miembros@app.pataamiga.mx';
export const MEMBERS_FROM_NAME = 'Club Pata Amiga';

// Reply-To: Los usuarios que respondan serán dirigidos al buzón principal
// Este dominio NO está en Resend pero funciona como reply-to sin restricciones.
export const REPLY_TO_EMAIL = 'miembros@pataamiga.mx';
