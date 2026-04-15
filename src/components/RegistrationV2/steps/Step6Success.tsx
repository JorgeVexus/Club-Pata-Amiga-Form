/**
 * Paso 6: Pantalla de éxito final
 * Se muestra al completar todo el registro.
 */

'use client';

import React from 'react';
import styles from './steps.module.css';
import BillingModal from './BillingModal';
import { saveBillingDetailsByMemberstackId } from '@/app/actions/user.actions';
import { trackCompleteRegistration } from '@/components/Analytics/MetaPixel';

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

    // Trackear finalización exitosa al montar
    React.useEffect(() => {
        trackCompleteRegistration({
            content_name: 'Full Registration Complete',
            content_category: 'registration',
            pet_name: petName
        });
    }, [petName]);

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

                <div style={{ 
                    marginTop: '2rem', 
                    padding: '1rem',
                    background: '#F0FFF4',
                    borderRadius: '12px',
                    border: '1px border dashed #68D391',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .081 5.363.077 11.968c0 2.112.551 4.17 1.597 6.004L0 24l6.163-1.617a11.83 11.83 0 005.883 1.562h.005c6.604 0 11.967-5.364 11.97-11.97.001-3.202-1.246-6.212-3.513-8.479"></path>
                    </svg>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#2F855A', fontFamily: 'Outfit, sans-serif' }}>
                        ¿Tienes dudas? <a 
                            href={`https://wa.me/525637545068?text=${encodeURIComponent('¡Hola! Tengo una duda sobre mi registro en Pata Amiga.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                                color: '#25D366', 
                                fontWeight: '700', 
                                textDecoration: 'none',
                                borderBottom: '2px solid #25D366',
                                paddingBottom: '1px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#128C7E'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#25D366'}
                        >
                            WhatsApp: 56 3754 5068
                        </a>
                    </p>
                </div>
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
