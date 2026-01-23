'use server';

import { sendAdminEmail } from './comm.actions';

/**
 * Acciones para notificaciones específicas de Embajadores
 */

/**
 * Notifica al embajador que su cuenta ha sido aprobada
 */
export async function notifyAmbassadorApproval(params: {
    userId: string;
    email: string;
    name: string;
    referralCode: string;
}) {
    const { userId, email, name, referralCode } = params;

    const subject = '¡Bienvenido a la manada, Embajador! 🐾';
    const content = `¡Hola ${name}! 

Tu solicitud para ser embajador de Club Pata Amiga ha sido aprobada. ¡Estamos muy felices de tenerte con nosotros!

Ya puedes acceder a tu dashboard de embajador para ver tus estadísticas y compartir tu código de referido.

Tu código único es: **${referralCode}**

Accede aquí: https://clubpataamiga.com/dashboard-embajadores (asegúrate de haber iniciado sesión con tu cuenta).

¡Mucho éxito compartiendo el amor por los peludos!
`;

    return await sendAdminEmail({
        userId,
        to: email,
        subject,
        content,
        metadata: { type: 'ambassador_approval', referralCode }
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
