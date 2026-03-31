/**
 * Página de registro - MODO DEMO
 * 
 * Usa NewRegistrationFlow.demo.tsx para funcionar sin dependencias externas.
 * 
 * Para cambiar a modo producción:
 * 1. Cambiar el import de abajo a NewRegistrationFlow
 * 2. Asegurar que variables de entorno estén configuradas
 * 3. Ejecutar migraciones de Supabase
 */

import { Suspense } from 'react';
import NewRegistrationFlow from '@/components/RegistrationV2/NewRegistrationFlow';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Registro de Membresía - Pata Amiga',
    description: 'Únete a la red de protección veterinaria más grande de México. Registra a tu mascota y obtén beneficios exclusivos.',
};

export default function RegistroPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Outfit, sans-serif',
                background: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #E0F7F6',
                        borderTopColor: '#00BBB4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 15px'
                    }}></div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#666' }}>Iniciando registro...</p>
                </div>
            </div>
        }>
            <NewRegistrationFlow />
        </Suspense>
    );
}
