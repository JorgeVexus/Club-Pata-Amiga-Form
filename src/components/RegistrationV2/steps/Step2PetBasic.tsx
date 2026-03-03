/**
 * Paso 2: Datos básicos de mascota
 * Tipo, nombre, edad
 * Carga datos si ya existen en Supabase
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import PetTypeSelector from '../PetTypeSelector';
import AgeInput from '../AgeInput';
import styles from './steps.module.css';

interface Step2PetBasicProps {
    data: any;
    member: any;
    onNext: (data: { petType: 'perro' | 'gato'; petName: string; petAge: number; petAgeUnit: 'years' | 'months' }) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step2PetBasic({ data, onNext, onBack, showToast }: Step2PetBasicProps) {
    // Cargar datos si ya existen (de Supabase)
    const [formData, setFormData] = useState({
        petType: '' as 'perro' | 'gato' | '',
        petName: '',
        petAge: 0,
        petAgeUnit: 'years' as 'years' | 'months'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar datos guardados al montar
    useEffect(() => {
        if (data?.petBasic && !isLoaded) {
            setFormData({
                petType: data.petBasic.petType || '',
                petName: data.petBasic.petName || '',
                petAge: data.petBasic.petAge || 0,
                petAgeUnit: data.petBasic.petAgeUnit || 'years'
            });
            setIsLoaded(true);
        }
    }, [data, isLoaded]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.petType) {
            newErrors.petType = 'Selecciona el tipo de mascota';
        }

        if (!formData.petName.trim()) {
            newErrors.petName = 'El nombre es requerido';
        }

        if (!formData.petAge || formData.petAge <= 0) {
            newErrors.petAge = 'Ingresa la edad';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Completa todos los campos', 'error');
            return;
        }

        onNext({
            petType: formData.petType as 'perro' | 'gato',
            petName: formData.petName,
            petAge: formData.petAge,
            petAgeUnit: formData.petAgeUnit
        });
    };

    const ageInYears = formData.petAgeUnit === 'years' 
        ? formData.petAge 
        : Math.floor(formData.petAge / 12);
    const isSenior = ageInYears >= 10;

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <h2 className={styles.title}>Cuéntanos de tu mascota</h2>
                <p className={styles.subtitle}>
                    Solo los datos esenciales para continuar
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <PetTypeSelector
                    value={formData.petType}
                    onChange={(value) => setFormData({ ...formData, petType: value })}
                    error={errors.petType}
                />

                <TextInput
                    label={formData.petType === 'gato' ? '¿Cómo se llama tu michi?' : formData.petType === 'perro' ? '¿Cómo se llama tu peludo?' : '¿Cómo se llama?'}
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
                    <div className={`${styles.infoBox} ${isSenior ? styles.warning : ''}`}>
                        {isSenior ? (
                            <>
                                <span>⚠️</span>
                                <p>
                                    Tu mascota califica como senior, después necesitaremos conocer el estado de salud de tu peludo
                                </p>
                            </>
                        ) : (
                            <>
                                <span>💡</span>
                                <p>
                                    Las fotos las podrás subir después desde tu cuenta. 
                                    Tendrás 15 días para hacerlo.
                                </p>
                            </>
                        )}
                    </div>
                )}

                <div className={styles.buttonRow}>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={onBack}
                    >
                        ← Atrás
                    </button>
                    <button
                        type="submit"
                        className={styles.primaryButton}
                    >
                        Continuar →
                    </button>
                </div>
            </form>
        </div>
    );
}
