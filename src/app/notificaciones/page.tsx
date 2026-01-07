import React from 'react';
import NotificationsList from './NotificationsList';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notificaciones | Club Pata Amiga',
    description: 'Buzón de notificaciones y mensajes de Club Pata Amiga',
};

export default async function NotificacionesPage({
    searchParams,
}: {
    searchParams: Promise<{ userId?: string }>;
}) {
    // En producción esto vendría de la sesión de Memberstack, 
    // pero permitimos pasar un userId para pruebas o integración simple.
    const resolvedParams = await searchParams;
    const userId = resolvedParams.userId || '';

    return (
        <main className="min-h-screen pt-20">
            <NotificationsList userId={userId} />
        </main>
    );
}
