/**
 * Step Indicator Component
 * Diseño Figma Pata Amiga - node 111-2205
 * Barra tipo pill con fondo gris claro, círculos con iconos blancos
 */

'use client';

import React from 'react';
import styles from './StepIndicator.module.css';

interface Step {
    id: number;
    title: string;
    icon: React.ReactNode;
}

/* Iconos SVG en blanco para usar dentro de círculos coloreados */
const PersonIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.stepIconSvg}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const PawIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.stepIconSvg}>
        <path d="M8.35 3C9.53 2.83 10.78 4.12 11.14 5.9c.36 1.78-.26 3.35-1.27 3.54-1.01.2-2.15-1.2-2.51-2.98-.36-1.79.26-3.35 1.27-3.54zM15.65 3c-1.18-.17-2.43 1.12-2.79 2.9-.36 1.78.26 3.35 1.27 3.54 1.01.2 2.15-1.2 2.51-2.98.36-1.79-.26-3.35-1.27-3.54zM3 7.6c.44 0 .88.1 1.3.3.84.39 1.5 1.02 1.91 1.78.41.76.56 1.58.42 2.37-.14.79-.58 1.5-1.22 2.02-.64.52-1.38.85-2.18.93-.79.08-1.57-.09-2.25-.5-.68-.41-1.22-1.04-1.52-1.79-.3-.75-.35-1.57-.14-2.36.21-.79.66-1.5 1.28-2.02.62-.52 1.36-.85 2.16-.93zM21 7.6c-.44 0-.88.1-1.3.3-.84.39-1.5 1.02-1.91 1.78-.41.76-.56 1.58-.42 2.37.14.79.58 1.5 1.22 2.02.64.52 1.38.85 2.18.93.79.08 1.57-.09 2.25-.5.68-.41 1.22-1.04 1.52-1.79.3-.75.35-1.57.14-2.36-.21-.79-.66-1.5-1.28-2.02-.62-.52-1.36-.85-2.16-.93zM19.33 18.22c-.42-.94-.99-1.78-1.69-2.44-.7-.66-1.51-1.12-2.36-1.36-.85-.24-1.72-.26-2.56-.04-.84.22-1.62.67-2.25 1.31-.63.64-1.09 1.41-1.35 2.24-.26.83-.32 1.68-.18 2.52.14.84.5 1.64 1.04 2.3.54.66 1.24 1.17 2.02 1.49.78.32 1.62.44 2.46.34.84-.1 1.65-.42 2.37-.92.72-.5 1.33-1.16 1.78-1.93.46-.77.75-1.63.86-2.53zM4.67 18.22c.42-.94.99-1.78 1.69-2.44.7-.66 1.51-1.12 2.36-1.36.85-.24 1.72-.26 2.56-.04.84.22 1.62.67 2.25 1.31.63.64 1.09 1.41 1.35 2.24.26.83.32 1.68.18 2.52-.14.84-.5 1.64-1.04 2.3-.54.66-1.24 1.17-2.02 1.49-.78.32-1.62.44-2.46.34-.84-.1-1.65-.42-2.37-.92-.72-.5-1.33-1.16-1.78-1.93-.46-.77-.75-1.63-.86-2.53zM12 18.02c-.31 0-.62-.02-.92-.07-.3-.05-.59-.13-.86-.23-.27-.1-.53-.23-.76-.38-.23-.15-.44-.33-.62-.52-.18-.19-.33-.41-.45-.64-.12-.23-.2-.47-.24-.72-.04-.25-.05-.5-.01-.74.04-.24.12-.47.23-.69.11-.22.25-.42.42-.6.17-.18.37-.33.59-.45.22-.12.46-.21.71-.26.25-.05.5-.07.75-.05.25.02.49.08.72.17.23.09.44.22.63.37.19.15.35.34.48.55.13.21.23.45.28.7.05.25.06.5.03.75-.03.25-.1.49-.2.72-.1.23-.24.44-.41.63-.17.19-.37.35-.6.48-.23.13-.48.22-.74.28-.26.06-.53.08-.79.06z" />
    </svg>
);

const ThumbsUpIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.stepIconSvg}>
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.stepIconSvg}>
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
);

const steps: Step[] = [
    { id: 1, title: 'Completa tu perfil', icon: <PersonIcon /> },
    { id: 2, title: 'Registra a tus peludos', icon: <PawIcon /> },
    { id: 3, title: 'Finaliza tu solicitud', icon: <ThumbsUpIcon /> },
];

interface StepIndicatorProps {
    currentStep: number;
    completedSteps: number[];
    onStepClick?: (step: number) => void;
}

export default function StepIndicator({
    currentStep,
    completedSteps,
    onStepClick
}: StepIndicatorProps) {

    const getStepStatus = (stepId: number): 'completed' | 'active' | 'pending' => {
        if (stepId === currentStep) return 'active';
        if (completedSteps.includes(stepId)) return 'completed';
        return 'pending';
    };

    const handleStepClick = (stepId: number) => {
        if (completedSteps.includes(stepId) || stepId === currentStep) {
            onStepClick?.(stepId);
        }
    };

    return (
        <div className={styles.stepBarContainer}>
            <div className={styles.stepIndicator}>
                {steps.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const isClickable = completedSteps.includes(step.id) || step.id === currentStep;

                    return (
                        <React.Fragment key={step.id}>
                            <div
                                className={`${styles.stepWrapper} ${styles[status]} ${isClickable ? styles.clickable : ''}`}
                                onClick={() => handleStepClick(step.id)}
                            >
                                <div className={styles.stepCircle}>
                                    {status === 'completed' ? <CheckIcon /> : step.icon}
                                </div>
                                <span className={styles.stepTitle}>{step.title}</span>
                            </div>

                            {index < steps.length - 1 && (
                                <div className={styles.connector}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
