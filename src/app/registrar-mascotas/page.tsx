'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/UI/StepIndicator';
import PetRegistrationForm from '@/components/PetRegistrationForm/PetRegistrationForm';
import HelpSection from '@/components/UI/HelpSection';
import { getRegistrationProgress, markStepComplete, canAccessStep, getCompletedSteps } from '@/utils/registration-progress';
import styles from './page.module.css';

export default function RegisterPetsPage() {
    const router = useRouter();
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        // Verificar si puede acceder a este paso (solo en producción o si no es localhost)
        if (window.location.hostname !== 'localhost' && !canAccessStep(2)) {
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
        <div className={styles.pageBackground}>
            <div className={styles.whiteCard}>
                {/* Imagen decorativa - posición absoluta inferior derecha */}
                <img
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698f84e6bfdd6719e9bd52aa_peludos-img.webp"
                    alt=""
                    className={styles.decorativeImage}
                    aria-hidden
                />

                {/* Título principal */}
                <h1 className={styles.mainTitle}>Únete a la manada</h1>

                <StepIndicator
                    currentStep={2}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className={styles.contentLayout}>
                    <div className={styles.formColumn}>
                        <PetRegistrationForm
                            onSuccess={handlePetsSuccess}
                            onBack={handleGoBack}
                        />
                        <HelpSection />
                    </div>
                </div>
            </div>
        </div>
    );
}

