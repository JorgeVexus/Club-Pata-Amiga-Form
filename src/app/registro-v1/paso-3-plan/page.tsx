'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/RegistrationV2/StepIndicator';
import BenefitsBanner from '@/components/RegistrationV2/BenefitsBanner';
import Toast from '@/components/UI/Toast';
import styles from './page.module.css';

interface Plan {
    id: string;
    name: string;
    price: number;
    priceYearly: number;
    description: string;
    features: string[];
    recommended?: boolean;
}

const plans: Plan[] = [
    {
        id: 'basic',
        name: 'Plan Básico',
        price: 299,
        priceYearly: 2990,
        description: 'Protección esencial para tu mascota',
        features: [
            'Cobertura veterinaria básica',
            'Consultas telefónicas',
            'Descuentos en farmacia',
            'Chat con veterinarios'
        ]
    },
    {
        id: 'premium',
        name: 'Plan Premium',
        price: 499,
        priceYearly: 4990,
        description: 'La mejor protección para tu mejor amigo',
        features: [
            'Todo del Plan Básico',
            'Cobertura de emergencias 24/7',
            'Cirugías y procedimientos',
            'Hospitalización',
            'Reembolso de medicamentos',
            'Asistencia en viajes'
        ],
        recommended: true
    }
];

export default function Paso3Plan() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [petData, setPetData] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    useEffect(() => {
        // Verificar pasos anteriores
        const step1Data = localStorage.getItem('registration_step1');
        const step2Data = localStorage.getItem('registration_step2');

        if (!step1Data) {
            router.replace('/registro/paso-1-cuenta');
            return;
        }
        if (!step2Data) {
            router.replace('/registro/paso-2-mascota');
            return;
        }

        setPetData(JSON.parse(step2Data));
    }, [router]);

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
    };

    const handleSubmit = async () => {
        if (!selectedPlan) {
            showToast('Selecciona un plan para continuar', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const plan = plans.find(p => p.id === selectedPlan);

            // Guardar selección
            localStorage.setItem('registration_step3', JSON.stringify({
                planId: selectedPlan,
                planName: plan?.name,
                price: billingCycle === 'monthly' ? plan?.price : plan?.priceYearly,
                billingCycle,
                timestamp: new Date().toISOString()
            }));

            // Redirigir a pago (Stripe checkout)
            // En producción esto crearía una sesión de Stripe
            console.log('✅ Paso 3 completado:', selectedPlan, billingCycle);

            // Simular redirección a Stripe
            showToast('Redirigiendo a pago seguro...', 'success');

            setTimeout(() => {
                // Por ahora simulamos el éxito del pago
                router.push('/registro/completar-perfil?payment=success');
            }, 1500);

        } catch (error: any) {
            console.error('Error:', error);
            showToast(error.message || 'Error al procesar', 'error');
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        router.push('/registro/paso-2-mascota');
    };

    if (!petData) {
        return <div className={styles.loading}>Cargando...</div>;
    }

    return (
        <div className={styles.page}>
            <BenefitsBanner />

            <div className={styles.container}>
                <StepIndicator
                    currentStep={3}
                    totalSteps={3}
                    stepLabels={['Cuenta', 'Mascota', 'Plan']}
                />

                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Protegiendo a:</span>
                    <span className={styles.petName}>
                        {petData.petName} ({petData.petType === 'perro' ? '🐕 Perro' : '🐈 Gato'})
                    </span>
                    <span className={styles.petAge}>
                        {petData.petAge} {petData.petAgeUnit === 'years' ? 'años' : 'meses'}
                    </span>
                </div>

                <h1 className={styles.title}>Elige tu plan</h1>

                {/* Toggle Mensual/Anual */}
                <div className={styles.billingToggle}>
                    <button
                        className={`${styles.toggleButton} ${billingCycle === 'monthly' ? styles.active : ''}`}
                        onClick={() => setBillingCycle('monthly')}
                    >
                        Mensual
                    </button>
                    <button
                        className={`${styles.toggleButton} ${billingCycle === 'yearly' ? styles.active : ''}`}
                        onClick={() => setBillingCycle('yearly')}
                    >
                        Anual
                        <span className={styles.discountBadge}>-20%</span>
                    </button>
                </div>

                <div className={styles.plansContainer}>
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`${styles.planCard} ${selectedPlan === plan.id ? styles.selected : ''} ${plan.recommended ? styles.recommended : ''}`}
                            onClick={() => handleSelectPlan(plan.id)}
                        >
                            {plan.recommended && (
                                <div className={styles.recommendedBadge}>Recomendado</div>
                            )}

                            <h3 className={styles.planName}>{plan.name}</h3>
                            <p className={styles.planDescription}>{plan.description}</p>

                            <div className={styles.priceContainer}>
                                <span className={styles.price}>
                                    ${billingCycle === 'monthly' ? plan.price : plan.priceYearly}
                                </span>
                                <span className={styles.pricePeriod}>
                                    /{billingCycle === 'monthly' ? 'mes' : 'año'}
                                </span>
                            </div>

                            {billingCycle === 'yearly' && (
                                <p className={styles.monthlyEquivalent}>
                                    ${Math.round(plan.priceYearly / 12)}/mes equivalente
                                </p>
                            )}

                            <ul className={styles.featuresList}>
                                {plan.features.map((feature, index) => (
                                    <li key={index} className={styles.feature}>
                                        <span className={styles.checkIcon}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`${styles.selectButton} ${selectedPlan === plan.id ? styles.selectedButton : ''}`}
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

                <div className={styles.buttons}>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={handleBack}
                        disabled={isSubmitting}
                    >
                        ← Atrás
                    </button>
                    <button
                        type="button"
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={!selectedPlan || isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : 'Continuar al pago'}
                        {!isSubmitting && <span>→</span>}
                    </button>
                </div>

                <div className={styles.securityNote}>
                    <span className={styles.lockIcon}>🔒</span>
                    <span>Pago seguro procesado por Stripe. Sin compromisos, cancela cuando quieras.</span>
                </div>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
