'use server';

import { sendAdminEmail } from './comm.actions';

/**
 * Acciones para notificaciones específicas de Embajadores
 */

// ============================================
// PLANTILLA HTML BASE CON ESTILOS DE MARCA
// ============================================
function createEmailTemplate(params: {
    title: string;
    greeting: string;
    content: string;
    actionButton?: { text: string; url: string };
    footer?: string;
}): { text: string; html: string } {
    const { title, greeting, content, actionButton, footer } = params;

    // Versión texto plano
    const textVersion = `${title}

${greeting}

${content.replace(/<[^>]*>/g, '')}

${actionButton ? `${actionButton.text}: ${actionButton.url}` : ''}

${footer || "---\nClub Pata Amiga 🐾\nhttps://clubpataamiga.com"}`;

    // Versión HTML con diseño de marca
    const htmlVersion = `<!DOCTYPE html>
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
            margin: 0 auto;
            background: #ffffff;
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
        
        .action-button:hover {
            background: linear-gradient(135deg, #e88213 0%, #d97706 100%);
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
        
        @media only screen and (max-width: 600px) {
            .email-header {
                padding: 30px 20px;
            }
            
            .email-header h1 {
                font-size: 24px;
            }
            
            .email-body {
                padding: 30px 20px;
            }
            
            .code-box .code-value {
                font-size: 24px;
            }
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
                <p>${footer || 'Con cariño,<br><strong style="color: #ffffff;">El equipo de Club Pata Amiga</strong>'}</p>
                <p style="margin-top: 20px;">
                    <a href="https://clubpataamiga.com">clubpataamiga.com</a>
                </p>
                <div class="social-links">
                    <a href="#">Instagram</a> • <a href="#">Facebook</a> • <a href="#">TikTok</a>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return { text: textVersion, html: htmlVersion };
}

/**
 * Notifica al embajador que su cuenta ha sido aprobada
 * Incluye link para elegir el código de referido
 */
export async function notifyAmbassadorApproval(params: {
    userId: string;
    email: string;
    name: string;
    selectionToken: string;
}) {
    const { userId, email, name, selectionToken } = params;

    const selectionUrl = `https://clubpataamiga.com/embajadores/seleccionar-codigo?token=${selectionToken}`;

    const subject = '¡Bienvenido a la manada, Embajador! 🐾';
    
    const emailContent = createEmailTemplate({
        title: '¡Bienvenido a la manada!',
        greeting: `¡Hola ${name}!`,
        content: `
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
        `,
        actionButton: { text: '🎯 Elegir mi código ahora', url: selectionUrl },
    });

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content: emailContent.text,
        html: emailContent.html,
        metadata: { type: 'ambassador_approval', selectionUrl }
    });
}

/**
 * Notifica al embajador que ha ganado una comisión por un referido aprobado
 */
export async function notifyCommissionEarned(params: {
    userId: string;
    email: string;
    name: string;
    referralName: string;
    amount: number;
}) {
    const { userId, email, name, referralName, amount } = params;

    const subject = '¡Felicidades, has ganado una nueva comisión! 💰';
    
    const formattedAmount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);

    const emailContent = createEmailTemplate({
        title: '¡Nueva Comisión Ganada!',
        greeting: `¡Hola ${name}!`,
        content: `
            <p>¡Tenemos excelentes noticias! 🎉</p>
            
            <p>Tu referido <strong>${referralName}</strong> ha completado su registro y pago exitosamente.</p>
            
            <div class="highlight-box" style="text-align: center;">
                <div class="code-label">COMISIÓN GANADA</div>
                <div class="code-value" style="color: #FE8F15;">${formattedAmount}</div>
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
        `,
        actionButton: { text: '💰 Ver mi dashboard', url: 'https://clubpataamiga.com/dashboard-embajadores' },
    });

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content: emailContent.text,
        html: emailContent.html,
        metadata: { type: 'commission_earned', referralName, amount }
    });
}

/**
 * Notifica al embajador que ha establecido su código de referido
 */
