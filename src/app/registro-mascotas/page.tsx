'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PetRegistrationForm from '@/components/PetRegistrationForm/PetRegistrationForm';
import StepIndicator from '@/components/UI/StepIndicator';
import { getRegistrationProgress, getCompletedSteps } from '@/utils/registration-progress';
import styles from './page.module.css';

export default function PetRegistrationPage() {
    const router = useRouter();
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        const completed = getCompletedSteps();
        setCompletedSteps(completed);

        // Verificar progreso (opcional, por si entra directo)
        const progress = getRegistrationProgress();
        if (!progress.step1Complete) {
            // router.push('/completar-perfil'); // Comentado para facilitar dev/testing
        }
    }, []);

    const handleStepClick = (step: number) => {
        const progress = getRegistrationProgress();
        if (step === 1) router.push('/completar-perfil');
        else if (step === 2 && progress.step1Complete) router.push('/registrar-mascotas');
        else if (step === 3 && progress.step1Complete && progress.step2Complete) router.push('/seleccion-plan');
    };

    return (
        <div className={styles.pageBackground}>
            <div className={styles.whiteCard}>
                {/* Imagen decorativa - misma posición que pantalla anterior (bottom right) */}
                <img
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698f84e6bfdd6719e9bd52aa_peludos-img.webp"
                    alt="Peludos"
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
                    <PetRegistrationForm />
                </div>
            </div>
        </div>
    );
}
