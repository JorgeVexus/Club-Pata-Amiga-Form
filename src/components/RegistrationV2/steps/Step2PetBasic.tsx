/**
 * Paso 2: Datos básicos de mascota
 * Tipo, nombre, edad
 * Soporta múltiples mascotas (hasta 3)
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import PetTypeSelector from '../PetTypeSelector';
import AgeInput from '../AgeInput';
import styles from './Step2PetBasic.module.css';

interface PetBasicInfo {
    petType: 'perro' | 'gato' | '';
    petName: string;
    petAge: number;
    petAgeUnit: 'years' | 'months';
}

interface Step2PetBasicProps {
    data: any;
    member: any;
    onNext: (pets: Array<{ petType: 'perro' | 'gato'; petName: string; petAge: number; petAgeUnit: 'years' | 'months' }>) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step2PetBasic({ data, onNext, onBack, showToast }: Step2PetBasicProps) {
    const [pets, setPets] = useState<PetBasicInfo[]>([
        { petType: '', petName: '', petAge: 0, petAgeUnit: 'years' }
    ]);
    const [errors, setErrors] = useState<Record<string, string>[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar datos guardados al montar
    useEffect(() => {
        if (data?.petBasic && Array.isArray(data.petBasic) && data.petBasic.length > 0 && !isLoaded) {
            setPets(data.petBasic.map((p: any) => ({
                petType: p.petType || '',
                petName: p.petName || '',
                petAge: p.petAge || 0,
                petAgeUnit: p.petAgeUnit || 'years'
            })));
            setIsLoaded(true);
        } else if (data?.petBasic && !Array.isArray(data.petBasic) && !isLoaded) {
            // Fallback para datos viejos que no eran array
            setPets([{
                petType: data.petBasic.petType || '',
                petName: data.petBasic.petName || '',
                petAge: data.petBasic.petAge || 0,
                petAgeUnit: data.petBasic.petAgeUnit || 'years'
            }]);
            setIsLoaded(true);
        }
    }, [data, isLoaded]);

    const handleAddPet = () => {
        if (pets.length >= 3) {
            showToast('Máximo 3 mascotas permitidas', 'warning');
            return;
        }
        setPets([...pets, { petType: '', petName: '', petAge: 0, petAgeUnit: 'years' }]);
    };

    const handleRemovePet = (index: number) => {
        if (pets.length === 1) return;
        const newPets = pets.filter((_, i) => i !== index);
        setPets(newPets);
        
        // Limpiar errores asociados a ese índice
        if (errors[index]) {
            const newErrors = [...errors];
            newErrors.splice(index, 1);
            setErrors(newErrors);
        }
    };

    const updatePet = (index: number, field: keyof PetBasicInfo, value: any) => {
        setPets(prevPets => {
            const newPets = [...prevPets];
            if (newPets[index]) {
                newPets[index] = { ...newPets[index], [field]: value };
            }
            return newPets;
        });
        
        // Limpiar error del campo si existe
        if (errors[index]?.[field]) {
            setErrors(prevErrors => {
                const newErrors = [...prevErrors];
                if (newErrors[index]) {
                    newErrors[index] = { ...newErrors[index] };
                    delete newErrors[index][field];
                }
                return newErrors;
            });
        }
    };

    const updatePetMultiple = (index: number, updates: Partial<PetBasicInfo>) => {
        setPets(prevPets => {
            const newPets = [...prevPets];
            if (newPets[index]) {
                newPets[index] = { ...newPets[index], ...updates };
            }
            return newPets;
        });

        // Limpiar errores
        setErrors(prevErrors => {
            const newErrors = [...prevErrors];
            if (newErrors[index]) {
                newErrors[index] = { ...newErrors[index] };
                Object.keys(updates).forEach(field => {
                    delete newErrors[index][field];
                });
            }
            return newErrors;
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string>[] = [];
        let isValid = true;

        pets.forEach((pet, index) => {
            const petErrors: Record<string, string> = {};
            
            if (!pet.petType) {
                petErrors.petType = 'Selecciona el tipo';
                isValid = false;
            }

            if (!pet.petName.trim()) {
                petErrors.petName = 'El nombre es requerido';
                isValid = false;
            }

            if (!pet.petAge || pet.petAge <= 0) {
                petErrors.petAge = 'Ingresa la edad';
                isValid = false;
            } else {
                const totalMonths = pet.petAgeUnit === 'years' 
                    ? pet.petAge * 12 
                    : pet.petAge;
                
                if (totalMonths < 4) {
                    petErrors.petAge = 'Mínimo 4 meses';
                    isValid = false;
                }
            }

            newErrors[index] = petErrors;
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Completa todos los campos requeridos', 'error');
            return;
        }

        onNext(pets as Array<{ petType: 'perro' | 'gato'; petName: string; petAge: number; petAgeUnit: 'years' | 'months' }>);
    };

    return (
        <>
            <div className={styles.pageBackground} />
            <div className={styles.containerCenter}>
                <div className={styles.formColumn}>
                    <div className={styles.formCard}>
                        <div className={styles.topProgressBar} role="progressbar" aria-valuenow={66} aria-valuemin={0} aria-valuemax={100}>
                            <div className={styles.topProgressBarFill} style={{ width: '66.66%' }} />
                        </div>

                        <div className={styles.stepBadge}>
                            <img
                                src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png"
                                alt="Club Pata Amiga Logo"
                                className={styles.stepBadgeLogo}
                            />
                            <div className={styles.stepBadgeText}>PASO 2 DE 3</div>
                            <div className={styles.stepBadgeIcon} aria-hidden="true" />
                        </div>

                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>
                                CUÉNTANOS DE TU MANADA
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.formBody}>
                            {pets.map((pet, index) => (
                                <div key={index} className={styles.petCard}>
                                    <div className={styles.petCardHeader}>
                                        <div className={styles.petBadgeLabel}>
                                            🐾 Mascota {index + 1}
                                        </div>
                                        {pets.length > 1 && (
                                            <button 
                                                type="button" 
                                                className={styles.removePetButton}
                                                onClick={() => handleRemovePet(index)}
                                                title="Eliminar mascota"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    <div className={styles.petBasicFields}>
                                        <PetTypeSelector
                                            value={pet.petType}
                                            onChange={(value) => updatePet(index, 'petType', value)}
                                            error={errors[index]?.petType}
                                        />

                                        <TextInput
                                            label={pet.petType === 'gato' ? '¿CÓMO SE LLAMA TU MICHI?' : pet.petType === 'perro' ? '¿CÓMO SE LLAMA TU PELUDO?' : '¿CÓMO SE LLAMA?'}
                                            name={`petName-${index}`}
                                            value={pet.petName}
                                            onChange={(value) => updatePet(index, 'petName', value)}
                                            placeholder="Ej: Luna, Max..."
                                            error={errors[index]?.petName}
                                            required
                                        />

                                        <AgeInput
                                            value={pet.petAge}
                                            unit={pet.petAgeUnit}
                                            onChange={(value, unit) => {
                                                updatePetMultiple(index, { petAge: value, petAgeUnit: unit });
                                            }}
                                            error={errors[index]?.petAge}
                                        />

                                        {/* Puppy Warning */}
                                        {pet.petAge > 0 && (
                                            pet.petAgeUnit === 'months' ? pet.petAge < 4 : false
                                        ) && (
                                            <div className={`${styles.infoBox} ${styles.error}`}>
                                                <span className={styles.infoIcon}>❌</span>
                                                <p>La edad mínima debe ser superior a 4 meses.</p>
                                            </div>
                                        )}

                                        {/* Senior Warning */}
                                        {((pet.petAgeUnit === 'years' && pet.petAge >= 10) || 
                                          (pet.petAgeUnit === 'months' && pet.petAge >= 120)) && (
                                            <div className={`${styles.infoBox} ${styles.warning}`}>
                                                <span className={styles.infoIcon}>⚠️</span>
                                                <p>
                                                    Como es un peludito senior (10+ años), más adelante te vamos a pedir un poco más de información sobre su estado de salud. 🐾💙
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {pets.length < 3 && (
                                <button 
                                    type="button" 
                                    className={styles.addPetButton}
                                    onClick={handleAddPet}
                                >
                                    <span className={styles.addPetIcon}>+</span>
                                    Añadir otra mascota
                                </button>
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
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
