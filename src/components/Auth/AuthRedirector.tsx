'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirector() {
    const router = useRouter();

    React.useEffect(() => {
        const checkSession = async () => {
            let attempts = 0;
            // Esperar activamente a Memberstack (hasta 3s)
            // IMPORTANTE: Asegurarse de que en Memberstack Dashboard -> Settings -> Domains
            // esté configurado "pataamiga.mx" (sin www ni app) para que las cookies se compartan.
            while (!window.$memberstackDom && attempts < 15) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (window.$memberstackDom) {
                try {
                    const { data: member } = await window.$memberstackDom.getCurrentMember();

                    if (member && member.id) {
                        console.log('✅ Usuario detectado en root, verificando rol...', member.id);

                        try {
                            const res = await fetch('/api/auth/check-role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ memberstackId: member.id })
                            });

                            if (!res.ok) throw new Error('Error en API check-role');

                            const data = await res.json();

                            if (data.role === 'admin') {
                                console.log('🛡️ Es Admin, redirigiendo a panel administrativo...');
                                window.location.href = 'https://app.pataamiga.mx/admin/dashboard';
                            } else if (data.role === 'ambassador') {
                                console.log('👤 Es embajador, redirigiendo a su dashboard...');
                                console.log('👤 Es embajador, redirigiendo a su dashboard...');
                                window.location.href = 'https://www.pataamiga.mx/embajadores/dashboard';
                            } else {
                                console.log('🐾 Es miembro, redirigiendo a dashboard de usuario...');
                                console.log('🐾 Es miembro, redirigiendo a dashboard de usuario...');
                                window.location.href = 'https://www.pataamiga.mx/pets/pet-waiting-period';
                            }
                        } catch (err) {
                            console.error('Error checando rol o API fallo, asumiendo miembro normal:', err);
                            // Fallback seguro: si hay sesión pero falló el rol, mandar a dashboard de miembro
                            // Fallback seguro: si hay sesión pero falló el rol, mandar a dashboard de miembro
                            window.location.href = 'https://www.pataamiga.mx/pets/pet-waiting-period';
                        }
                    } else {
                        console.log('❌ No hay sesión activa, redirigiendo a Login/Registro...');
                        const target = window.location.hostname === 'localhost' ? '/completar-perfil' : 'https://app.pataamiga.mx/usuarios/registro';
                        window.location.href = target;
                    }
                } catch (e) {
                    console.log('Error chequeando sesión con Memberstack:', e);
                    // Fallback final
                    const target = window.location.hostname === 'localhost' ? '/completar-perfil' : 'https://app.pataamiga.mx/usuarios/registro';
                    window.location.href = target;
                }
            } else {
                console.log('⚠️ Memberstack no cargó a tiempo, redirigiendo a registro...');
                const target = window.location.hostname === 'localhost' ? '/completar-perfil' : 'https://app.pataamiga.mx/usuarios/registro';
                window.location.href = target;
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
