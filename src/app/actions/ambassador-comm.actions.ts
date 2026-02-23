'use server';

import { sendAdminEmail } from './comm.actions';

/**
 * Acciones para notificaciones específicas de Embajadores
 */

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
    const content = `¡Hola ${name}! 

Tu solicitud para ser embajador de Club Pata Amiga ha sido aprobada. ¡Estamos muy felices de tenerte con nosotros!

Ahora necesitas elegir tu código de embajador único. Este código te identificará y tus referidos lo usarán para obtener beneficios especiales.

👉 **Elige tu código aquí:** ${selectionUrl}

Este enlace es válido por 7 días. Una vez que elijas tu código, podrás acceder a tu dashboard de embajador y comenzar a compartirlo.

Recuerda:
• Tu código debe tener entre 2 y 8 caracteres
• Solo puedes usar letras (A-Z) y números (0-9)
• No se permiten O, I ni L para evitar confusiones
• Una vez elegido, no podrás cambiarlo

¡Mucho éxito compartiendo el amor por los peludos!
`;

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content,
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
    const content = `¡Hola ${name}! 

Excelentes noticias: tu referido **${referralName}** ha completado su registro y pago exitosamente.

Como resultado, has ganado una comisión de: **$${amount.toFixed(2)} MXN**

Este monto ya ha sido sumado a tu saldo pendiente en tu dashboard de embajador. Puedes solicitar tu retiro en cuanto alcances el monto mínimo.

¡Sigue así, cada referido ayuda a más peludos!
`;

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content,
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
    const content = `¡Hola ${name}! 

Has elegido tu código de embajador: **${referralCode}**

Este código es único y te identificará como embajador de Club Pata Amiga. Compártelo con tus amigos y conocidos para que obtengan beneficios especiales al registrarse.

📌 Tu enlace de referido: https://clubpataamiga.com?ref=${referralCode}

Recuerda:
• Por cada persona que se registre usando tu código, ganarás comisiones
• Puedes ver tus estadísticas en tu dashboard de embajador
• El código no puede ser modificado una vez establecido

¡Mucho éxito compartiendo!
`;

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content,
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
    const content = `¡Hola ${name}! 

Tu código de embajador ha sido cambiado exitosamente.

📌 Código anterior: **${oldCode}**
📌 Nuevo código: **${newCode}**

Tu nuevo enlace de referido: https://clubpataamiga.com?ref=${newCode}

⚠️ **Importante:** Este cambio solo se puede hacer una vez. Tu nuevo código es permanente y no podrá ser modificado nuevamente.

Asegúrate de actualizar cualquier lugar donde hayas compartido tu código anterior.

¡Sigue compartiendo y ganando comisiones!
`;

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content,
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
    const content = `¡Hola ${name}! 

Te informamos que ahora puedes cambiar tu código de embajador.

📌 Código actual: **${currentCode}**

👉 **Cambiar tu código aquí:** ${changeUrl}

**Importante:**
• Este cambio solo se puede hacer **UNA VEZ**
• Tu código actual dejará de funcionar inmediatamente después del cambio
• El nuevo código será permanente y no podrás modificarlo nuevamente
• Este enlace es válido por 7 días

Recuerda que tu código debe:
• Tener entre 2 y 8 caracteres
• Usar solo letras (A-Z) y números (0-9)
• No usar O, I ni L para evitar confusiones

¡Elige sabiamente!
`;

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content,
        metadata: { type: 'code_change_enabled', changeUrl }
    });
}
