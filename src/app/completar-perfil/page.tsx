'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/UI/StepIndicator';
import RegistrationForm from '@/components/RegistrationForm/RegistrationForm';
import HelpSection from '@/components/UI/HelpSection';
import { getRegistrationProgress, markStepComplete, getCompletedSteps } from '@/utils/registration-progress';
import styles from './page.module.css';

export default function CompleteProfilePage() {
    const router = useRouter();
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        // Cargar pasos completados desde localStorage
        const completed = getCompletedSteps();
        setCompletedSteps(completed);
    }, []);

    const handleStepClick = (step: number) => {
        const progress = getRegistrationProgress();

        // Permitir navegar a paso 1 siempre
        if (step === 1) {
            router.push('/completar-perfil');
        }
        // Permitir navegar a paso 2 solo si paso 1 está completo
        else if (step === 2 && progress.step1Complete) {
            router.push('/registrar-mascotas');
        }
        // Permitir navegar a paso 3 solo si pasos 1 y 2 están completos
        else if (step === 3 && progress.step1Complete && progress.step2Complete) {
            router.push('/seleccion-plan');
        }
    };

    const handleFormSuccess = () => {
        // Cuando el formulario se envía exitosamente, marcar paso 1 como completo
        markStepComplete(1);
        // Redirigir al paso 2
        router.push('/registrar-mascotas');
    };

    return (
        <div className={styles.pageBackground}>
            <div className={styles.whiteCard}>
                {/* Título principal */}
                <h1 className={styles.mainTitle}>Únete a la manada</h1>

                <StepIndicator
                    currentStep={1}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className={styles.contentLayout}>
                    <div className={styles.formColumn}>
                        <RegistrationForm onSuccess={handleFormSuccess} />
                        <HelpSection />
                    </div>
                    <div className={styles.decorativeColumn}>
                        <div className={styles.decorativeImage} aria-hidden="true">
                            {/* Placeholder para imagen decorativa - mujer con cachorros */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