export async function notifyAmbassadorReferralCodeSet(params: {
    userId: string;
    email: string;
    name: string;
    referralCode: string;
}) {
    const { userId, email, name, referralCode } = params;

    const subject = '¡Tu código de embajador está listo! 🎉';
    const referralUrl = `https://clubpataamiga.com?ref=${referralCode}`;
    
    const emailContent = createEmailTemplate({
        title: '¡Código Activado!',
        greeting: `¡Hola ${name}!`,
        content: `
            <p>Has elegido exitosamente tu código de embajador. ¡Bienvenido oficialmente a la manada! 🐾</p>
            
            <div class="code-box">
                <div class="code-label">TU CÓDIGO ÚNICO</div>
                <div class="code-value" style="color: #00BBB4;">${referralCode}</div>
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
            
            <p style="color: #00BBB4; font-weight: 600;">¡Mucho éxito compartiendo el amor por los peludos! 🐕🐱</p>
        `,
        actionButton: { text: '🚀 Ir a mi dashboard', url: 'https://clubpataamiga.com/dashboard-embajadores' },
    });

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content: emailContent.text,
        html: emailContent.html,
        metadata: { type: 'referral_code_set', referralCode }
    });
}

/**
 * Notifica al embajador que su código ha sido cambiado
 */
export async function notifyAmbassadorReferralCodeChanged(params: {
    userId: string;
    email: string;
    name: string;
    oldCode: string;
    newCode: string;
}) {
    const { userId, email, name, oldCode, newCode } = params;

    const subject = 'Tu código de embajador ha sido actualizado 🔄';
    const newReferralUrl = `https://clubpataamiga.com?ref=${newCode}`;
    
    const emailContent = createEmailTemplate({
        title: 'Código Actualizado',
        greeting: `¡Hola ${name}!`,
        content: `
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
            
            <div class="tips-list">
                <strong>⚡ Acciones recomendadas:</strong>
                <ul>
                    <li>Actualiza tu código en todas tus redes sociales</li>
                    <li>Notifica a tus contactos sobre el cambio</li>
                    <li>Los enlaces antiguos ya no funcionarán</li>
                </ul>
            </div>
            
            <p style="color: #00BBB4; font-weight: 600;">¡Sigue compartiendo y ganando comisiones! 🚀</p>
        `,
        actionButton: { text: '📊 Ver mi dashboard', url: 'https://clubpataamiga.com/dashboard-embajadores' },
    });

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content: emailContent.text,
        html: emailContent.html,
        metadata: { type: 'referral_code_changed', oldCode, newCode }
    });
}

/**
 * Notifica al embajador que puede cambiar su código
 */
export async function notifyAmbassadorCodeChangeEnabled(params: {
    userId: string;
    email: string;
    name: string;
    currentCode: string;
    changeToken: string;
}) {
    const { userId, email, name, currentCode, changeToken } = params;

    const changeUrl = `https://clubpataamiga.com/embajadores/cambiar-codigo?token=${changeToken}`;

    const subject = 'Puedes cambiar tu código de embajador 🔄';
    
    const emailContent = createEmailTemplate({
        title: 'Cambio de Código Disponible',
        greeting: `¡Hola ${name}!`,
        content: `
            <p>Te informamos que ahora puedes <strong>cambiar tu código de embajador</strong>. 🎉</p>
            
            <div class="code-box" style="opacity: 0.8;">
                <div class="code-label">CÓDIGO ACTUAL</div>
                <div class="code-value" style="color: #718096; text-decoration: line-through;">${currentCode}</div>
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
            
            <div class="warning-box">
                <strong>⚠️ Esto solo se puede hacer UNA VEZ</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
                    <li>Tu código actual dejará de funcionar inmediatamente</li>
                    <li>El nuevo código será <strong>permanente</strong></li>
                    <li>Este enlace es válido por <strong>7 días</strong></li>
                </ul>
            </div>
            
            <p style="color: #00BBB4; font-weight: 600;">¡Elige sabiamente! 🎯</p>
        `,
        actionButton: { text: '🔄 Cambiar mi código', url: changeUrl },
    });

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content: emailContent.text,
        html: emailContent.html,
        metadata: { type: 'code_change_enabled', changeUrl }
    });
}
