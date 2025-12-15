'use client';

import { useState } from 'react';
import StepIndicator from '@/components/UI/StepIndicator';
import RegistrationForm from '@/components/RegistrationForm/RegistrationForm';

export default function CompleteProfilePage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const handleStepClick = (step: number) => {
        // Solo permitir navegar a pasos completados
        if (completedSteps.includes(step) || step < currentStep) {
            setCompletedSteps(prev => prev.filter(s => s < step));
            setCurrentStep(step);
        }
    };

    return (
        <div>
            <StepIndicator
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />
            <RegistrationForm />
        </div>
    );
}
