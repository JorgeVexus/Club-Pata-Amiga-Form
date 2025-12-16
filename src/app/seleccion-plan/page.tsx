'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/UI/StepIndicator';
import PlanSelection from '@/components/PlanSelection/PlanSelection';
import { getRegistrationProgress, markStepComplete, canAccessStep, getCompletedSteps, resetRegistrationProgress } from '@/utils/registration-progress';

export default function PlanSelectionPage() {
    const router = useRouter();
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        // Verificar si puede acceder a este paso
        if (!canAccessStep(3)) {
            const progress = getRegistrationProgress();
            if (!progress.step1Complete) {
                router.push('/completar-perfil');
            } else if (!progress.step2Complete) {
                router.push('/registrar-mascotas');
            }
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

    const handlePlanSuccess = () => {
        // Marcar paso 3 como completo
        markStepComplete(3);

        // Limpiar progreso ya que el registro está completo
        resetRegistrationProgress();

        // Redirigir a página de éxito o dashboard
        // router.push('/registro-exitoso');
        console.log('¡Registro completo!');
    };

    const handleGoBack = () => {
        router.push('/registrar-mascotas');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#00BBB4', padding: '2rem 0' }}>
            <StepIndicator
                currentStep={3}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />
            <PlanSelection
                onSuccess={handlePlanSuccess}
                onBack={handleGoBack}
            />
        </div>
    );
}
