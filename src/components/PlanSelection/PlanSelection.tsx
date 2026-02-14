'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './PlanSelection.module.css';
import TermsModal from './TermsModal';

// Memberstack Price IDs (connected to Stripe)
const PLANS = {
    MONTHLY: {
        id: 'prc_mensual-452k30jah',
        name: 'Mensualidad',
        price: '159',
        description: 'Perfecto para empezar a formar parte de la comunidad y cuidar con respaldo.\nIncluye acceso al fondo solidario y beneficios exclusivos de la manada.'
    },
    ANNUAL: {
        id: 'prc_anual-o9d101ta',
        name: 'Anualidad',
        price: '1,909',
        description: 'Tu apoyo y el de tus compañeros ayudan a más familias todo el año.\nAhorra y asegura 12 meses de respaldo continuo.'
    }
};

interface PlanSelectionProps {
    onSuccess?: () => void;
    onBack?: () => void;
}

export default function PlanSelection({ onSuccess, onBack }: PlanSelectionProps = {}) {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [skipPaymentEnabled, setSkipPaymentEnabled] = useState(false);

    // Persistencia básica si recargan la página
    useEffect(() => {
        const savedPlan = localStorage.getItem('selectedPlanId');
        if (savedPlan) {
            setSelectedPlanId(savedPlan);
        }
        // Check if skip payment is enabled
        fetch('/api/admin/settings/skip-payment')
            .then(r => r.json())
            .then(d => setSkipPaymentEnabled(d.enabled))
            .catch(() => { });
    }, []);

    const handleSelectPlan = (planId: string) => {
        setSelectedPlanId(planId);
        setError(null);
        localStorage.setItem('selectedPlanId', planId);
    };

    const handleNext = useCallback(async () => {
        if (!selectedPlanId) {
            setError('⚠️ ¡No te quedes sin plan! Elige mensualidad o anualidad para continuar.');
            return;
        }

        if (!termsAccepted || !marketingConsent) {
            setError('⚠️ Debes aceptar los términos y el consentimiento de comunicación para continuar.');
            return;
        }

        // Verificar que Memberstack esté cargado
        if (!window.$memberstackDom) {
            setError('⚠️ Error de conexión. Recarga la página e intenta de nuevo.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            console.log('🛒 Iniciando checkout con plan:', selectedPlanId);

            // Lanzar el checkout de Stripe a través de Memberstack
            const result = await window.$memberstackDom.purchasePlansWithCheckout({
                priceId: selectedPlanId,
            });

            console.log('✅ Checkout completado:', result);

            // Si el checkout fue exitoso, llamar al callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            console.error('❌ Error en checkout:', err);

            // Si el usuario cerró el checkout (canceló), no mostrar error
            if (err?.message?.includes('cancel') || err?.message?.includes('closed')) {
                console.log('ℹ️ El usuario canceló el checkout.');
            } else {
                setError('❌ Hubo un problema al procesar el pago. Inténtalo de nuevo.');
            }
        } finally {
            setIsProcessing(false);
        }
    }, [selectedPlanId, termsAccepted, marketingConsent, onSuccess]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Ya casi! Elige el plan que más te funcione 😊</h1>
                <p className={styles.subtitle}>
                    Ambos planes incluyen el mismo cariño y respaldo para ti y tu peludo 🐾❤️
                </p>
            </div>

            {/* Grid de Planes */}
            <div className={styles.plansGrid}>
                {/* Tarjeta Mensual */}
                <div
                    className={`${styles.planCard} ${styles.monthlyCard} ${selectedPlanId === PLANS.MONTHLY.id ? styles.selected : ''}`}
                    onClick={() => handleSelectPlan(PLANS.MONTHLY.id)}
                >
                    <div className={styles.price}>
                        <span className={styles.currencySymbol}>$</span>{PLANS.MONTHLY.price}
                    </div>
                    <div className={styles.planName}>{PLANS.MONTHLY.name}</div>
                    <div className={styles.description}>
                        {PLANS.MONTHLY.description.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                    <button className={styles.selectButton}>
                        Seleccionar {selectedPlanId === PLANS.MONTHLY.id && (
                            <span className={styles.checkIcon}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </span>
                        )}
                    </button>

                    <img
                        src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990ae4949db4f4093a15453_mensual.png"
                        alt=""
                        className={styles.planImage}
                    />
                </div>

                {/* Tarjeta Anual */}
                <div
                    className={`${styles.planCard} ${styles.annualCard} ${selectedPlanId === PLANS.ANNUAL.id ? styles.selected : ''}`}
                    onClick={() => handleSelectPlan(PLANS.ANNUAL.id)}
                >
                    <div className={styles.price}>
                        <span className={styles.currencySymbol}>$</span>{PLANS.ANNUAL.price}
                    </div>
                    <div className={styles.planName}>{PLANS.ANNUAL.name}</div>
                    <div className={styles.description}>
                        {PLANS.ANNUAL.description.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                    <button className={styles.selectButton}>
                        Seleccionar {selectedPlanId === PLANS.ANNUAL.id && (
                            <span className={styles.checkIcon}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </span>
                        )}
                    </button>

                    <img
                        src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990ae49067f9da81f95979e_anual.png"
                        alt=""
                        className={styles.planImage}
                    />
                </div>
            </div>

            {/* Footer Info */}
            <div className={styles.footerInfo}>
                <p>Todos los planes incluyen acceso a beneficios, chat veterinario y apoyo solidario.</p>
                <p>El fondo se activa a partir del 6° mes (o antes si tu compañero es adoptado, tiene RUAC o llegas con código referido).</p>
                <p>Tu membresía se renovará automáticamente. Cancela cuando quieras</p>
            </div>

            {/* Terms & Conditions & Consent Section */}
            <div className={styles.termsSection}>
                <label className={styles.termsLabel}>
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                            setTermsAccepted(e.target.checked);
                            setError(null);
                        }}
                        className={styles.termsCheckbox}
                    />
                    <span className={styles.termsText}>
                        He leído y acepto los{' '}
                        <button
                            type="button"
                            className={styles.termsLink}
                            onClick={(e) => {
                                e.preventDefault();
                                setShowTermsModal(true);
                            }}
                        >
                            Términos y Condiciones, Política de Privacidad y documentos legales
                        </button>
                    </span>
                </label>

                <label className={styles.termsLabel} style={{ marginTop: '1rem' }}>
                    <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => {
                            setMarketingConsent(e.target.checked);
                            setError(null);
                        }}
                        className={styles.termsCheckbox}
                    />
                    <span className={styles.termsText}>
                        Autorizo a Pata Amiga enviarme notificaciones, mensajes informativos y promociones vía WhatsApp y correo electrónico, utilizando los datos que proporciono, conforme a su Aviso de Privacidad.
                    </span>
                </label>
            </div>

            {/* Navegación */}
            <div className={styles.navigationButtons}>
                <button
                    className={styles.cancelLink}
                    onClick={() => window.location.href = '/'}
                >
                    Cancelar
                </button>

                <div className={styles.navActionButtons}>
                    <button
                        className={styles.previousButton}
                        onClick={() => onBack ? onBack() : window.history.back()}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Anterior
                    </button>
                    <button
                        className={styles.nextButton}
                        onClick={handleNext}
                        disabled={!selectedPlanId || !termsAccepted || !marketingConsent || isProcessing}
                    >
                        {isProcessing ? 'Procesando...' : 'Siguiente'}
                        <div className={styles.nextIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </button>
                </div>
            </div>

            {/* Skip Payment (Test Mode) */}
            {skipPaymentEnabled && (
                <div className={styles.skipPaymentSection}>
                    <button
                        className={styles.skipPaymentLink}
                        onClick={() => {
                            if (onSuccess) onSuccess();
                            window.location.href = '/user/inicio-de-sesion';
                        }}
                    >
                        Continuar sin pagar (modo prueba) →
                    </button>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className={styles.errorAlert} onAnimationEnd={() => setTimeout(() => setError(null), 3000)}>
                    {error}
                </div>
            )}

            {/* Terms Modal */}
            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
            />
        </div>
    );
}
