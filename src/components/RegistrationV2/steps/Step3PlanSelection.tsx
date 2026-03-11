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
    onNext: (planId: string) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
    skipPaymentEnabled?: boolean;
    onSkipPayment?: (planId: string) => void;
}

export default function Step3PlanSelection({
    data,
    onNext,
    onBack,
    showToast,
    skipPaymentEnabled = false,
    onSkipPayment
}: Step3PlanSelectionProps) {
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Estados de aceptación (guardados cuando se cierra el modal)
    const [termsAccepted, setTermsAccepted] = useState<TermsAcceptance | null>(null);

    // Mostrar resumen de mascota
    const petName = data?.petBasic?.petName || 'tu mascota';
    const petType = data?.petBasic?.petType === 'gato' ? 'gato' : 'perro';

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
    };

    // Aceptar todos los términos automáticamente (sin abrir modal)
    const handleAcceptAllTerms = () => {
        if (!selectedPlan) {
            showToast('Selecciona un plan primero', 'error');
            return;
        }

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

    // Abrir modal solo para ver términos (con todo aceptado)
    const handleViewTerms = () => {
        if (!selectedPlan) {
            showToast('Selecciona un plan primero', 'error');
            return;
        }
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
        await onNext(selectedPlan);
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
                <h2 className={styles.title}>Elige tu plan</h2>
                <p className={styles.subtitle}>
                    Protegiendo a <strong>{petName}</strong> ({petType})
                </p>
            </div>

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
                            onSkipPayment?.(selectedPlan);
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
