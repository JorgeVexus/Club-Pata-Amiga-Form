'use client';

import React, { useState, useEffect } from 'react';
import styles from './Step6Success.module.css';
import commonStyles from './steps.module.css';
import BillingModal from './BillingModal';
import { saveBillingDetailsByMemberstackId } from '@/app/actions/user.actions';
import { trackCompleteRegistration } from '@/components/Analytics/MetaPixel';

interface Step6SuccessProps {
    petName: string;
    petNames?: string[];
    member?: any;
    userEmail?: string;
}

function formatPetNames(names: string[]) {
    const cleanedNames = names.map((name) => name.trim()).filter(Boolean);
    if (cleanedNames.length === 0) return 'tu mascota';
    if (cleanedNames.length === 1) return cleanedNames[0];
    if (cleanedNames.length === 2) return `${cleanedNames[0]} y ${cleanedNames[1]}`;
    return `${cleanedNames.slice(0, -1).join(', ')} y ${cleanedNames[cleanedNames.length - 1]}`;
}

export default function Step6Success({ petName, petNames = [], member, userEmail }: Step6SuccessProps) {
    const loginUrl = 'https://www.pataamiga.mx/user/inicio-de-sesion';
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [wantsBilling, setWantsBilling] = useState(false);
    const [billingSaved, setBillingSaved] = useState(false);
    const [isSavingBilling, setIsSavingBilling] = useState(false);
    const petsReviewLabel = formatPetNames(petNames.length > 0 ? petNames : [petName]);

    // Trackear finalización exitosa al montar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                trackCompleteRegistration({
                    content_name: 'Full Registration Complete',
                    content_category: 'registration',
                    pet_name: petName || 'Mascota'
                });
            } catch (err) {
                console.warn('MetaPixel tracking failed (non-blocking):', err);
            }
        }
    }, [petName]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const msDom = (window as any).$memberstackDom;
            if (msDom && typeof msDom.logout === 'function') {
                await msDom.logout();
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
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.formCard}>
                    {/* Top Progress Bar (Technical) */}
                    <div className={commonStyles.topProgressBar}>
                        <div className={commonStyles.topProgressBarFill} style={{ width: '100%' }} />
                    </div>

                    {/* Step Badge */}
                    <div className={styles.stepBadge}>
                        <img 
                            src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png" 
                            alt="Club Pata Amiga Logo" 
                            className={styles.stepBadgeLogo} 
                        />
                        <div className={styles.stepBadgeText}>¡REGISTRO EXITOSO!</div>
                        <div className={styles.stepBadgeIcon} aria-hidden="true" />
                    </div>

                    <div className={styles.formHeader}>
                        <div className={styles.successIcon}>🎉</div>
                        <h2 className={styles.formTitle}>Ya estás en la manada</h2>
                        <h3 className={styles.formSubtitle}>
                            Tu membresía ya quedó activa.
                        </h3>
                        <p className={styles.formDescription}>
                            Revisaremos la información de {petsReviewLabel} y te notificaremos el resultado de cada mascota.
                        </p>
                    </div>

                    <div className={styles.formBody}>
                        <div className={styles.noticeBox}>
                            ✨ Recuerda: Tienes control total sobre tu membresía. Puedes cancelar en cualquier momento desde tu panel de usuario.
                        </div>

                        {/* Opción de Facturación */}
                        <div className={styles.billingSection}>
                            <label className={styles.billingLabel}>
                                <input
                                    type="checkbox"
                                    checked={wantsBilling}
                                    className={styles.billingCheckbox}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setShowBillingModal(true);
                                        } else {
                                            setWantsBilling(false);
                                        }
                                    }}
                                />
                                <span>
                                    ¿Quieres facturar tu pago?
                                    {billingSaved && <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', marginLeft: '8px' }}>(✓ Datos guardados)</span>}
                                </span>
                            </label>
                            <p className={styles.billingDescription}>
                                Si necesitas factura CFDI 4.0, ingresa tus datos ahora.
                            </p>
                        </div>

                        <div className={styles.buttonColumn}>
                            <a
                                href={loginUrl}
                                className={styles.primaryButton}
                            >
                                Iniciar Sesión en mi Portal
                            </a>

                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className={styles.secondaryButton}
                            >
                                {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión y registrar otra cuenta'}
                            </button>
                        </div>

                        <div className={styles.whatsappSection}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .081 5.363.077 11.968c0 2.112.551 4.17 1.597 6.004L0 24l6.163-1.617a11.83 11.83 0 005.883 1.562h.005c6.604 0 11.967-5.364 11.97-11.97.001-3.202-1.246-6.212-3.513-8.479"></path>
                            </svg>
                            <p className={styles.whatsappText}>
                                ¿Tienes dudas? <a 
                                    href={`https://wa.me/525637545068?text=${encodeURIComponent('¡Hola! Tengo una duda sobre mi registro en Pata Amiga.')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.whatsappLink}
                                >
                                    WhatsApp: 56 3754 5068
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <BillingModal
                isOpen={showBillingModal}
                onClose={() => {
                    setShowBillingModal(false);
                    if (!billingSaved) setWantsBilling(false);
                }}
                onSave={handleSaveBilling}
                initialEmail={userEmail}
            />
        </div>
    );
}
