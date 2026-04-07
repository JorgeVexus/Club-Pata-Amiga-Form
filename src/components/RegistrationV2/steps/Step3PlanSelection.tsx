/**
 * Paso 3: Selección de plan
 * Usa el modal de términos mejorado con todos los checkboxes dentro
 */

'use client';

import React, { useState, useEffect } from 'react';
import TermsModalEnhanced from '../TermsModalEnhanced';
import styles from './steps.module.css';

// Planes disponibles
const PLANS = [
    {
        id: 'prc_mensual-452k30jah',
        name: 'Mensual',
        price: 159,
        priceDisplay: '$159',
        description: 'Toda la protección mes a mes',
        features: [
            'Vacunación anual (Hasta $300)',
            'Apoyo por fallecimiento (Hasta $2,000)',
            'Chat veterinario 24/7',
            'Emergencias médicas (Hasta $3,000)',
            'Comunidad Pata Amiga'
        ]
    },
    {
        id: 'prc_anual-o9d101ta',
        name: 'Anual',
        price: 1699,
        priceDisplay: '$1,699',
        description: 'Ahorra 209 pesos',
        popular: true,
        features: [
            'Vacunación anual (Hasta $300)',
            'Apoyo por fallecimiento (Hasta $2,000)',
            'Chat veterinario 24/7',
            'Emergencias médicas (Hasta $3,000)',
            'Comunidad Pata Amiga'
        ]
    }
];

interface TermsAcceptance {
    termsAndConditions: boolean;
    privacyPolicy: boolean;
    marketingConsent: boolean;
    clickwrap: boolean;
}

interface Step3PlanSelectionProps {
    data: any;
    member: any;
    onNext: (planId: string, termsAcceptance: any, referralCode?: string) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
    skipPaymentEnabled?: boolean;
    onSkipPayment?: (planId: string, termsAcceptance?: any) => void;
    isRecovery?: boolean;
}

// Add the import dynamically or using top-level if needed. Since this is a client component, 
// we can just import the Server Action cleanly at the top if we wanted, but let's dynamically import
// it inside the handler to avoid adding static dependencies if they aren't strictly needed immediately.

