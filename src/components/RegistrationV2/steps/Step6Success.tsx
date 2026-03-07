/**
 * Paso 6: Pantalla de éxito final
 * Se muestra al completar todo el registro.
 */

'use client';

import React from 'react';
import styles from './steps.module.css';

interface Step6SuccessProps {
    petName: string;
}

export default function Step6Success({ petName }: Step6SuccessProps) {
    const loginUrl = 'https://www.pataamiga.mx/user/inicio-de-sesion';
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (window.$memberstackDom) {
                await window.$memberstackDom.logout();
                // Recargar para limpiar todo el estado y permitir nuevo registro
                window.location.href = window.location.pathname;
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            window.location.reload();
        }
    };

    return (
        <div className={styles.stepCard} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div className={styles.header}>
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem',
                    animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                }}>
                    🎉
                </div>
                <h2 className={styles.title} style={{ color: '#00BBB4' }}>
                    ¡Todo listo!
                </h2>
                <h3 style={{
                    fontSize: '1.25rem',
                    color: '#2D3748',
                    marginTop: '0.5rem',
                    fontFamily: 'Outfit, sans-serif'
                }}>
                    El registro de {petName || 'tu mascota'} ha sido completado.
                </h3>
                <p className={styles.subtitle} style={{ maxWidth: '400px', margin: '1rem auto' }}>
                    Nuestro equipo revisará la información y fotos enviadas.
                    Recibirás una notificación una vez que {petName || 'tu mascota'} sea aprobada.
                </p>
            </div>

            <div className={styles.section} style={{ marginTop: '2rem' }}>
                <div className={styles.alertBox} style={{ background: '#F0FFF4', borderColor: '#48BB78', textAlign: 'left' }}>
                    <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                    <div>
                        <strong style={{ color: '#2F855A' }}>Tu mascota está protegida</strong>
                        <p style={{ color: '#38A169', fontSize: '0.9rem' }}>
                            A partir de este momento, ya puedes consultar con el Vet-Bot para dudas menores mientras se completa la validación.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                    <a
                        href={loginUrl}
                        className={styles.primaryButton}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            width: '100%'
                        }}
                    >
                        Iniciar Sesión en mi Portal
                    </a>

                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={styles.secondaryButton}
                        style={{
                            background: 'transparent',
                            border: '1px solid #CBD5E0',
                            color: '#4A5568',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: '100%'
                        }}
                    >
                        {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión y registrar otra cuenta'}
                    </button>
                </div>

                <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#A0AEC0' }}>
                    ¿Tienes dudas? Contáctanos por WhatsApp al +52 477 754 5334
                </p>
            </div>

            <style jsx>{`
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
