'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/UI/StepIndicator';
import PetRegistrationForm from '@/components/PetRegistrationForm/PetRegistrationForm';
import { getRegistrationProgress, markStepComplete, canAccessStep, getCompletedSteps } from '@/utils/registration-progress';

export default function RegisterPetsPage() {
    const router = useRouter();
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        // Verificar si puede acceder a este paso
        if (!canAccessStep(2)) {
            router.push('/completar-perfil');
            return;
        }

        // Cargar pasos completados
        const completed = getCompletedSteps();
        setCompletedSteps(completed);
    }, [router]);

    const handleStepClick = (step: number) => {
        const progress = getRegistrationProgress();

        if (step === 1) {
            router.push('/completar-perfil');
        } else if (step === 2 && progress.step1Complete) {
            router.push('/registrar-mascotas');
        } else if (step === 3 && progress.step1Complete && progress.step2Complete) {
            router.push('/seleccion-plan');
        }
    };

    const handlePetsSuccess = () => {
        // Marcar paso 2 como completo
        markStepComplete(2);
        // Redirigir al paso 3
        router.push('/seleccion-plan');
    };

    const handleGoBack = () => {
        router.push('/completar-perfil');
    };

    return (
        <div>
            <StepIndicator
                currentStep={2}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />
            <PetRegistrationForm
                onSuccess={handlePetsSuccess}
                onBack={handleGoBack}
            />
        </div>
    );
}