export default function Step3PlanSelection({
    data,
    member,
    onNext,
    onBack,
    showToast,
    skipPaymentEnabled = false,
    onSkipPayment,
    isRecovery = false
}: Step3PlanSelectionProps) {
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Estados de aceptación (guardados cuando se cierra el modal)
    const [termsAccepted, setTermsAccepted] = useState<TermsAcceptance | null>(null);

    // Estados de código de referido
    const [referralCode, setReferralCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [referralError, setReferralError] = useState('');
    const [ambassadorName, setAmbassadorName] = useState('');
    const [isCodeValidated, setIsCodeValidated] = useState(false);

    // Mostrar resumen de mascota
    const petName = data?.petBasic?.petName || 'tu mascota';
    const petType = data?.petBasic?.petType === 'gato' ? 'gato' : 'perro';

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
    };

    // Aceptar todos los términos automáticamente (sin abrir modal)
    const handleAcceptAllTerms = () => {

        const allAccepted: TermsAcceptance = {
            termsAndConditions: true,
            privacyPolicy: true,
            marketingConsent: true,
            clickwrap: true
        };

        setTermsAccepted(allAccepted);
        localStorage.setItem('registration_terms_acceptance', JSON.stringify({
            ...allAccepted,
            timestamp: new Date().toISOString()
        }));

        showToast('Términos aceptados. Puedes revisarlos haciendo clic en "Ver términos".', 'success');
    };

    // Abrir modal solo para ver términos
    const handleViewTerms = () => {
        setShowTermsModal(true);
    };

    const handleTermsClose = (accepted: boolean, acceptance: TermsAcceptance) => {
        setShowTermsModal(false);
        // Si cerró el modal aceptando (o ya estaba aceptado), mantener/guardar
        if (accepted) {
            setTermsAccepted(acceptance);
            localStorage.setItem('registration_terms_acceptance', JSON.stringify({
                ...acceptance,
                timestamp: new Date().toISOString()
            }));
        }
    };

    const handleValidateCode = async () => {
        if (!referralCode.trim()) return;

        setIsValidating(true);
        setReferralError('');
        setAmbassadorName('');
        setIsCodeValidated(false);

        try {
            const response = await fetch(`/api/referrals/validate-code?code=${referralCode.toUpperCase()}`);
            const result = await response.json();

            if (result.success) {
                setAmbassadorName(result.ambassadorName);
                setIsCodeValidated(true);
                showToast(`¡Código válido! Beneficio de embajador aplicado.`, 'success');
            } else {
                setReferralError(result.error || 'Código no válido');
                showToast(result.error || 'Código no válido', 'error');
            }
        } catch (error) {
            console.error('Error validating code:', error);
            setReferralError('Error al validar el código');
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinue = async () => {
        if (!selectedPlan) {
            showToast('Selecciona un plan', 'error');
            return;
        }

        if (!termsAccepted) {
            showToast('Debes aceptar los términos para continuar', 'error');
            return;
        }

        setIsProcessing(true);

        try {
            // Notificar CRM (Carrito Abandonado)
            const memberId = data?.member?.id || member?.id || member?.memberId;
            if (memberId) {
                // Importamos dinámicamente el Server Action
                const { notifyCheckoutAbandonedToCRM } = await import('@/app/actions/user.actions');
                const recoveryUrl = `${window.location.origin}/seleccion-plan?recuperar=1`;
                
                // Disparamos sin await (fire-and-forget) o con await rápido para no bloquear
                notifyCheckoutAbandonedToCRM(memberId, recoveryUrl).catch(err => {
                    console.error('⚠️ [CRM] Error enviando etiqueta de carrito abandonado:', err);
                });
            }
        } catch (e) {
            console.warn('⚠️ No se pudo notificar carrito abandonado al CRM', e);
        }

        await onNext(selectedPlan, termsAccepted, isCodeValidated ? referralCode.toUpperCase() : undefined);
        setIsProcessing(false);
    };

    // Cargar aceptación guardada al montar
    useEffect(() => {
        const saved = localStorage.getItem('registration_terms_acceptance');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Verificar que no sea muy viejo (24 horas)
                const timestamp = new Date(parsed.timestamp);
                const hoursDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    setTermsAccepted(parsed);
                }
            } catch (e) {
                console.error('Error parsing saved terms:', e);
            }
        }
    }, []);

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {isRecovery ? 'Completa tu membresía 🐾' : 'Elige tu plan'}
                </h2>
                <p className={styles.subtitle}>
                    Protegiendo a <strong>{petName}</strong> ({petType})
                </p>
            </div>

            {isRecovery && (
                <div className={styles.recoveryAlert}>
                    <span style={{ fontSize: '1.5rem' }}>👋</span>
                    <p className={styles.recoveryAlertText}>
                        <strong>¡Hola de nuevo!</strong> Vimos que aún no has completado el pago de tu membresía. 
                        Selecciona un plan para activar todos los beneficios de la manada.
                    </p>
                </div>
            )}

            <div className={styles.plansContainer}>
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={`${styles.planCard} ${selectedPlan === plan.id ? styles.selected : ''} ${plan.popular ? styles.popular : ''}`}
                        onClick={() => handleSelectPlan(plan.id)}
                    >
                        {plan.popular && (
                            <span className={styles.popularBadge}>Más popular</span>
                        )}

                        <h3 className={styles.planName}>{plan.name}</h3>
                        <p className={styles.planDescription}>{plan.description}</p>

                        <div className={styles.priceRow}>
                            <span className={styles.price}>{plan.priceDisplay}</span>
                            <span className={styles.period}>
                                {plan.name === 'Mensual' ? '/mes' : '/año'}
                            </span>
                        </div>

                        <ul className={styles.featuresList}>
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className={styles.feature}>
                                    <span className={styles.check}>✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            className={`${styles.selectPlanButton} ${selectedPlan === plan.id ? styles.selectedButton : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPlan(plan.id);
                            }}
                        >
                            {selectedPlan === plan.id ? 'Seleccionado ✓' : 'Seleccionar'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Sección de Código de Referido / Embajador */}
            <div className={styles.referralSection}>
                <label className={styles.referralLabel}>
                    🎟️ ¿Tienes un código de Embajador?
                </label>
                <div className={styles.referralInputWrapper}>
                    <input
                        type="text"
                        className={styles.referralInput}
                        placeholder="INGRESA TU CÓDIGO"
                        value={referralCode}
                        onChange={(e) => {
                            setReferralCode(e.target.value.toUpperCase());
                            if (referralError) setReferralError('');
                            if (isCodeValidated) setIsCodeValidated(false);
                        }}
                        disabled={isValidating || isCodeValidated || isProcessing}
                    />
                    {!isCodeValidated ? (
                        <button
                            type="button"
                            className={styles.referralButton}
                            onClick={handleValidateCode}
                            disabled={!referralCode.trim() || isValidating || isProcessing}
                        >
                            {isValidating ? '...' : 'Validar'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.referralButton}
                            style={{ background: '#2F855A', borderColor: '#000' }}
                            onClick={() => {
                                setIsCodeValidated(false);
                                setAmbassadorName('');
                            }}
                        >
                            Cambiar
                        </button>
                    )}
                </div>

                {isCodeValidated && (
                    <div className={styles.referralSuccess}>
                        <span>✅</span>
                        <span>
                            ¡Bienvenido a la manada de <strong>{ambassadorName}</strong>! 
                            Tu beneficio de 90 días de carencia ha sido aplicado.
                        </span>
                    </div>
                )}
                {referralError && (
                    <span className={styles.referralError}>❌ {referralError}</span>
                )}
            </div>

            {/* Checkbox único de términos */}
            <div className={styles.termsSection}>
                <label className={styles.termsCheckboxLabel}>
                    <input
                        type="checkbox"
                        checked={!!termsAccepted}
                        onChange={() => {
                            if (!termsAccepted) {
                                // Click en checkbox: acepta todo automáticamente
                                handleAcceptAllTerms();
                            } else {
                                // Desmarcar: limpia aceptación
                                setTermsAccepted(null);
                                localStorage.removeItem('registration_terms_acceptance');
                            }
                        }}
                    />
                    <span className={styles.checkmark}></span>
                    <span className={styles.termsText}>
                        <strong>He leído y acepto todos los términos</strong>
                        <span className={styles.required}>*</span>
                        <button
                            type="button"
                            className={styles.viewTermsLink}
                            onClick={(e) => {
                                e.preventDefault();
                                handleViewTerms();
                            }}
                        >
                            Ver términos y condiciones
                        </button>
                    </span>
                </label>
            </div>

            <div className={styles.buttonRow}>
                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onBack}
                    disabled={isProcessing}
                >
                    ← Atrás
                </button>
                <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleContinue}
                    disabled={!selectedPlan || !termsAccepted || isProcessing}
                >
                    {isProcessing ? 'Procesando...' : 'Continuar al pago →'}
                </button>
            </div>

            <p className={styles.securityNote}>
                🔒 Pago seguro procesado por Stripe
            </p>

            {skipPaymentEnabled && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: '#FFF3E0',
                    borderRadius: 12,
                    border: '1px solid #FFB74D',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#E65100', fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
                        ⚠️ Modo de Prueba Activo
                    </p>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        style={{ width: '100%', borderColor: '#FFB74D', color: '#E65100' }}
                        onClick={() => {
                            if (!selectedPlan || !termsAccepted) {
                                showToast('Selecciona un plan y acepta los términos primero', 'warning');
                                return;
                            }
                            onSkipPayment?.(selectedPlan, termsAccepted);
                        }}
                        disabled={isProcessing}
                    >
                        Omitir pago y continuar (Solo Test)
                    </button>
                </div>
            )}

            {/* Modal de términos mejorado */}
            <TermsModalEnhanced
                isOpen={showTermsModal}
                onClose={handleTermsClose}
                initialAcceptance={termsAccepted || undefined}
            />
        </div>
    );
}
