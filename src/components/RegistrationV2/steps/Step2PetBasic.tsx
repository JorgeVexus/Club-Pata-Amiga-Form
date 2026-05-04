/**
 * Paso 2: Datos básicos de mascota
 * Tipo, nombre, edad
 * Carga datos si ya existen en Supabase
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import PetTypeSelector from '../PetTypeSelector';
import AgeInput from '../AgeInput';
import BenefitsMarquee from '../BenefitsMarquee';
import styles from './Step2PetBasic.module.css';
import { 
    BadgeCheckIcon, 
    MedicalEmergencyIcon, 
    VaccinationIcon, 
    DeceasedSupportIcon, 
    VetChatIcon,
    CommunityIcon 
} from '../RegistrationIcons';

interface Step2PetBasicProps {
    data: any;
    member: any;
    onNext: (data: { petType: 'perro' | 'gato'; petName: string; petAge: number; petAgeUnit: 'years' | 'months' }) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step2PetBasic({ data, onNext, onBack, showToast }: Step2PetBasicProps) {
    const [formData, setFormData] = useState({
        petType: '' as 'perro' | 'gato' | '',
        petName: '',
        petAge: 0,
        petAgeUnit: 'years' as 'years' | 'months'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const benefitsRef = useRef<HTMLDivElement>(null);

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
        } else {
            const totalMonths = formData.petAgeUnit === 'years' 
                ? formData.petAge * 12 
                : formData.petAge;
            
            if (totalMonths < 4) {
                newErrors.petAge = 'La edad mínima debe ser de 4 meses';
            }
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

    const scrollToBenefits = () => {
        if (benefitsRef.current) {
            benefitsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <div className={styles.pageBackground} />
            <div className={styles.containerCenter}>
                {/* Right Column: Form Column - Now Centered */}
                <div className={styles.formColumn}>
                    <div className={styles.formCard}>
                        {/* Barra superior de progreso técnica */}
                        <div className={styles.topProgressBar} role="progressbar" aria-valuenow={66} aria-valuemin={0} aria-valuemax={100}>
                            <div className={styles.topProgressBarFill} style={{ width: '66.66%' }} />
                        </div>

                        {/* Badge de paso */}
                        <div className={styles.stepBadge}>
                            <img
                                src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png"
                                alt="Club Pata Amiga Logo"
                                className={styles.stepBadgeLogo}
                            />
                            <div className={styles.stepBadgeText}>PASO 2 DE 3</div>
                            <div className={styles.stepBadgeIcon} aria-hidden="true" />
                        </div>

                        {/* Header */}
                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>
                                CUÉNTANOS DE TU MASCOTA
                            </h2>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className={styles.formBody}>
                            <PetTypeSelector
                                value={formData.petType}
                                onChange={(value) => setFormData({ ...formData, petType: value })}
                                error={errors.petType}
                            />

                            <TextInput
                                label={formData.petType === 'gato' ? '¿CÓMO SE LLAMA TU MICHI?' : formData.petType === 'perro' ? '¿CÓMO SE LLAMA TU PELUDO?' : '¿CÓMO SE LLAMA?'}
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

                            {/* Puppy/Too Young Warning */}
                            {formData.petAge > 0 && (
                                formData.petAgeUnit === 'months' ? formData.petAge < 4 : false
                            ) && (
                                <div className={`${styles.infoBox} ${styles.error}`}>
                                    <span className={styles.infoIcon}>❌</span>
                                    <p>
                                        La edad mínima de tu peludo debe ser superior a 4 meses para poder registrarse.
                                    </p>
                                </div>
                            )}

                            {/* Senior Warning */}
                            {((formData.petAgeUnit === 'years' && formData.petAge >= 10) || 
                              (formData.petAgeUnit === 'months' && formData.petAge >= 120)) && (
                                <div className={`${styles.infoBox} ${styles.warning}`}>
                                    <span className={styles.infoIcon}>⚠️</span>
                                    <p>
                                        Como es un peludito senior (10+ años), más adelante te vamos a pedir un poco más de información sobre su estado de salud actual. 🐾💙
                                    </p>
                                </div>
                            )}

                            <div className={styles.buttonRow}>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={onBack}
                                >
                                    ← ATRÁS
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryButton}
                                >
                                    CONTINUAR →
                                </button>
                            </div>

                            <div className={styles.infoNote}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                                </svg>
                                <span>Desde tu perfil podrás registrar a tus otras dos mascotas</span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
