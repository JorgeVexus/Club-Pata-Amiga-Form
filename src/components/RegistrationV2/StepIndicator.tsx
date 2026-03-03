'use client';

import React from 'react';
import styles from './StepIndicator.module.css';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    stepLabels?: string[];
}

export default function StepIndicator({ 
    currentStep, 
    totalSteps, 
    stepLabels = [] 
}: StepIndicatorProps) {
    return (
        <div className={styles.container}>
            {Array.from({ length: totalSteps }, (_, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;
                const label = stepLabels[i] || `Paso ${stepNum}`;
                
                return (
                    <React.Fragment key={stepNum}>
                        <div className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                            <div className={styles.stepNumber}>
                                {isCompleted ? '✓' : stepNum}
                            </div>
                            <span className={styles.stepLabel}>{label}</span>
                        </div>
                        {stepNum < totalSteps && (
                            <div className={`${styles.connector} ${isCompleted ? styles.completed : ''}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
