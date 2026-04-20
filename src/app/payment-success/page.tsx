'use client';

import { useEffect } from 'react';

export default function PaymentSuccessRedirect() {
    useEffect(() => {
        // Redirigir de vuelta al flujo de registro con el parámetro de éxito
        // Añadimos un pequeño delay de 1.5s para que el usuario pueda ver el mensaje de éxito
        const timer = setTimeout(() => {
            window.location.href = '/registro?payment=success';
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: "'Outfit', sans-serif",
            background: '#f5f5f5',
        }}>
            <div style={{
                textAlign: 'center',
                background: 'white',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h1 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem' }}>
                    ¡Pago exitoso!
                </h1>
                <p style={{ color: '#888' }}>Redirigiendo para completar tu registro...</p>
            </div>
        </div>
    );
}
