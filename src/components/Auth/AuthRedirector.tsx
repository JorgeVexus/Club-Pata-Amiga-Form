'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirector() {
    const router = useRouter();

    React.useEffect(() => {
        const checkSession = async () => {
            // Pequeño delay para UX (opcional)
            await new Promise(resolve => setTimeout(resolve, 800));

            if (window.$memberstackDom) {
                try {
                    const { data: member } = await window.$memberstackDom.getCurrentMember();
                    if (member) {
                        console.log('✅ Usuario detectado, verificando rol...');

                        try {
                            const res = await fetch('/api/auth/check-role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ memberstackId: member.id })
                            });
                            const data = await res.json();

                            if (data.role === 'admin') {
                                console.log('🛡️ Es Admin, redirigiendo a panel administrativo...');
                                window.location.href = '/admin/dashboard';
                            } else if (data.role === 'ambassador') {
                                console.log('👤 Es embajador, redirigiendo a su dashboard...');
                                window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/embajadores/embajadores';
                            } else {
                                console.log('🐾 Es miembro, redirigiendo a dashboard de usuario...');
                                window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/pets/pet-waiting-period';
                            }
                        } catch (err) {
                            console.error('Error checando rol, fallback a default');
                            window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/pets/pet-waiting-period';
                        }
                    } else {
                        console.log('❌ No hay sesión, redirigiendo a Landing Webflow...');
                        window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/';
                    }
                } catch (e) {
                    console.log('Error chequeando sesión:', e);
                    // Fallback
                    window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/';
                }
            } else {
                console.log('Memberstack no cargado aun...');
                // Podríamos esperar o redirigir
            }
        };
        checkSession();
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#f8f9fa',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e0e0e0',
                borderTopColor: '#00BBB4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#666', fontSize: '1.1rem' }}>Iniciando sesión...</p>
            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
