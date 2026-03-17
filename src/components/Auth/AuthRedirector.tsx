'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirector() {
    const router = useRouter();
    const [status, setStatus] = React.useState<'checking' | 'logged-in' | 'not-logged-in' | 'error'>('checking');
    const [redirectUrl, setRedirectUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        const checkSession = async () => {
            console.log('🔍 [AuthRedirector] Iniciando verificación de sesión...');
            
            let attempts = 0;
            const maxAttempts = 30; // 6 segundos máximo
            
            // Esperar activamente a Memberstack
            while (!window.$memberstackDom && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (!window.$memberstackDom) {
                console.log('⚠️ [AuthRedirector] Memberstack no cargó después de 6s');
                setStatus('not-logged-in');
                return;
            }

            console.log('✅ [AuthRedirector] Memberstack cargado, verificando sesión...');

            try {
                const { data: member } = await window.$memberstackDom.getCurrentMember();

                if (member && member.id) {
                    console.log('✅ [AuthRedirector] Sesión detectada:', member.auth?.email);
                    console.log('📝 [AuthRedirector] Member data:', JSON.stringify({
                        id: member.id,
                        email: member.auth?.email,
                        customFields: member.customFields,
                        hasPostalCode: !!member.customFields?.['postal-code'],
                        postalCodeValue: member.customFields?.['postal-code']
                    }, null, 2));

                    // Verificar si el usuario ya completó su perfil (tiene postal-code con valor real)
                    // Nota: Usamos postal-code porque Google NO lo proporciona, a diferencia de first-name
                    const postalCodeValue = member.customFields?.['postal-code'];
                    const hasCompletedProfile = !!(postalCodeValue && postalCodeValue.trim() !== '');
                    
                    console.log(`🔍 [AuthRedirector] Verificación de perfil: hasCompletedProfile=${hasCompletedProfile}`);
                    
                    if (!hasCompletedProfile) {
                        console.log('📝 [AuthRedirector] Usuario sin perfil completo, redirigiendo a /registro');
                        window.location.href = 'https://app.pataamiga.mx/registro';
                        return;
                    }

                    try {
                        const res = await fetch('/api/auth/check-role', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ memberstackId: member.id })
                        });

                        if (!res.ok) throw new Error('Error en API check-role');

                        const data = await res.json();
                        
                        let url: string;
                        if (data.role === 'admin') {
                            console.log('🛡️ [AuthRedirector] Es Admin');
                            url = 'https://app.pataamiga.mx/admin/dashboard';
                        } else if (data.role === 'ambassador') {
                            console.log('👤 [AuthRedirector] Es Embajador');
                            url = 'https://www.pataamiga.mx/embajadores/dashboard';
                        } else {
                            console.log('🐾 [AuthRedirector] Es Miembro');
                            url = 'https://www.pataamiga.mx/pets/pet-waiting-period';
                        }
                        
                        setRedirectUrl(url);
                        setStatus('logged-in');
                        
                        // Redirigir automáticamente después de 1 segundo
                        setTimeout(() => {
                            window.location.href = url;
                        }, 1000);

                    } catch (err) {
                        console.error('❌ [AuthRedirector] Error checando rol:', err);
                        setStatus('error');
                    }
                } else {
                    console.log('❌ [AuthRedirector] No hay sesión activa');
                    setStatus('not-logged-in');
                }
            } catch (e) {
                console.error('❌ [AuthRedirector] Error chequeando sesión:', e);
                setStatus('error');
            }
        };
        
        checkSession();
    }, []);

    // Renderizar según el estado
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#f8f9fa',
            fontFamily: 'sans-serif',
            padding: '20px',
            textAlign: 'center'
        }}>
            {/* Verificando sesión */}
            {status === 'checking' && (
                <>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid #e0e0e0',
                        borderTopColor: '#00BBB4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <h2 style={{ color: '#333', margin: '0' }}>Verificando tu sesión...</h2>
                    <p style={{ color: '#666', margin: '0' }}>Por favor espera un momento</p>
                    <style jsx>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </>
            )}

            {/* Sesión detectada - redirigiendo */}
            {status === 'logged-in' && redirectUrl && (
                <>
                    <div style={{ fontSize: '60px' }}>🎉</div>
                    <h2 style={{ color: '#333', margin: '0' }}>¡Bienvenido de vuelta!</h2>
                    <p style={{ color: '#666', margin: '0' }}>Redirigiendo a tu dashboard...</p>
                    <a 
                        href={redirectUrl}
                        style={{
                            padding: '12px 30px',
                            backgroundColor: '#00BBB4',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '25px',
                            fontWeight: 'bold',
                            marginTop: '10px'
                        }}
                    >
                        Ir a mi Dashboard →
                    </a>
                </>
            )}

            {/* No hay sesión - mostrar opciones */}
            {status === 'not-logged-in' && (
                <>
                    <div style={{ fontSize: '60px' }}>🔐</div>
                    <h2 style={{ color: '#333', margin: '0' }}>Inicia sesión para continuar</h2>
                    <p style={{ color: '#666', margin: '0', maxWidth: '400px' }}>
                        Para acceder a tu dashboard, primero inicia sesión con tu cuenta.
                    </p>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <a 
                            href="https://www.pataamiga.mx/user/inicio-de-sesion"
                            style={{
                                padding: '15px 40px',
                                backgroundColor: '#00BBB4',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '50px',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                        >
                            Iniciar Sesión
                        </a>
                        <a 
                            href="/registro"
                            style={{
                                padding: '15px 40px',
                                backgroundColor: 'white',
                                color: '#00BBB4',
                                textDecoration: 'none',
                                borderRadius: '50px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                border: '2px solid #00BBB4'
                            }}
                        >
                            Crear Cuenta
                        </a>
                    </div>
                    <p style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>
                        ¿Problemas para iniciar sesión? <a href="mailto:soporte@pataamiga.mx" style={{ color: '#00BBB4' }}>Contáctanos</a>
                    </p>
                </>
            )}

            {/* Error */}
            {status === 'error' && (
                <>
                    <div style={{ fontSize: '60px' }}>⚠️</div>
                    <h2 style={{ color: '#333', margin: '0' }}>Algo salió mal</h2>
                    <p style={{ color: '#666', margin: '0' }}>
                        Hubo un problema al verificar tu sesión. Por favor intenta de nuevo.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '15px 40px',
                            backgroundColor: '#00BBB4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        Intentar de nuevo
                    </button>
                </>
            )}
        </div>
    );
}
