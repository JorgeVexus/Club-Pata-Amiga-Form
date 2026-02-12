'use client';

import { useEffect } from 'react';

export default function PaymentSuccessRedirect() {
    useEffect(() => {
        // Redirect to Webflow login page with success parameter
        window.location.href = 'https://www.pataamiga.mx/user/inicio-de-sesion?payment=success';
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
                <p style={{ color: '#888' }}>Redirigiendo al inicio de sesión...</p>
            </div>
        </div>
    );
}
