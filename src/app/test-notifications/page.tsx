/**
 * Página de Prueba para el Sistema de Notificaciones
 * URL: /test-notifications
 */

'use client';

import { useState } from 'react';
import { NotificationBell } from '@/components/Notifications';

export default function TestNotificationsPage() {
    // ID de prueba (puedes usar uno real de Memberstack si quieres)
    const [userId, setUserId] = useState('mem_test_123');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Función para crear una notificación de prueba
    const createTestNotification = async (type: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    type,
                    title: `Notificación de ${type}`,
                    message: `Este es un mensaje de prueba para el tipo ${type}. Creado el ${new Date().toLocaleTimeString()}.`,
                    link: '/admin',
                    metadata: { test: true }
                })
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            setResult({ error: 'Fallo al conectar con la API' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #00BBB4', paddingBottom: '20px' }}>
                <h1>🧪 Test de Notificaciones</h1>
                {/* Aquñi renderizamos la campanita */}
                <NotificationBell userId={userId} />
            </div>

            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
                <h3>1. Configuración de Usuario</h3>
                <label>
                    User ID (Memberstack):
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        style={{ marginLeft: '10px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3>2. Generar Notificaciones de Prueba</h3>
                <p>Haz clic en los botones para disparar notificaciones automáticas:</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => createTestNotification('account')} disabled={isLoading} style={btnStyle('#00BBB4')}>🎉 Cuenta Aprobada</button>
                    <button onClick={() => createTestNotification('document')} disabled={isLoading} style={btnStyle('#FE8F15')}>📄 Falta Documento</button>
                    <button onClick={() => createTestNotification('waiting_period')} disabled={isLoading} style={btnStyle('#444')}>⏰ Carencia terminada</button>
                    <button onClick={() => createTestNotification('announcement')} disabled={isLoading} style={btnStyle('#2196F3')}>📢 Anuncio General</button>
                </div>
            </div>

            {result && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#e8faf9', borderRadius: '8px', border: '1px solid #00BBB4' }}>
                    <pre style={{ fontSize: '12px', margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}

            <div style={{ marginTop: '50px', padding: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
                <h4>💡 Instrucciones para Probar:</h4>
                <ol>
                    <li>Cambia el User ID si quieres probar con un usuario real.</li>
                    <li>Haz clic en los botones de colores para crear notificaciones.</li>
                    <li>Mira cómo aparece el <b>badge rojo</b> en la campanita arriba a la derecha.</li>
                    <li>Haz clic en la campanita para ver el dropdown y marcar como leídas.</li>
                </ol>
            </div>
        </div>
    );
}

const btnStyle = (color: string) => ({
    padding: '10px 16px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold'
});
