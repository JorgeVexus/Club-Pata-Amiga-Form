'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './EmailTemplatePreviewer.module.css';
import { buildBrandedEmailHtml } from '@/utils/email-builder';

// Definición de tipos
type CategoryType = 'members' | 'ambassadors' | 'wellness';

interface Template {
    id: string;
    name: string;
    icon: string;
    description: string;
    defaultSubject: string;
    defaultRecipient: string;
    params: {
        key: string;
        label: string;
        type: 'text' | 'select' | 'textarea' | 'checkbox_list';
        defaultValue: string | boolean | string[];
        options?: { label: string; value: string }[];
        checklistItems?: { type: string; label: string; icon: string; description: string }[];
    }[];
    render: (params: Record<string, any>) => string;
}

// ----------------------------------------------------
// DEFINICIÓN DE CORREOS DE MIEMBROS
// ----------------------------------------------------
const MEMBER_TEMPLATES: Template[] = [
    {
        id: 'member-welcome',
        name: 'Bienvenida a Miembros',
        icon: '👋',
        description: 'Enviado automáticamente cuando un miembro crea una cuenta exitosamente.',
        defaultSubject: '¡Bienvenido a la familia Club Pata Amiga! 🐾',
        defaultRecipient: 'miembro@pataamiga.mx',
        params: [
            { key: 'memberName', label: 'Nombre del Miembro', type: 'text', defaultValue: 'Jorge Cerna' }
        ],
        render: ({ memberName }) => {
            const content = `Estamos muy emocionados de darte la bienvenida a Club Pata Amiga.

Tu registro ha sido exitoso y ya eres parte de nuestra comunidad. Ahora puedes proceder a registrar a tus peludos para obtener su membresía y placa de identificación.

Pasos a seguir:
1. Inicia sesión en tu cuenta
2. Ve a la sección de "Mis Mascotas"
3. Registra a tus mascotas
4. Espera la aprobación de nuestros administradores

¡Gracias por confiar en nosotros!`;
            return buildBrandedEmailHtml({
                memberName,
                subject: '¡Bienvenido a la familia Club Pata Amiga! 🐾',
                content,
                audience: 'member'
            });
        }
    },
    {
        id: 'member-appeal-approved',
        name: 'Apelación Aprobada',
        icon: '🎉',
        description: 'Notifica al tutor que su apelación para una mascota rechazada ha sido aprobada.',
        defaultSubject: '🎉 ¡Buenas noticias! Tu apelación para {petName} fue aprobada',
        defaultRecipient: 'miembro@pataamiga.mx',
        params: [
            { key: 'memberName', label: 'Nombre del Miembro', type: 'text', defaultValue: 'Jorge' },
            { key: 'petName', label: 'Nombre de la Mascota', type: 'text', defaultValue: 'Luna' },
            { key: 'adminNotes', label: 'Notas del Administrador', type: 'textarea', defaultValue: 'Se verificó el certificado médico y todo está en orden.' }
        ],
        render: ({ memberName, petName, adminNotes }) => {
            const subject = `🎉 ¡Buenas noticias! Tu apelación para ${petName} fue aprobada`;
            const content = `Tenemos excelentes noticias para ti 🎉

Después de revisar tu apelación, hemos decidido aprobar a ${petName}. ¡Ahora forma parte oficial de la manada de Club Pata Amiga!

${adminNotes ? `Comentarios del equipo: ${adminNotes}` : ''}

Gracias por tu paciencia durante este proceso. Estamos muy contentos de tenerte con nosotros.`;

            return buildBrandedEmailHtml({
                memberName,
                subject,
                content,
                audience: 'member'
            });
        }
    },
    {
        id: 'member-appeal-rejected',
        name: 'Apelación Rechazada',
        icon: '📋',
        description: 'Notifica al tutor que la apelación ha sido evaluada pero no se pudo aprobar.',
        defaultSubject: '📋 Actualización sobre tu apelación para {petName}',
        defaultRecipient: 'miembro@pataamiga.mx',
        params: [
            { key: 'memberName', label: 'Nombre del Miembro', type: 'text', defaultValue: 'Jorge' },
            { key: 'petName', label: 'Nombre de la Mascota', type: 'text', defaultValue: 'Luna' },
            { key: 'adminNotes', label: 'Notas/Motivo del Rechazo', type: 'textarea', defaultValue: 'El certificado médico subido no cuenta con firma legible del veterinario tratante.' }
        ],
        render: ({ memberName, petName, adminNotes }) => {
            const subject = `📋 Actualización sobre tu apelación para ${petName}`;
            const content = `Queremos informarte que hemos revisado tu apelación para ${petName}.

Lamentablemente, después de una cuidadosa evaluación, no pudimos aprobar la solicitud en esta ocasión.

${adminNotes ? `Motivo: ${adminNotes}` : 'Si tienes dudas sobre esta decisión, no dudes en contactarnos.'}

Estamos para apoyarte si necesitas volver a registrar a tu mascota con los documentos correctos.`;

            return buildBrandedEmailHtml({
                memberName,
                subject,
                content,
                audience: 'member'
            });
        }
    },
    {
        id: 'member-missing-docs',
        name: 'Fotos Faltantes / Cron',
        icon: '⏳',
        description: 'Email automatizado de seguimiento (Días 0, 10, 13, 14, 15) cuando faltan fotos o certificados veterinarios.',
        defaultSubject: '¡Casi listo! Solo falta la foto de {petName}',
        defaultRecipient: 'miembro@pataamiga.mx',
        params: [
            { key: 'userName', label: 'Nombre del Miembro', type: 'text', defaultValue: 'Jorge Cerna' },
            { key: 'petName', label: 'Nombre de la Mascota', type: 'text', defaultValue: 'Rocky' },
            {
                key: 'followupDay',
                label: 'Día de Seguimiento',
                type: 'select',
                defaultValue: '0',
                options: [
                    { label: 'Día 0 (Inmediato)', value: '0' },
                    { label: 'Día 10 (Apoyo)', value: '10' },
                    { label: 'Día 13 (Advertencia)', value: '13' },
                    { label: 'Día 14 (Mañana vence)', value: '14' },
                    { label: 'Día 15 (Último día)', value: '15' }
                ]
            },
            {
                key: 'missingDocs',
                label: 'Documentos Faltantes',
                type: 'select',
                defaultValue: 'both',
                options: [
                    { label: 'Solo Foto', value: 'photo' },
                    { label: 'Solo Certificado Médico', value: 'certificate' },
                    { label: 'Foto y Certificado Médico', value: 'both' }
                ]
            },
            { key: 'uploadUrl', label: 'Enlace de Subida', type: 'text', defaultValue: 'https://club.pataamiga.mx/completar-perfil' }
        ],
        render: ({ userName, petName, followupDay, missingDocs, uploadUrl }) => {
            const dayNum = Number(followupDay);
            const docLabel = missingDocs === 'both' ? 'la foto y el certificado médico' :
                            missingDocs === 'photo' ? 'la foto' : 'el certificado médico';
            
            const subjects: Record<number, string> = {
                0: `¡Casi listo! Solo falta ${docLabel} de ${petName}`,
                10: `¿Necesitas ayuda con ${docLabel} de ${petName}?`,
                13: `No queremos que ${petName} pierda sus beneficios`,
                14: `Mañana es el último día para completar el perfil de ${petName}`,
                15: `Última oportunidad: activa la protección de ${petName} hoy`,
            };
            const subject = subjects[dayNum] || `Completa la información de ${petName}`;

            const firstName = userName.split(' ')[0] || 'Miembro';
            const messages: Record<number, { headline: string; body: string }> = {
                0:  { headline: `¡Hola ${firstName}! Tu registro fue un éxito`, body: `Solo falta un pequeño detalle para que ${petName} esté completamente protegido. Necesitamos ${docLabel}. ¡Es muy rápido y lo puedes hacer ahora mismo!` },
                10: { headline: `Hola ${firstName}, ¿cómo van?`, body: `Hemos notado que aún falta ${docLabel} de ${petName}. Si tienes alguna duda sobre cómo subir los archivos, con gusto te ayudamos. Responde este correo y te orientamos.` },
                13: { headline: `${firstName}, ${petName} te necesita`, body: `Estamos en la recta final. El perfil de ${petName} aún está incompleto y sin ${docLabel}, no podremos activar su cobertura completa. ¡Solo te toma un momento!` },
                14: { headline: `Solo queda 1 día, ${firstName}`, body: `Mañana vence el plazo para completar el perfil de ${petName}. No queremos que pierda ningún beneficio. Sube ${docLabel} hoy y listo.` },
                15: { headline: `¡Es hoy, ${firstName}!`, body: `Hoy es el último día para que ${petName} tenga su perfil completo y activo. Si subes ${docLabel} ahora, todo queda en orden. ¡No te tardes!` },
            };
            const msg = messages[dayNum] || messages[0];

            const missingItems: string[] = [];
            if (missingDocs === 'photo' || missingDocs === 'both') {
                missingItems.push(`<li style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;"><span style="width:32px;height:32px;border-radius:50%;background:#FE8F15;color:#fff;display:inline-block;text-align:center;line-height:32px;font-size:16px;flex-shrink:0;">📷</span><div><strong style="color:#2D3748;display:block;margin-bottom:2px;">Foto de ${petName}</strong><span style="color:#718096;font-size:13px;">Una foto clara donde se vea bien su carita</span></div></li>`);
            }
            if (missingDocs === 'certificate' || missingDocs === 'both') {
                missingItems.push(`<li style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;"><span style="width:32px;height:32px;border-radius:50%;background:#7DD8D5;color:#fff;display:inline-block;text-align:center;line-height:32px;font-size:16px;flex-shrink:0;">📄</span><div><strong style="color:#2D3748;display:block;margin-bottom:2px;">Certificado médico veterinario</strong><span style="color:#718096;font-size:13px;">Expedido por un médico veterinario certificado</span></div></li>`);
            }

            return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head><body style="margin:0;padding:0;background-color:#F7F8FA;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:40px 20px;"><tr><td align="center"><table width="100%" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#7DD8D5 0%,#00BBB4 100%);padding:36px 40px;text-align:center;"><img src="https://app.pataamiga.mx/Identidad/logo-pata-amiga-azul.png" alt="Club Pata Amiga" height="44" style="display:block;margin:0 auto 16px;"/><p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Perfil de tu mascota</p></td></tr><tr><td style="padding:40px 40px 24px;"><h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#2D3748;line-height:1.3;">${msg.headline}</h1><p style="margin:0 0 28px;font-size:16px;color:#4A5568;line-height:1.7;">${msg.body}</p><div style="background:#FFFBF5;border:1.5px solid #FEE4C4;border-radius:16px;padding:24px;margin-bottom:28px;"><p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#FE8F15;text-transform:uppercase;letter-spacing:0.5px;">Documentos pendientes</p><ul style="margin:0;padding:0;list-style:none;">${missingItems.join('')}</ul></div><div style="text-align:center;margin-bottom:28px;"><a href="${uploadUrl}" style="display:inline-block;background:#FE8F15;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;border:2px solid #000000;box-shadow:0 4px 14px rgba(254,143,21,0.35);font-family:'Outfit',sans-serif;">Completar perfil de ${petName}</a></div><p style="margin:0;font-size:13px;color:#A0AEC0;text-align:center;line-height:1.6;">Si ya lo completaste o tienes dudas, responde este correo y con gusto te ayudamos.</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #EDF2F7;margin:0;"/></td></tr><tr><td style="padding:24px 40px 36px;text-align:center;"><p style="margin:0 0 8px;font-size:13px;color:#718096;">Con cariño, <strong style="color:#2D3748;">El equipo de Club Pata Amiga</strong></p></td></tr></table></td></tr></table></body></html>`;
        }
    },
    {
        id: 'member-info-request',
        name: 'Solicitud de Info (Admin)',
        icon: '📋',
        description: 'Enviado por un administrador cuando rechaza algún campo del expediente de la mascota y requiere corrección.',
        defaultSubject: '📋 Necesitamos información adicional de {petName}',
        defaultRecipient: 'miembro@pataamiga.mx',
        params: [
            { key: 'userName', label: 'Nombre del Miembro', type: 'text', defaultValue: 'Jorge Cerna' },
            { key: 'petName', label: 'Nombre de la Mascota', type: 'text', defaultValue: 'Max' },
            { key: 'customMessage', label: 'Mensaje Personalizado del Admin', type: 'textarea', defaultValue: 'La foto de INE está borrosa, por favor sube una imagen clara de frente y reverso.' },
            {
                key: 'requestedTypes',
                label: 'Campos a Solicitar',
                type: 'checkbox_list',
                defaultValue: ['PET_PHOTO_1'],
                checklistItems: [
                    { type: 'PET_PHOTO_1', label: 'Foto Principal', icon: '📷', description: 'Una foto clara donde se vea bien su carita' },
                    { type: 'PET_VET_CERT', label: 'Certificado Médico', icon: '⚕️', description: 'Expedido por un médico veterinario certificado para mascotas senior' },
                    { type: 'OTHER_DOC', label: 'Documentación Adicional', icon: '📄', description: 'Cualquier otro documento que sea necesario aclarar (identificación, dirección)' }
                ]
            },
            { key: 'dashboardUrl', label: 'URL de Completar Documentos', type: 'text', defaultValue: 'https://club.pataamiga.mx/completar-documentacion' }
        ],
        render: ({ userName, petName, customMessage, requestedTypes, dashboardUrl }) => {
            const firstName = userName.split(' ')[0] || 'Miembro';
            const checklistItems = [
                { type: 'PET_PHOTO_1', label: 'Foto Principal', icon: '📷', description: 'Una foto clara donde se vea bien su carita' },
                { type: 'PET_VET_CERT', label: 'Certificado Médico', icon: '⚕️', description: 'Expedido por un médico veterinario certificado para mascotas senior' },
                { type: 'OTHER_DOC', label: 'Documentación Adicional', icon: '📄', description: 'Cualquier otro documento que sea necesario aclarar (identificación, dirección)' }
            ];

            const activeTypes = Array.isArray(requestedTypes) ? requestedTypes : [requestedTypes];
            const requestItemsHtml = checklistItems
                .filter(item => activeTypes.includes(item.type))
                .map(item => {
                    const bgColor = item.type === 'PET_PHOTO_1' ? '#FE8F15' :
                        item.type === 'PET_VET_CERT' ? '#7DD8D5' : '#A0AEC0';

                    return `<li style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
                        <span style="width:32px;height:32px;border-radius:50%;background:${bgColor};color:#fff;display:inline-block;text-align:center;line-height:32px;font-size:16px;flex-shrink:0;">${item.icon}</span>
                        <div>
                            <strong style="color:#2D3748;display:block;margin-bottom:2px;">${item.label}</strong>
                            <span style="color:#718096;font-size:13px;">${item.description}</span>
                        </div>
                    </li>`;
                }).join('');

            const customNote = customMessage
                ? `<div style="background:#F7FAFC;border-left:4px solid #FE8F15;padding:16px;border-radius:0 12px 12px 0;margin-bottom:28px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#FE8F15;text-transform:uppercase;">Mensaje del equipo</p>
                    <p style="margin:0;font-size:14px;color:#4A5568;line-height:1.6;">${customMessage}</p>
                   </div>`
                : '';

            return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Acción requerida</title></head><body style="margin:0;padding:0;background-color:#F7F8FA;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:40px 20px;"><tr><td align="center"><table width="100%" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#7DD8D5 0%,#00BBB4 100%);padding:36px 40px;text-align:center;"><img src="https://app.pataamiga.mx/Identidad/logo-pata-amiga-azul.png" alt="Club Pata Amiga" height="44" style="display:block;margin:0 auto 16px;"/><p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Acción requerida</p></td></tr><tr><td style="padding:40px 40px 24px;"><h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#2D3748;line-height:1.3;">Hola ${firstName}, necesitamos tu ayuda 🐾</h1><p style="margin:0 0 28px;font-size:16px;color:#4A5568;line-height:1.7;">Nuestro equipo ha revisado el expediente de <strong>${petName}</strong> y necesitamos que nos proporciones la siguiente información para continuar con la aprobación:</p><div style="background:#FFFBF5;border:1.5px solid #FEE4C4;border-radius:16px;padding:24px;margin-bottom:28px;"><p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#FE8F15;text-transform:uppercase;letter-spacing:0.5px;">Información solicitada</p><ul style="margin:0;padding:0;list-style:none;">${requestItemsHtml}</ul></div>${customNote}<div style="text-align:center;margin-bottom:28px;"><a href="${dashboardUrl}" style="display:inline-block;background:#FE8F15;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;border:2px solid #000000;box-shadow:0 4px 14px rgba(254,143,21,0.35);font-family:'Outfit',sans-serif;">Abrir mi expediente</a></div><p style="margin:0 0 8px;font-size:13px;color:#A0AEC0;text-align:center;line-height:1.6;">Si el botón no abre, usa este enlace seguro: <a href="${dashboardUrl}" style="color:#00BBB4;font-weight:600;text-decoration:none;">completar documentación</a></p><p style="margin:0;font-size:13px;color:#A0AEC0;text-align:center;line-height:1.6;">Si tienes dudas, responde este correo y con gusto te ayudamos.</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #EDF2F7;margin:0;"/></td></tr><tr><td style="padding:24px 40px 36px;text-align:center;"><p style="margin:0 0 8px;font-size:13px;color:#718096;">Con cariño, <strong style="color:#2D3748;">El equipo de Club Pata Amiga</strong></p></td></tr></table></td></tr></table></body></html>`;
        }
    },
    {
        id: 'member-termination',
        name: 'Aviso de Baja (Baja Admin)',
        icon: '🚫',
        description: 'Notifica al miembro que ha sido dado de baja del servicio debido a políticas internas o solicitud.',
        defaultSubject: 'Aviso de Baja de Membresía',
        defaultRecipient: 'miembro@pataamiga.mx',
        params: [
            { key: 'memberName', label: 'Nombre del Miembro', type: 'text', defaultValue: 'Jorge Cerna' },
            { key: 'reason', label: 'Motivo de la Baja', type: 'textarea', defaultValue: 'Falta de pago consecutivo o incumplimiento de documentación obligatoria.' }
        ],
        render: ({ memberName, reason }) => {
            const subject = 'Aviso de Baja de Membresía';
            const content = `Hola ${memberName},
            
Lamentamos informarte que tu membresía en Club Pata Amiga ha sido dada de baja debido al incumplimiento de nuestras políticas de uso.

${reason ? `Motivo de la baja: ${reason}` : ''}

Esta decisión implica la revocación inmediata de todos tus beneficios, servicios y coberturas asociadas a tu cuenta y a tus mascotas registradas.

Si consideras que esto es un error o deseas apelar esta decisión, por favor contáctanos respondiendo a este correo o a través de nuestros canales oficiales.`;

            return buildBrandedEmailHtml({
                memberName,
                subject,
                content,
                audience: 'general'
            });
        }
    }
];

