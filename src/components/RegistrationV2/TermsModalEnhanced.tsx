/**
 * Modal de Términos Mejorado - Versión Solo Lectura
 * Muestra los documentos y términos ya aceptados (modo revisión)
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from './TermsModalEnhanced.module.css';



interface TermsAcceptance {
    termsAndConditions: boolean;
    privacyPolicy: boolean;
    marketingConsent: boolean;
    clickwrap: boolean;
}

interface TermsModalEnhancedProps {
    isOpen: boolean;
    onClose: (accepted: boolean, acceptance: TermsAcceptance) => void;
    initialAcceptance?: TermsAcceptance;
}

export default function TermsModalEnhanced({ isOpen, onClose, initialAcceptance }: TermsModalEnhancedProps) {
    const [isDocExpanded, setIsDocExpanded] = useState(false);
    const [isConsentExpanded, setIsConsentExpanded] = useState(false);
    const [acceptance, setAcceptance] = useState<TermsAcceptance>({
        termsAndConditions: true,
        privacyPolicy: true,
        marketingConsent: true,
        clickwrap: true,
        ...initialAcceptance
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsDocExpanded(false); // Reset expansion on open
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        onClose(true, acceptance);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>📋 Términos y Condiciones</h2>
                    <button className={styles.modalClose} onClick={handleClose}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    {/* Banner de términos ya aceptados */}
                    <div className={styles.acceptedBanner}>
                        <span className={styles.checkIcon}>✓</span>
                        <p>
                            <strong>Has aceptado los siguientes términos</strong><br />
                            Estos son los documentos y consentimientos que aceptaste para continuar.
                        </p>
                    </div>

                    {/* Sección de Documentos */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Documentos Legales</h3>
                        <p className={styles.sectionDescription}>
                            Toca o haz clic sobre cualquier documento para descargarlo y revisarlo.
                        </p>

                        <div className={styles.docsList}>
                            <div className={`${styles.docAccordionItem} ${isDocExpanded ? styles.expanded : ''}`}>
                                <div
                                    className={styles.docAccordionHeader}
                                    onClick={() => setIsDocExpanded(!isDocExpanded)}
                                >
                                    <div className={styles.docInfo}>
                                        <span className={styles.docIcon}>📄</span>
                                        <div>
                                            <div className={styles.docTitle}>Términos del Servicio</div>
                                            <div className={styles.docDesc}>
                                                Incluye Aviso de privacidad, Términos y condiciones, Reglamentos y Políticas aplicables.
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.accordionChevron}>
                                        {isDocExpanded ? '▲' : '▼'}
                                    </div>
                                </div>
                                {isDocExpanded && (
                                    <div className={styles.docAccordionContent}>
                                        <iframe
                                            src="/legal/terminos_completos_v1.pdf#toolbar=0"
                                            className={styles.docIframe}
                                            title="Términos Completos"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                    <div className={styles.divider} />

                    {/* Sección de Consentimientos Aceptados */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Aceptaciones y Consentimientos</h3>

                        <div className={styles.acceptedList}>
                            {/* Grupo de Aceptaciones Obligatorias */}
                            <div className={`${styles.docAccordionItem} ${isConsentExpanded ? styles.expanded : ''}`}>
                                <div
                                    className={styles.docAccordionHeader}
                                    onClick={() => setIsConsentExpanded(!isConsentExpanded)}
                                >
                                    <div className={styles.docInfo}>
                                        <span className={styles.docIcon}>✅</span>
                                        <div>
                                            <div className={styles.docTitle}>Aceptaciones Obligatorias</div>
                                            <div className={styles.docDesc}>
                                                Términos, Privacidad y Contrato.
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.accordionChevron}>
                                        {isConsentExpanded ? '▲' : '▼'}
                                    </div>
                                </div>
                                {isConsentExpanded && (
                                    <div className={styles.docAccordionContent}>
                                        <div className={styles.simpleConsentList}>
                                            {/* Términos y Condiciones */}
                                            <div className={styles.simpleConsentItem}>
                                                <span className={styles.simpleConsentCheck}>✓</span>
                                                <div className={styles.simpleConsentText}>
                                                    <strong>Términos y Condiciones</strong>
                                                    <small>
                                                        He leído y acepto los términos y condiciones del servicio,
                                                        incluyendo las políticas de membresía, pagos y cancelación.
                                                    </small>
                                                </div>
                                            </div>

                                            {/* Aviso de Privacidad */}
                                            <div className={styles.simpleConsentItem}>
                                                <span className={styles.simpleConsentCheck}>✓</span>
                                                <div className={styles.simpleConsentText}>
                                                    <strong>Aviso de Privacidad</strong>
                                                    <small>
                                                        He leído el aviso de privacidad y autorizo el tratamiento de
                                                        mis datos personales conforme a la Ley Federal de Protección
                                                        de Datos Personales en Posesión de los Particulares.
                                                    </small>
                                                </div>
                                            </div>

                                            {/* Contrato de Membresía */}
                                            <div className={styles.simpleConsentItem}>
                                                <span className={styles.simpleConsentCheck}>✓</span>
                                                <div className={styles.simpleConsentText}>
                                                    <strong>Contrato de Membresía</strong>
                                                    <small>
                                                        Acepto que al hacer clic en &quot;Continuar al pago&quot; estoy firmando
                                                        electrónicamente el contrato de membresía y autorizo los cargos
                                                        recurrentes a mi método de pago seleccionado.
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Marketing */}
                            <div
                                className={`${styles.acceptedItem} ${styles.optional} ${!acceptance.marketingConsent ? styles.deselected : ''} ${styles.clickable}`}
                                onClick={() => {
                                    setAcceptance(prev => ({
                                        ...prev,
                                        marketingConsent: !prev.marketingConsent
                                    }));
                                }}
                            >
                                <span className={styles.acceptedCheck}>
                                    {acceptance.marketingConsent ? '✓' : '○'}
                                </span>
                                <div className={styles.acceptedText}>
                                    <strong>Comunicaciones y Promociones</strong>
                                    <span className={styles.optionalBadge}>(Opcional)</span>
                                    <small>
                                        Acepto recibir comunicaciones, newsletters, promociones especiales
                                        y novedades sobre productos y servicios.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.understoodBtn}
                        onClick={handleClose}
                    >
                        Entendido ✓
                    </button>
                </div>
            </div>
        </div>
    );
}
