import React from 'react';
import NotificationsList from './NotificationsList';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notificaciones | Club Pata Amiga',
    description: 'Buzón de notificaciones y mensajes de Club Pata Amiga',
};

export default function NotificacionesPage({
    searchParams,
}: {
    searchParams: { userId?: string };
}) {
    // En producción esto vendría de la sesión de Memberstack, 
    // pero permitimos pasar un userId para pruebas o integración simple.
    const userId = searchParams.userId || '';

    return (
        <main className="min-h-screen pt-20">
            <NotificationsList userId={userId} />
        </main>
    );
}