// ----------------------------------------------------
// BASE EMAIL TEMPLATE PARA EMBAJADORES
// ----------------------------------------------------
function buildAmbassadorBaseHtml(params: { title: string; greeting: string; content: string; actionButton?: { text: string; url: string } }) {
    const { title, greeting, content, actionButton } = params;
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        
        .email-header {
            background: linear-gradient(135deg, #00BBB4 0%, #7DD8D5 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
        }
        
        .email-header .paw-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        .email-body {
            padding: 40px 30px;
            color: #2D3748;
            line-height: 1.6;
            font-size: 16px;
        }
        
        .email-body p {
            margin: 0 0 20px 0;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #00BBB4;
            margin-bottom: 20px;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #FFF9E6 0%, #FFF3E0 100%);
            border-left: 4px solid #FE8F15;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 12px 12px 0;
        }
        
        .code-box {
            background: #f7fafc;
            border: 2px dashed #00BBB4;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
            border-radius: 12px;
        }
        
        .code-box .code-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .code-box .code-value {
            font-family: 'Courier New', monospace;
            font-size: 32px;
            font-weight: 700;
            color: #2D3748;
            letter-spacing: 4px;
        }
        
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #FE8F15 0%, #F59E0B 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 25px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(254, 143, 21, 0.3);
        }
        
        .button-wrapper {
            text-align: center;
            margin: 30px 0;
        }
        
        .tips-list {
            background: #f7fafc;
            padding: 20px 25px;
            border-radius: 12px;
            margin: 20px 0;
        }
        
        .tips-list ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .tips-list li {
            margin-bottom: 8px;
            color: #4A5568;
        }
        
        .warning-box {
            background: #FFF5F5;
            border-left: 4px solid #E53E3E;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .warning-box strong {
            color: #C53030;
        }
        
        .email-footer {
            background: #2D3748;
            color: #A0AEC0;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
        
        .email-footer a {
            color: #7DD8D5;
            text-decoration: none;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #7DD8D5;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td class="email-header">
                <div class="paw-icon">🐾</div>
                <h1>${title}</h1>
            </td>
        </tr>
        <tr>
            <td class="email-body">
                <div class="greeting">${greeting}</div>
                ${content}
                ${actionButton ? `
                <div class="button-wrapper">
                    <a href="${actionButton.url}" class="action-button">${actionButton.text}</a>
                </div>
                ` : ''}
            </td>
        </tr>
        <tr>
            <td class="email-footer">
                <p>Con cariño,<br><strong style="color: #ffffff;">El equipo de Club Pata Amiga</strong></p>
                <p style="margin-top: 20px;">
                    <a href="https://www.pataamiga.mx">www.pataamiga.mx</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ----------------------------------------------------
// DEFINICIÓN DE CORREOS DE EMBAJADORES
// ----------------------------------------------------
const AMBASSADOR_TEMPLATES: Template[] = [
    {
        id: 'ambassador-approval',
        name: 'Aprobación de Embajador',
        icon: '🎯',
        description: 'Notifica al embajador que su cuenta ha sido aprobada y le provee el token para registrar su código.',
        defaultSubject: '¡Bienvenido a la manada, Embajador! 🐾',
        defaultRecipient: 'embajador@pataamiga.mx',
        params: [
            { key: 'name', label: 'Nombre del Embajador', type: 'text', defaultValue: 'Ana María' },
            { key: 'token', label: 'Token de Selección', type: 'text', defaultValue: 'abc-123-xyz-456' }
        ],
        render: ({ name, token }) => {
            const selectionUrl = `https://app.pataamiga.mx/embajadores/seleccionar-codigo?token=${token}`;
            const content = `
                <p>Tu solicitud para ser <strong>Embajador de Club Pata Amiga</strong> ha sido aprobada. ¡Estamos muy felices de tenerte con nosotros! 🎉</p>
                
                <div class="highlight-box">
                    <p style="margin: 0;"><strong>¿Qué sigue?</strong><br>
                    Ahora necesitas elegir tu <strong>código de embajador único</strong>. Este código te identificará y tus referidos lo usarán para obtener beneficios especiales al registrarse.</p>
                </div>
                
                <div class="tips-list">
                    <strong>Requisitos de tu código:</strong>
                    <ul>
                        <li>Debe tener entre <strong>2 y 8 caracteres</strong></li>
                        <li>Solo letras <strong>A-Z</strong> y números <strong>0-9</strong></li>
                        <li><strong>Sin O, I ni L</strong> para evitar confusiones</li>
                        <li>Una vez elegido, <strong>no podrás cambiarlo</strong></li>
                    </ul>
                </div>
                
                <p style="color: #718096; font-size: 14px;">Este enlace es válido por <strong>7 días</strong>. Una vez que elijas tu código, podrás acceder a tu dashboard de embajador y comenzar a compartirlo.</p>
            `;
            return buildAmbassadorBaseHtml({
                title: '¡Bienvenido a la manada!',
                greeting: `¡Hola ${name}!`,
                content,
                actionButton: { text: '🎯 Elegir mi código ahora', url: selectionUrl }
            });
        }
    },
    {
        id: 'ambassador-commission',
        name: 'Comisión Ganada',
        icon: '💰',
        description: 'Notifica al embajador que ha ganado una comisión por un referido aprobado.',
        defaultSubject: '¡Felicidades, has ganado una nueva comisión! 💰',
        defaultRecipient: 'embajador@pataamiga.mx',
        params: [
            { key: 'name', label: 'Nombre del Embajador', type: 'text', defaultValue: 'Ana María' },
            { key: 'referralName', label: 'Nombre del Referido', type: 'text', defaultValue: 'Carlos Gómez' },
            { key: 'amount', label: 'Monto Ganado (MXN)', type: 'text', defaultValue: '150.00' }
        ],
        render: ({ name, referralName, amount }) => {
            const formattedAmount = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(Number(amount) || 0);

            const content = `
                <p>¡Tenemos excelentes noticias! 🎉</p>
                
                <p>Tu referido <strong>${referralName}</strong> ha completado su registro y pago exitosamente.</p>
                
                <div class="highlight-box" style="text-align: center;">
                    <div class="code-label">COMISIÓN GANADA</div>
                    <div class="code-value" style="color: #FE8F15; font-size: 32px; font-weight: 700;">${formattedAmount}</div>
                </div>
                
                <p>Este monto ha sido sumado a tu <strong>saldo pendiente</strong> en tu dashboard de embajador.</p>
                
                <div class="tips-list">
                    <strong>¿Y ahora qué?</strong>
                    <ul>
                        <li>Puedes ver tu saldo actualizado en tu dashboard</li>
                        <li>Cuando alcances el monto mínimo, podrás solicitar tu retiro</li>
                        <li>¡Sigue compartiendo tu código para ganar más!</li>
                    </ul>
                </div>
                
                <p style="color: #00BBB4; font-weight: 600;">¡Sigue así, cada referido ayuda a más peludos! 🐾</p>
            `;
            return buildAmbassadorBaseHtml({
                title: '¡Nueva Comisión Ganada!',
                greeting: `¡Hola ${name}!`,
                content,
                actionButton: { text: '💰 Ver mi dashboard', url: 'https://www.pataamiga.mx/embajadores/dashboard' }
            });
        }
    },
    {
        id: 'ambassador-code-set',
        name: 'Código de Referido Listo',
        icon: '🚀',
        description: 'Confirmación al embajador tras registrar su código único y enlace oficial.',
        defaultSubject: '¡Tu código de embajador está listo! 🎉',
        defaultRecipient: 'embajador@pataamiga.mx',
        params: [
            { key: 'name', label: 'Nombre del Embajador', type: 'text', defaultValue: 'Ana María' },
            { key: 'referralCode', label: 'Código de Referido Creado', type: 'text', defaultValue: 'ANAPATA' }
        ],
        render: ({ name, referralCode }) => {
            const referralUrl = `https://www.pataamiga.mx?ref=${referralCode}`;
            const content = `
                <p>Has elegido exitosamente tu código de embajador. ¡Bienvenido oficialmente a la manada! 🐾</p>
                
                <div class="code-box">
                    <div class="code-label">TU CÓDIGO ÚNICO</div>
                    <div class="code-value" style="color: #00BBB4; font-size: 32px; font-weight: 700;">${referralCode}</div>
                </div>
                
                <p>Este código te identifica como <strong>Embajador de Club Pata Amiga</strong> y tus referidos lo usarán para obtener beneficios especiales al registrarse.</p>
                
                <div class="highlight-box">
                    <p style="margin: 0;"><strong>📌 Tu enlace de referido:</strong><br>
                    <a href="${referralUrl}" style="color: #00BBB4; word-break: break-all;">${referralUrl}</a></p>
                </div>
                
                <div class="tips-list">
                    <strong>Consejos para compartir:</strong>
                    <ul>
                        <li>Comparte tu código en tus redes sociales</li>
                        <li>Envíalo por WhatsApp a tus amigos</li>
                        <li>Cuéntales los beneficios de unirse a Club Pata Amiga</li>
                        <li>Usa el material promocional del dashboard</li>
                    </ul>
                </div>
            `;
            return buildAmbassadorBaseHtml({
                title: '¡Código Activado!',
                greeting: `¡Hola ${name}!`,
                content,
                actionButton: { text: '🚀 Ir a mi dashboard', url: 'https://www.pataamiga.mx/embajadores/dashboard' }
            });
        }
    },
    {
        id: 'ambassador-code-changed',
        name: 'Código de Referido Cambiado',
        icon: '🔄',
        description: 'Notifica al embajador que su código ha sido cambiado exitosamente por la administración.',
        defaultSubject: 'Tu código de embajador ha sido actualizado 🔄',
        defaultRecipient: 'embajador@pataamiga.mx',
        params: [
            { key: 'name', label: 'Nombre del Embajador', type: 'text', defaultValue: 'Ana María' },
            { key: 'oldCode', label: 'Código Anterior', type: 'text', defaultValue: 'ANAPATA' },
            { key: 'newCode', label: 'Código Nuevo', type: 'text', defaultValue: 'ANAMARIA' }
        ],
        render: ({ name, oldCode, newCode }) => {
            const newReferralUrl = `https://www.pataamiga.mx?ref=${newCode}`;
            const content = `
                <p>Tu código de embajador ha sido <strong>cambiado exitosamente</strong>. 🎉</p>
                
                <div style="display: flex; gap: 20px; justify-content: center; margin: 25px 0; flex-wrap: wrap;">
                    <div style="background: #e2e8f0; padding: 15px 25px; border-radius: 12px; text-align: center; opacity: 0.7;">
                        <div style="font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">ANTES</div>
                        <div style="font-family: monospace; font-size: 20px; font-weight: 700; color: #718096;">${oldCode}</div>
                    </div>
                    <div style="font-size: 24px; color: #00BBB4; align-self: center;">→</div>
                    <div style="background: linear-gradient(135deg, #00BBB4 0%, #7DD8D5 100%); padding: 15px 25px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 11px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">AHORA</div>
                        <div style="font-family: monospace; font-size: 20px; font-weight: 700; color: #ffffff;">${newCode}</div>
                    </div>
                </div>
                
                <div class="highlight-box">
                    <p style="margin: 0;"><strong>📌 Tu nuevo enlace de referido:</strong><br>
                    <a href="${newReferralUrl}" style="color: #00BBB4; word-break: break-all;">${newReferralUrl}</a></p>
                </div>
                
                <div class="warning-box">
                    <strong>⚠️ Importante:</strong>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">Este cambio <strong>solo se puede hacer una vez</strong>. Tu nuevo código es permanente y no podrá ser modificado nuevamente.</p>
                </div>
            `;
            return buildAmbassadorBaseHtml({
                title: 'Código Actualizado',
                greeting: `¡Hola ${name}!`,
                content,
                actionButton: { text: '📊 Ver mi dashboard', url: 'https://www.pataamiga.mx/embajadores/dashboard' }
            });
        }
    },
    {
        id: 'ambassador-change-enabled',
        name: 'Cambio de Código Habilitado',
        icon: '🔄',
        description: 'Notifica al embajador que tiene autorización para cambiar su código (un solo intento).',
        defaultSubject: 'Puedes cambiar tu código de embajador 🔄',
        defaultRecipient: 'embajador@pataamiga.mx',
        params: [
            { key: 'name', label: 'Nombre del Embajador', type: 'text', defaultValue: 'Ana María' },
            { key: 'currentCode', label: 'Código Actual', type: 'text', defaultValue: 'ANAPATA' },
            { key: 'changeToken', label: 'Token de Cambio', type: 'text', defaultValue: 'change-token-789' }
        ],
        render: ({ name, currentCode, changeToken }) => {
            const changeUrl = `https://app.pataamiga.mx/embajadores/cambiar-codigo?token=${changeToken}`;
            const content = `
                <p>Te informamos que ahora puedes <strong>cambiar tu código de embajador</strong>. 🎉</p>
                
                <div class="code-box" style="opacity: 0.8;">
                    <div class="code-label">CÓDIGO ACTUAL</div>
                    <div class="code-value" style="color: #718096; text-decoration: line-through; font-size: 32px; font-weight: 700;">${currentCode}</div>
                </div>
                
                <div class="highlight-box">
                    <p style="margin: 0;">Tienes la oportunidad de elegir un <strong>nuevo código</strong> que mejor represente tu marca personal. ¡Aprovéchala!</p>
                </div>
                
                <div class="tips-list">
                    <strong>Requisitos del nuevo código:</strong>
                    <ul>
                        <li>Entre <strong>2 y 8 caracteres</strong></li>
                        <li>Solo letras <strong>A-Z</strong> y números <strong>0-9</strong></li>
                        <li><strong>Sin O, I ni L</strong> para evitar confusiones</li>
                    </ul>
                </div>
            `;
            return buildAmbassadorBaseHtml({
                title: 'Cambio de Código Disponible',
                greeting: `¡Hola ${name}!`,
                content,
                actionButton: { text: '🔄 Cambiar mi código', url: changeUrl }
            });
        }
    }
];

// ----------------------------------------------------
// DEFINICIÓN DE CORREOS DE CENTROS DE BIENESTAR
// ----------------------------------------------------
const WELLNESS_TEMPLATES: Template[] = [
    {
        id: 'wellness-approval',
        name: 'Centro Aprobado',
        icon: '🏥',
        description: 'Notifica al Centro de Bienestar que su solicitud ha sido revisada y aprobada por la administración.',
        defaultSubject: '¡Solicitud Aprobada! Bienvenido a Club Pata Amiga 🏥',
        defaultRecipient: 'contacto@centroveterinario.mx',
        params: [
            { key: 'centerName', label: 'Nombre del Centro de Bienestar', type: 'text', defaultValue: 'Veterinaria El Peludo Feliz' },
            { key: 'adminNotes', label: 'Comentarios / Instrucciones del Admin', type: 'textarea', defaultValue: 'Tu documentación fue validada. Ya apareces en el directorio público y puedes recibir solicitudes de reembolso.' }
        ],
        render: ({ centerName, adminNotes }) => {
            const content = `Nos complace informarte que la solicitud para registrar al centro <strong>${centerName}</strong> en nuestra red aliada ha sido **APROBADA** con éxito. 🎉

Estamos sumamente contentos de contar con ustedes en la manada. Ya se encuentra activo su perfil dentro de nuestra base de datos.

${adminNotes ? `Notas adicionales del equipo de administración:\n${adminNotes}` : ''}

A partir de este momento, los tutores de mascotas podrán seleccionar su centro para realizar sus citas veterinarias y gestionar los reembolsos de su apoyo económico.`;

            return buildBrandedEmailHtml({
                memberName: centerName,
                subject: '¡Solicitud Aprobada! Bienvenido a Club Pata Amiga 🏥',
                content,
                audience: 'wellness-center'
            });
        }
    },
    {
        id: 'wellness-rejection',
        name: 'Centro Rechazado',
        icon: '❌',
        description: 'Informa al centro que su solicitud fue evaluada pero no califica o le falta algún documento.',
        defaultSubject: 'Actualización sobre tu solicitud de Centro de Bienestar',
        defaultRecipient: 'contacto@centroveterinario.mx',
        params: [
            { key: 'centerName', label: 'Nombre del Centro de Bienestar', type: 'text', defaultValue: 'Clínica Veterinaria San Francisco' },
            { key: 'adminNotes', label: 'Razón del Rechazo', type: 'textarea', defaultValue: 'El comprobante de cédula profesional del médico responsable no se encuentra vigente en el registro nacional.' }
        ],
        render: ({ centerName, adminNotes }) => {
            const content = `Queremos informarte que hemos evaluado la solicitud de registro del centro <strong>${centerName}</strong>.

Lamentablemente, en esta ocasión no hemos podido proceder con la aprobación de tu solicitud en la red de Centros de Bienestar Aliados.

${adminNotes ? `Motivo específico:\n${adminNotes}` : 'Si tienes dudas o deseas volver a postularte completando la información, por favor ponte en contacto con nosotros.'}

Valoramos tu interés en colaborar con nosotros y estamos a tu disposición ante cualquier duda.`;

            return buildBrandedEmailHtml({
                memberName: centerName,
                subject: 'Actualización sobre tu solicitud de Centro de Bienestar',
                content,
                audience: 'wellness-center'
            });
        }
    }
];

export default function EmailTemplatePreviewer() {
    const [activeCategory, setActiveCategory] = useState<CategoryType>('members');
    const [selectedTemplate, setSelectedTemplate] = useState<Template>(MEMBER_TEMPLATES[0]);
    const [formState, setFormState] = useState<Record<string, any>>({});
    const [viewportWidth, setViewportWidth] = useState<'desktop' | 'mobile'>('desktop');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Obtener las plantillas de la categoría activa
    const getTemplatesForCategory = (): Template[] => {
        switch (activeCategory) {
            case 'members': return MEMBER_TEMPLATES;
            case 'ambassadors': return AMBASSADOR_TEMPLATES;
            case 'wellness': return WELLNESS_TEMPLATES;
        }
    };

    // Resetear plantilla y formulario cuando cambia la categoría
    const handleCategoryChange = (category: CategoryType) => {
        setActiveCategory(category);
        const templates = category === 'members' ? MEMBER_TEMPLATES :
                          category === 'ambassadors' ? AMBASSADOR_TEMPLATES : WELLNESS_TEMPLATES;
        handleTemplateChange(templates[0]);
    };

    // Cargar parámetros por defecto al seleccionar plantilla
    const handleTemplateChange = (template: Template) => {
        setSelectedTemplate(template);
        const initialState: Record<string, any> = {};
        template.params.forEach(p => {
            initialState[p.key] = p.defaultValue;
        });
        setFormState(initialState);
    };

    // Inicializar la primera plantilla en el primer render
    useEffect(() => {
        handleTemplateChange(MEMBER_TEMPLATES[0]);
    }, []);

    // Actualizar el contenido del iframe cada vez que cambien los parámetros o la plantilla
    useEffect(() => {
        if (!iframeRef.current || !selectedTemplate) return;

        try {
            const html = selectedTemplate.render(formState);
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.close();
            }
        } catch (error) {
            console.error('Error rendering template preview:', error);
        }
    }, [selectedTemplate, formState]);

    const handleInputChange = (key: string, value: any) => {
        setFormState(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleCheckboxListChange = (key: string, type: string, checked: boolean) => {
        setFormState(prev => {
            const currentList = Array.isArray(prev[key]) ? prev[key] : [];
            const updatedList = checked
                ? [...currentList, type]
                : currentList.filter((t: string) => t !== type);
            return {
                ...prev,
                [key]: updatedList
            };
        });
    };

    // Renderizar un input basado en su tipo de parámetro
    const renderParamInput = (param: Template['params'][number]) => {
        const value = formState[param.key];

        switch (param.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        className={styles.formInput}
                        value={value || ''}
                        onChange={(e) => handleInputChange(param.key, e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        className={styles.formTextarea}
                        value={value || ''}
                        onChange={(e) => handleInputChange(param.key, e.target.value)}
                    />
                );
            case 'select':
                return (
                    <select
                        className={styles.formSelect}
                        value={value || ''}
                        onChange={(e) => handleInputChange(param.key, e.target.value)}
                    >
                        {param.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'checkbox_list':
                const selectedItems = Array.isArray(value) ? value : [];
                return (
                    <div className={styles.checkboxGroup}>
                        {param.checklistItems?.map(item => (
                            <label key={item.type} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.type)}
                                    onChange={(e) => handleCheckboxListChange(param.key, item.type, e.target.checked)}
                                />
                                <span>{item.icon} {item.label}</span>
                            </label>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.previewerContainer}>
            {/* Panel Izquierdo: Controles */}
            <div className={styles.controlsPanel}>
                <h2 className={styles.sectionTitle}>📋 Configuración de Plantilla</h2>
                
                {/* Selector de categoría */}
                <div className={styles.categoryTabs}>
                    <button
                        className={`${styles.categoryTab} ${activeCategory === 'members' ? styles.active : ''}`}
                        onClick={() => handleCategoryChange('members')}
                    >
                        Miembros
                    </button>
                    <button
                        className={`${styles.categoryTab} ${activeCategory === 'ambassadors' ? styles.active : ''}`}
                        onClick={() => handleCategoryChange('ambassadors')}
                    >
                        Embajadores
                    </button>
                    <button
                        className={`${styles.categoryTab} ${activeCategory === 'wellness' ? styles.active : ''}`}
                        onClick={() => handleCategoryChange('wellness')}
                    >
                        Centros
                    </button>
                </div>

                {/* Listado de plantillas de la categoría activa */}
                <div className={styles.templateList}>
                    {getTemplatesForCategory().map(template => (
                        <button
                            key={template.id}
                            className={`${styles.templateButton} ${selectedTemplate?.id === template.id ? styles.active : ''}`}
                            onClick={() => handleTemplateChange(template)}
                        >
                            <span className={styles.templateIcon}>{template.icon}</span>
                            <span>{template.name}</span>
                        </button>
                    ))}
                </div>

                {/* Formulario de variables dinámicas */}
                <div className={styles.parametersForm}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                        {selectedTemplate?.description}
                    </p>
                    {selectedTemplate?.params.map(param => (
                        <div key={param.key} className={styles.formGroup}>
                            <label>{param.label}</label>
                            {renderParamInput(param)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel Derecho: Iframe Viewport */}
            <div className={styles.previewPanel}>
                <div className={styles.previewHeader}>
                    <div className={styles.previewMeta}>
                        <span className={styles.previewSubject}>
                            <strong>Asunto:</strong> {selectedTemplate?.defaultSubject.replace(/{([^{}]+)}/g, (match, key) => formState[key] || match)}
                        </span>
                        <span className={styles.previewRecipient}>
                            <strong>Para:</strong> {selectedTemplate?.defaultRecipient}
                        </span>
                    </div>

                    <div className={styles.viewportToggles}>
                        <button
                            className={`${styles.viewportButton} ${viewportWidth === 'desktop' ? styles.active : ''}`}
                            onClick={() => setViewportWidth('desktop')}
                        >
                            🖥️ Escritorio
                        </button>
                        <button
                            className={`${styles.viewportButton} ${viewportWidth === 'mobile' ? styles.active : ''}`}
                            onClick={() => setViewportWidth('mobile')}
                        >
                            📱 Móvil
                        </button>
                    </div>
                </div>

                {/* FrameWrapper con el Iframe renderizado en vivo */}
                <div className={styles.iframeWrapper}>
                    <iframe
                        ref={iframeRef}
                        className={styles.previewIframe}
                        style={{ width: viewportWidth === 'desktop' ? '100%' : '375px' }}
                        title="Email Live Preview"
                    />
                </div>
            </div>
        </div>
    );
}
