'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TextInput from '@/components/FormFields/TextInput';
import PetTypeSelector from '@/components/RegistrationV2/PetTypeSelector';
import AgeInput from '@/components/RegistrationV2/AgeInput';
import StepIndicator from '@/components/RegistrationV2/StepIndicator';
import BenefitsBanner from '@/components/RegistrationV2/BenefitsBanner';
import Toast from '@/components/UI/Toast';
import styles from './page.module.css';

export default function Paso2Mascota() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        petType: '' as 'perro' | 'gato' | '',
        petName: '',
        petAge: 0,
        petAgeUnit: 'years' as 'years' | 'months'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    useEffect(() => {
        // Verificar que vino del paso 1
        const step1Data = localStorage.getItem('registration_step1');
        if (!step1Data) {
            // Si no hay datos del paso 1, redirigir
            router.replace('/registro/paso-1-cuenta');
            return;
        }

        // Recuperar datos guardados si existen
        const savedData = localStorage.getItem('registration_step2');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Error parsing saved data:', e);
            }
        }
    }, [router]);

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.petType) {
            newErrors.petType = 'Selecciona el tipo de mascota';
        }

        if (!formData.petName.trim()) {
            newErrors.petName = 'El nombre de la mascota es requerido';
        } else if (formData.petName.length > 50) {
            newErrors.petName = 'El nombre no puede tener más de 50 caracteres';
        }

        if (!formData.petAge || formData.petAge <= 0) {
            newErrors.petAge = 'Ingresa la edad de tu mascota';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Por favor completa todos los campos', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Guardar en localStorage
            localStorage.setItem('registration_step2', JSON.stringify({
                ...formData,
                timestamp: new Date().toISOString()
            }));

            // Calcular si es senior (10+ años)
            const ageInYears = formData.petAgeUnit === 'years'
                ? formData.petAge
                : Math.floor(formData.petAge / 12);
            const isSenior = ageInYears >= 10;

            // Guardar metadata adicional
            localStorage.setItem('registration_pet_meta', JSON.stringify({
                isSenior,
                ageInYears,
                vetCertificateRequired: isSenior
            }));

            console.log('✅ Paso 2 completado:', formData);
            console.log('📝 Es mascota senior:', isSenior);

            // Redirigir al paso 3
            router.push('/registro/paso-3-plan');
        } catch (error: any) {
            console.error('Error:', error);
            showToast(error.message || 'Error al guardar datos', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        router.push('/registro/paso-1-cuenta');
    };

    return (
        <div className={styles.page}>
            <BenefitsBanner />

            <div className={styles.container}>
                <StepIndicator
                    currentStep={2}
                    totalSteps={3}
                    stepLabels={['Cuenta', 'Mascota', 'Plan']}
                />

                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Conócenos</h1>
                        <p className={styles.subtitle}>
                            Cuéntanos un poco sobre tu peludo amigo
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <PetTypeSelector
                            value={formData.petType}
                            onChange={(value) => setFormData({ ...formData, petType: value })}
                            error={errors.petType}
                        />

                        <TextInput
                            label={`¿Cómo se llama tu ${formData.petType === 'gato' ? 'gato' : formData.petType === 'perro' ? 'perro' : 'mascota'}?`}
                            name="petName"
                            value={formData.petName}
                            onChange={(value) => setFormData({ ...formData, petName: value })}
                            placeholder="Ej: Luna, Max, Pelusa..."
                            error={errors.petName}
                            required
                        />

                        <AgeInput
                            value={formData.petAge}
                            unit={formData.petAgeUnit}
                            onChange={(value, unit) => setFormData({ ...formData, petAge: value, petAgeUnit: unit })}
                            error={errors.petAge}
                        />

                        {formData.petAge > 0 && (
                            <div className={styles.infoBox}>
                                {(formData.petAgeUnit === 'years' ? formData.petAge : Math.floor(formData.petAge / 12)) >= 10 ? (
                                    <>
                                        <span className={styles.infoIcon}>⚠️</span>
                                        <p>
                                            Como es un peludito senior (10+ años), más adelante te vamos a pedir un poco más de información sobre su estado de salud actual. 🐾💙
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <span className={styles.infoIcon}>💡</span>
                                        <p>
                                            ¡Perfecto! Las fotos de tu mascota las podrás subir
                                            después desde tu cuenta. Tendrás 15 días para hacerlo.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        <div className={styles.buttons}>
                            <button
                                type="button"
                                className={styles.backButton}
                                onClick={handleBack}
                                disabled={isSubmitting}
                            >
                                ← Atrás
                            </button>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Guardando...' : 'Continuar'}
                                {!isSubmitting && <span>→</span>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
