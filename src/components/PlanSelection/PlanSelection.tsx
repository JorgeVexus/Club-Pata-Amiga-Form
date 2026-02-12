'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './PlanSelection.module.css';

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
        price: '1,699',
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

    // Persistencia básica si recargan la página
    useEffect(() => {
        const savedPlan = localStorage.getItem('selectedPlanId');
        if (savedPlan) {
            setSelectedPlanId(savedPlan);
        }
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
    }, [selectedPlanId, onSuccess]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Elige cómo quieres formar parte</h1>
                <p className={styles.subtitle}>
                    Todos incluyen el mismo cariño, respaldo y beneficios para ti y tu peludo.
                </p>
            </div>

            {/* Grid de Planes */}
            <div className={styles.plansGrid}>
                {/* Tarjeta Mensual */}
                <div
                    className={`${styles.planCard} ${selectedPlanId === PLANS.MONTHLY.id ? styles.selected : ''}`}
                    onClick={() => handleSelectPlan(PLANS.MONTHLY.id)}
                >
                    <div className={styles.price}>${PLANS.MONTHLY.price}</div>
                    <div className={styles.planName}>{PLANS.MONTHLY.name}</div>
                    <div className={styles.description}>
                        {PLANS.MONTHLY.description.split('\n').map((line, i) => (
                            <p key={i} style={{ margin: '5px 0' }}>{line}</p>
                        ))}
                    </div>
                    <button className={styles.selectButton}>
                        {selectedPlanId === PLANS.MONTHLY.id ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                </div>

                {/* Tarjeta Anual */}
                <div
                    className={`${styles.planCard} ${selectedPlanId === PLANS.ANNUAL.id ? styles.selected : ''}`}
                    onClick={() => handleSelectPlan(PLANS.ANNUAL.id)}
                >
                    <div className={styles.price}>${PLANS.ANNUAL.price}</div>
                    <div className={styles.planName}>{PLANS.ANNUAL.name}</div>
                    <div className={styles.description}>
                        {PLANS.ANNUAL.description.split('\n').map((line, i) => (
                            <p key={i} style={{ margin: '5px 0' }}>{line}</p>
                        ))}
                    </div>
                    <button className={styles.selectButton}>
                        {selectedPlanId === PLANS.ANNUAL.id ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                </div>
            </div>

            {/* Footer Info */}
            <div className={styles.footerInfo}>
                <p>Todos los planes incluyen acceso a beneficios, chat veterinario y apoyo solidario.</p>
                <p>El fondo se activa a partir del 6° mes (o antes si tu compañero es adoptado, tiene RUAC o llegas con código referido).</p>
            </div>

            {/* Navegación */}
            <div className={styles.navigationButtons}>
                <button
                    className={styles.cancelButton}
                    onClick={() => window.location.href = '/'}
                >
                    Cancelar
                </button>

                <div className={styles.rightButtons}>
                    <button
                        className={styles.previousButton}
                        onClick={() => onBack ? onBack() : window.history.back()}
                    >
                        Anterior
                    </button>
                    <button
                        className={styles.nextButton}
                        onClick={handleNext}
                        disabled={!selectedPlanId || isProcessing}
                    >
                        {isProcessing ? '⏳ Procesando...' : 'Ir a Pagar'}
                    </button>
                </div>
            </div>

            {/* Error Toast */}
            {error && (
                <div className={styles.errorAlert} onAnimationEnd={() => setTimeout(() => setError(null), 3000)}>
                    {error}
                </div>
            )}
        </div>
    );
}
