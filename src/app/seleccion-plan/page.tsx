'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/UI/StepIndicator';
import PlanSelection from '@/components/PlanSelection/PlanSelection';
import { getRegistrationProgress, markStepComplete, canAccessStep, getCompletedSteps, resetRegistrationProgress } from '@/utils/registration-progress';
import HelpSection from '@/components/UI/HelpSection';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

export default function PlanSelectionPage() {
    const router = useRouter();
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        // Verificar si puede acceder a este paso (solo en producción o si no es localhost)
        if (window.location.hostname !== 'localhost' && !canAccessStep(3)) {
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
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.whiteCard}>
                {/* Imagen decorativa de las patas */}
                <img
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990ae4a1602b7aad2a19aa3_pagos%20img.png"
                    alt=""
                    className={styles.decorativeImage}
                    aria-hidden
                />

                <h1 className={styles.mainTitle}>Únete a la manada</h1>

                <StepIndicator
                    currentStep={3}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className={styles.contentLayout}>
                    <div className={styles.formColumn}>
                        <PlanSelection
                            onSuccess={handlePlanSuccess}
                            onBack={handleGoBack}
                        />
                        <HelpSection />
                    </div>
                </div>
            </div>
        </div>
    );
}
