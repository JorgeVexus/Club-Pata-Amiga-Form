/**
 * Paso 6: Pantalla de éxito final
 * Se muestra al completar todo el registro.
 */

'use client';

import React from 'react';
import styles from './steps.module.css';
import BillingModal from './BillingModal';
import { saveBillingDetailsByMemberstackId } from '@/app/actions/user.actions';

interface Step6SuccessProps {
    petName: string;
    member?: any;
    userEmail?: string;
}

export default function Step6Success({ petName, member, userEmail }: Step6SuccessProps) {
    const loginUrl = 'https://www.pataamiga.mx/user/inicio-de-sesion';
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const [showBillingModal, setShowBillingModal] = React.useState(false);
    const [wantsBilling, setWantsBilling] = React.useState(false);
    const [billingSaved, setBillingSaved] = React.useState(false);
    const [isSavingBilling, setIsSavingBilling] = React.useState(false);

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

    const handleSaveBilling = async (details: any) => {
        if (!member?.id) {
            console.error('No member ID available');
            return;
        }

        setIsSavingBilling(true);
        try {
            const result = await saveBillingDetailsByMemberstackId(member.id, details);
            if (result.success) {
                setBillingSaved(true);
                setShowBillingModal(false);
                setWantsBilling(true);
            } else {
                alert('No pudimos guardar tus datos: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving billing:', error);
            alert('Error de conexión al guardar los datos.');
        } finally {
            setIsSavingBilling(false);
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

            <div className={styles.section} style={{ marginTop: '2.5rem' }}>

                {/* Opción de Facturación */}
                <div style={{
                    marginBottom: '2rem',
                    padding: '1.25rem',
                    background: '#F7FAFC',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    textAlign: 'left'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={wantsBilling}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setShowBillingModal(true);
                                } else {
                                    setWantsBilling(false);
                                }
                            }}
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#00BBB4' }}
                        />
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '600', color: '#4A5568' }}>
                            ¿Quieres facturar tu pago?
                            {billingSaved && <span style={{ color: '#00BBB4', fontSize: '0.85rem', marginLeft: '8px' }}>(✓ Datos guardados)</span>}
                        </span>
                    </label>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096', marginLeft: '32px' }}>
                        Si necesitas factura CFDI 4.0, ingresa tus datos ahora.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

            {/* Billing Modal Component */}
            <BillingModal
                isOpen={showBillingModal}
                onClose={() => {
                    setShowBillingModal(false);
                    if (!billingSaved) setWantsBilling(false);
                }}
                onSave={handleSaveBilling}
                initialEmail={userEmail}
            />

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
