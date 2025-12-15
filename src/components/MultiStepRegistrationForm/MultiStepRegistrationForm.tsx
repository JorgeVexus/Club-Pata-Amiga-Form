/**
 * Multi-Step Registration Form Wrapper
 * Integrates StepIndicator with the registration flow
 */

'use client';

import React, { useState } from 'react';
import StepIndicator from '@/components/UI/StepIndicator';
import RegistrationForm from '@/components/RegistrationForm/RegistrationForm';
import PetRegistrationForm from '@/components/PetRegistrationForm/PetRegistrationForm';
import PlanSelection from '@/components/PlanSelection/PlanSelection';
import styles from './MultiStepRegistrationForm.module.css';

export default function MultiStepRegistrationForm() {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const handleStepClick = (step: number) => {
        // Solo permitir navegar a pasos completados
        if (completedSteps.includes(step) || step < currentStep) {
            setCompletedSteps(prev => prev.filter(s => s < step));
            setCurrentStep(step);
        }
    };

    const handleStepComplete = (step: number) => {
        if (!completedSteps.includes(step)) {
            setCompletedSteps(prev => [...prev, step]);
        }
        if (step < 3) {
            setCurrentStep(step + 1);
        }
    };

    return (
        <div className={styles.container}>
            <StepIndicator
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className={styles.formContainer}>
                {currentStep === 1 && (
                    <RegistrationForm
                        onComplete={() => handleStepComplete(1)}
                    />
                )}

                {currentStep === 2 && (
                    <PetRegistrationForm
                        onComplete={() => handleStepComplete(2)}
                        onBack={() => setCurrentStep(1)}
                    />
                )}

                {currentStep === 3 && (
                    <PlanSelection
                        onComplete={() => handleStepComplete(3)}
                        onBack={() => setCurrentStep(2)}
                    />
                )}
            </div>
        </div>
    );
}
