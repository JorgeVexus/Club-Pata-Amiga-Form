/**
 * Paso 3: Selección de plan
 * Usa el modal de términos mejorado con todos los checkboxes dentro
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import TermsModalEnhanced from '../TermsModalEnhanced';
import styles from './Step3PlanSelection.module.css';
import { trackEvent } from '@/components/Analytics/MetaPixel';
import { hasValidPetBasic, normalizePetBasicList } from '@/utils/registration-completeness';

// Reusable SVG Components for branding
const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// Planes disponibles
const PLANS = [
    {
        id: 'prc_mensual-452k30jah',
        name: 'Mensual',
        price: 159,
        priceDisplay: '$159 MXN',
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
        priceDisplay: '$1,699 MXN',
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
    const [selectedPlan, setSelectedPlan] = useState<string>(data?.planId || '');

    // Sync selected plan from registration data
    useEffect(() => {
        if (data?.planId && !selectedPlan) {
            setSelectedPlan(data.planId);
        }
    }, [data?.planId]);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showValidationHint, setShowValidationHint] = useState(false);

    // Estados de aceptación
    const [termsAccepted, setTermsAccepted] = useState<TermsAcceptance | null>(null);

    // Estados de código de referido
    const [referralCode, setReferralCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [referralError, setReferralError] = useState('');
    const [ambassadorName, setAmbassadorName] = useState('');
    const [isCodeValidated, setIsCodeValidated] = useState(false);

    // Resumen de mascota
    const primaryPet = normalizePetBasicList(data?.petBasic)[0];
    const petName = primaryPet?.petName || 'tu mascota';
    const petType = primaryPet?.petType === 'gato' ? 'gato' : 'perro';
    const canCheckout = hasValidPetBasic(data?.petBasic);

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
    };

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

    const handleViewTerms = () => {
        setShowTermsModal(true);
    };

    const handleTermsClose = (accepted: boolean, acceptance: TermsAcceptance) => {
        setShowTermsModal(false);
        if (accepted) {
            setTermsAccepted(acceptance);
            localStorage.setItem('registration_terms_acceptance', JSON.stringify({
                ...acceptance,
                timestamp: new Date().toISOString()
            }));
        }
    };

    // Cargar código de referido
    useEffect(() => {
        const savedCode = member?.customFields?.['ambassador-code'];
        if (savedCode && !referralCode) {
            setReferralCode(savedCode);
        }
    }, [member]);

    // Validación automática de código
    useEffect(() => {
        const handler = setTimeout(() => {
            if (referralCode.trim().length >= 3) {
                validateCode(referralCode.trim());
            } else if (referralCode.trim().length > 0) {
                setIsCodeValidated(false);
                setReferralError('El código debe tener al menos 3 caracteres');
            } else {
                setReferralError('');
                setAmbassadorName('');
                setIsCodeValidated(false);
                if (member?.customFields?.['ambassador-code']) {
                    (window as any).$memberstackDom?.updateMember({
                        customFields: { 'ambassador-code': '' }
                    });
                }
            }
        }, 600);
        return () => clearTimeout(handler);
    }, [referralCode]);

    const validateCode = async (code: string) => {
        setIsValidating(true);
        setReferralError('');
        setAmbassadorName('');
        setIsCodeValidated(false);
        try {
            const response = await fetch(`/api/referrals/validate-code?code=${code.toUpperCase()}`);
            const result = await response.json();
            if (result.success && result.valid) {
                setAmbassadorName(result.ambassador_name);
                setIsCodeValidated(true);
                if ((window as any).$memberstackDom) {
                    (window as any).$memberstackDom.updateMember({
                        customFields: { 'ambassador-code': code.toUpperCase() }
                    });
                }
            } else {
                setReferralError(result.message || 'Ese código no es válido');
                setIsCodeValidated(false);
            }
        } catch (error) {
            setReferralError('Error al validar el código');
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinue = async () => {
        if (!canCheckout) {
            showToast('Antes de pagar necesitamos registrar al menos una mascota.', 'error');
            onBack();
            return;
        }

        if (!selectedPlan) {
            showToast('⚠️ ¡No te quedes sin membresía! Elige una para continuar.', 'error');
            setShowValidationHint(true);
            setTimeout(() => setShowValidationHint(false), 800);
            return;
        }
        if (!termsAccepted) {
            showToast('⚠️ Debes aceptar los términos y condiciones.', 'error');
            setShowValidationHint(true);
            setTimeout(() => setShowValidationHint(false), 800);
            return;
        }

        setIsProcessing(true);

        // 🔥 Meta Pixel: Tracking de inicio de checkout
        const selectedPlanData = PLANS.find(plan => plan.id === selectedPlan);
        const planPrice = selectedPlanData ? selectedPlanData.price : 0;
        trackEvent('InitiateCheckout', {
            value: planPrice,
            currency: 'MXN',
            content_name: `Plan ${selectedPlanData?.name || ''}`,
            content_category: 'subscription'
        });

        try {
            const memberId = data?.member?.id || member?.id || member?.memberId;
            if (memberId) {
                const { notifyCheckoutAbandonedToCRM } = await import('@/app/actions/user.actions');
                const recoveryUrl = `${window.location.origin}/seleccion-plan?recuperar=1`;
                notifyCheckoutAbandonedToCRM(memberId, recoveryUrl).catch(() => {});
            }
        } catch (e) {}

        await onNext(selectedPlan, termsAccepted, isCodeValidated ? referralCode.toUpperCase() : undefined);
        setIsProcessing(false);
    };

    useEffect(() => {
        const saved = localStorage.getItem('registration_terms_acceptance');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const timestamp = new Date(parsed.timestamp);
                const hoursDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
                if (hoursDiff < 24) setTermsAccepted(parsed);
            } catch (e) {}
        }
    }, []);

    return (
        <>
            <div className={styles.pageBackground} />
            <div className={styles.containerCenter}>
                <div className={styles.formCard}>
                    {/* Barra de Progreso Interna */}
                    <div className={styles.topProgressBar}>
                        <div className={styles.topProgressBarFill} style={{ width: '100%' }} />
                    </div>

                    <div className={styles.stepBadge}>
                        <img
                            src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png"
                            alt="Club Pata Amiga Logo"
                            className={styles.stepBadgeLogo}
                        />
                        <div className={styles.stepBadgeText}>PASO 3 DE 3</div>
                        <div className={styles.stepBadgeIcon} aria-hidden="true" />
                    </div>

                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>
                            {isRecovery ? 'Completa tu membresía 🐾' : 'Elige tu membresía'}
                        </h2>
                        <p className={styles.formSubtitle}>
                            Protegiendo a <strong>{petName}</strong> ({petType})
                        </p>
                    </div>

                    <div className={styles.formBody}>
                        <div className={`${styles.plansContainer} ${showValidationHint && !selectedPlan ? styles.shake : ''}`}>
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

                        {/* Referral Section - HIDDEN FOR NOW */}
                        {/* 
                        <div className={styles.referralSection}>
                            <label className={styles.referralLabel}>
                                🎟️ ¿Tienes un código de Embajador?
                            </label>
                            <div className={styles.referralInputWrapper}>
                                <input
                                    type="text"
                                    className={`${styles.referralInput} ${isCodeValidated ? styles.inputValid : referralError ? styles.inputInvalid : ''}`}
                                    placeholder="INGRESA TU CÓDIGO"
                                    value={referralCode}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setReferralCode(val);
                                        if (referralError) setReferralError('');
                                        if (isCodeValidated) setIsCodeValidated(false);
                                    }}
                                    disabled={isProcessing}
                                />
                                {isValidating && (
                                    <div className={styles.referralLoading}>
                                        <div className={styles.spinnerSmall}></div>
                                    </div>
                                )}
                            </div>

                            {isCodeValidated && (
                                <div className={styles.referralSuccess}>
                                    <span>✨</span>
                                    <span>
                                        ¡Bienvenido a la manada de <strong>{ambassadorName}</strong>!
                                        <br />
                                        <small>Tu beneficio de 90 días de carencia ha sido aplicado.</small>
                                    </span>
                                </div>
                            )}
                            {referralError && (
                                <span className={styles.referralError}>❌ {referralError}</span>
                            )}
                        </div>
                        */}

                        {/* Checkbox único de términos */}
                        <div className={styles.termsSection}>
                            <label className={styles.termsCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={!!termsAccepted}
                                    onChange={() => {
                                        if (!termsAccepted) {
                                            handleAcceptAllTerms();
                                        } else {
                                            setTermsAccepted(null);
                                            localStorage.removeItem('registration_terms_acceptance');
                                        }
                                    }}
                                />
                                <span className={styles.termsText}>
                                    <strong>He leído y acepto todos los términos</strong>
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
                                disabled={isProcessing || !canCheckout}
                            >
                                {isProcessing ? 'Procesando...' : 'Continuar al pago →'}
                            </button>
                        </div>

                        <p className={styles.securityNote}>
                            🔒 Pago seguro procesado por Stripe. 🐾
                        </p>

                        <div className={styles.transparencyBox}>
                            <p className={styles.transparencyText}>
                                ✨ Transparencia Total: Cancela tu suscripción cuando quieras sin complicaciones.
                            </p>
                        </div>

                        {skipPaymentEnabled && (
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                style={{ marginTop: '1rem', background: 'transparent !important', color: '#E65100 !important', borderStyle: 'dashed' }}
                                onClick={() => {
                                    if (!canCheckout) {
                                        showToast('Antes de pagar necesitamos registrar al menos una mascota.', 'error');
                                        onBack();
                                        return;
                                    }
                                    if (!selectedPlan || !termsAccepted) {
                                        showToast('Selecciona una membresía y acepta los términos primero', 'warning');
                                        return;
                                    }
                                    onSkipPayment?.(selectedPlan, termsAccepted);
                                }}
                                disabled={isProcessing || !canCheckout}
                            >
                                Omitir pago (Test)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de términos mejorado */}
            <TermsModalEnhanced
                isOpen={showTermsModal}
                onClose={handleTermsClose}
                initialAcceptance={termsAccepted || undefined}
            />
        </>
    );
}
