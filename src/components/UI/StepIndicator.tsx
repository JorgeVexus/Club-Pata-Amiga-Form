/**
 * Step Indicator Component
 * Visual progress indicator for multi-step registration form
 */

'use client';

import React from 'react';
import styles from './StepIndicator.module.css';

interface Step {
    id: number;
    title: string;
    iconUrl: string;
}

interface StepIndicatorProps {
    currentStep: number;
    completedSteps: number[];
    onStepClick?: (step: number) => void;
}

const steps: Step[] = [
    {
        id: 1,
        title: 'Completa tu perfil',
        iconUrl: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/694089770f0810697fba9a18_perfil-form.svg'
    },
    {
        id: 2,
        title: 'Registra a tus peludos',
        iconUrl: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/69408978c72872ac696c7c65_pets-form.svg'
    },
    {
        id: 3,
        title: 'Finaliza tu solicitud',
        iconUrl: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/69408977ba8e012c0cf43512_pago-form.svg'
    }
];

const completedIconUrl = 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6940899d8071c8c57938b12a_completed-step-form.svg';

export default function StepIndicator({
    currentStep,
    completedSteps,
    onStepClick
}: StepIndicatorProps) {

    const getStepStatus = (stepId: number): 'completed' | 'active' | 'pending' => {
        if (stepId === currentStep) return 'active'; // Prioridad al paso actual
        if (completedSteps.includes(stepId)) return 'completed';
        return 'pending';
    };

    const handleStepClick = (stepId: number) => {
        // Solo permitir navegar a pasos completados o al paso actual
        if (completedSteps.includes(stepId) || stepId === currentStep) {
            onStepClick?.(stepId);
        }
    };

    return (
        <div className={styles.stepIndicator}>
            {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const isClickable = completedSteps.includes(step.id) || step.id === currentStep;

                return (
                    <React.Fragment key={step.id}>
                        {/* Step Circle */}
                        <div
                            className={`${styles.stepWrapper} ${styles[status]} ${isClickable ? styles.clickable : ''}`}
                            onClick={() => handleStepClick(step.id)}
                        >
                            <div className={styles.stepCircle}>
                                {status === 'completed' ? (
                                    <img
                                        src={completedIconUrl}
                                        alt="Completado"
                                        className={styles.stepIcon}
                                    />
                                ) : (
                                    <img
                                        src={step.iconUrl}
                                        alt={step.title}
                                        className={styles.stepIcon}
                                    />
                                )}
                            </div>
                            <span className={styles.stepTitle}>{step.title}</span>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className={`${styles.connector} ${completedSteps.includes(step.id) ? styles.connectorCompleted : ''
                                }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
