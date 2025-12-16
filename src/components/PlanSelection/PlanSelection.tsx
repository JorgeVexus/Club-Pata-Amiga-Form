'use client';

import React, { useState, useEffect } from 'react';
import styles from './PlanSelection.module.css';

// Placeholder IDs - REPLACE WITH REAL MEMBERSTACK PRICE IDS LATER
const PLANS = {
    MONTHLY: {
        id: 'pln_monthly_fake_id', // TODO: User needs to update this
        name: 'Mensualidad',
        price: '159',
        description: 'Perfecto para empezar a formar parte de la comunidad y cuidar con respaldo.\nIncluye acceso al fondo solidario y beneficios exclusivos de la manada.'
    },
    ANNUAL: {
        id: 'pln_annual_fake_id', // TODO: User needs to update this
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

    const handleNext = () => {
        if (!selectedPlanId) {
            setError('⚠️ ¡No te quedes sin plan! Elige mensualidad o anualidad para continuar.');
            return;
        }

        // Aquí iría la lógica de redirección a Payment o Checkout de Memberstack
        console.log('Plan seleccionado:', selectedPlanId);

        // Llamar callback si existe, sino mostrar alert
        if (onSuccess) {
            onSuccess();
        } else {
            alert(`Plan seleccionado: ${selectedPlanId === PLANS.MONTHLY.id ? 'Mensual' : 'Anual'}. Listo para ir a pagar.`);
        }
    };

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
                        disabled={!selectedPlanId}
                    >
                        Siguiente
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
