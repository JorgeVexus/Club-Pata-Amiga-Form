/**
 * Formulario Principal de Registro de Mascotas
 * Permite registrar hasta 3 mascotas con integración a Memberstack y Supabase
 */

'use client';

import React, { useState } from 'react';
import PetCard from './PetCard';
import {
    calculateWaitingPeriod,
    savePetsToMemberstack,
    updatePetPhotos,
    formatWaitingPeriodMessage
} from '@/services/pet.service';
import { uploadMultipleFiles } from '@/services/supabase.service';
import { syncPetStoriesToSupabase, registerPetsInSupabase } from '@/app/actions/user.actions';
import type { PetFormData } from '@/types/pet.types';
import styles from './PetRegistrationForm.module.css';

interface PetRegistrationFormProps {
    onSuccess?: () => void;
    onBack?: () => void;
}

export default function PetRegistrationForm({ onSuccess, onBack }: PetRegistrationFormProps = {}) {
    const [pets, setPets] = useState<Partial<PetFormData>[]>([
        {
            isOriginal: true,
            isActive: true,
            registrationDate: new Date().toISOString(),
        },
    ]);
    const [ambassadorCode, setAmbassadorCode] = useState('');
    const [ambassadorValidation, setAmbassadorValidation] = useState<{
        isValidating: boolean;
        isValid: boolean | null;
        ambassadorName: string;
        message: string;
    }>({ isValidating: false, isValid: null, ambassadorName: '', message: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState<string | null>(null);

    // Agregar otra mascota
    const handleAddPet = () => {
        if (pets.length < 3) {
            setPets([
                ...pets,
                {
                    isOriginal: true,
                    isActive: true,
                    registrationDate: new Date().toISOString(),
                },
            ]);
        }
    };

    // Eliminar mascota
    const handleRemovePet = (index: number) => {
        if (pets.length > 1) {
            const newPets = pets.filter((_, i) => i !== index);
            setPets(newPets);
        }
    };

    // Actualizar datos de una mascota
    const handleUpdatePet = (index: number, data: Partial<PetFormData>) => {
        const newPets = [...pets];
        newPets[index] = data;
        setPets(newPets);
    };

    // Validar código de embajador
    const validateAmbassadorCode = async (code: string) => {
        if (!code || code.trim().length < 3) {
            setAmbassadorValidation({ isValidating: false, isValid: null, ambassadorName: '', message: '' });
            return;
        }

        setAmbassadorValidation(prev => ({ ...prev, isValidating: true, message: 'Validando...' }));

        try {
            const response = await fetch(
                `https://app.pataamiga.mx/api/referrals/validate-code?code=${encodeURIComponent(code.trim())}`
            );
            const data = await response.json();

            if (data.success && data.valid) {
                setAmbassadorValidation({
                    isValidating: false,
                    isValid: true,
                    ambassadorName: data.ambassador_name || '',
                    message: `✅ Código válido - Referido por: ${data.ambassador_name}`
                });
            } else {
                setAmbassadorValidation({
                    isValidating: false,
                    isValid: false,
                    ambassadorName: '',
                    message: data.message || '❌ Código no válido'
                });
            }
        } catch (error) {
            console.error('Error validando código:', error);
            setAmbassadorValidation({
                isValidating: false,
                isValid: null,
                ambassadorName: '',
                message: '⚠️ No se pudo validar el código'
            });
        }
    };

    // Handler del input con debounce
    const handleAmbassadorCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value;
        setAmbassadorCode(code);

        // Debounce la validación
        const timeoutId = setTimeout(() => {
            validateAmbassadorCode(code);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    // Validar formulario
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Verificar que hay al menos 1 mascota registrada
        if (pets.length === 0 || !pets[0].name?.trim()) {
            newErrors['general'] = 'Debes registrar al menos una mascota para continuar';
        }

        pets.forEach((pet, index) => {
            const petNum = index + 1;

            if (!pet.name?.trim()) {
                newErrors[`pet-${petNum}-name`] = 'El nombre es requerido';
            }

            if (!pet.petType) {
                newErrors[`pet-${petNum}-type`] = 'Selecciona el tipo de mascota';
            }

            if (pet.isMixed === undefined) {
                newErrors[`pet-${petNum}-mixed`] = 'Indica si es mestizo';
            }

            if (!pet.isMixed && !pet.breed?.trim()) {
                newErrors[`pet-${petNum}-breed`] = 'La raza es requerida';
            }

            if (!pet.breedSize) {
                newErrors[`pet-${petNum}-size`] = 'El tamaño es requerido';
            }

            if (!pet.age) {
                newErrors[`pet-${petNum}-age`] = 'La edad es requerida';
            }

            if (pet.isAdopted === undefined) {
                newErrors[`pet-${petNum}-adopted`] = 'Indica si fue adoptado';
            }

            if (!pet.photos || pet.photos.length < 2) {
                newErrors[`pet-${petNum}-photos`] = 'Debes subir 2 fotos';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Enviar formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            // Mostrar popup con mensaje específico
            const hasPetData = pets.length > 0 && pets[0].name?.trim();
            if (!hasPetData) {
                setShowPopup('🐾 Debes registrar al menos una mascota con todos sus datos para continuar');
            } else {
                setShowPopup('📋 Por favor completa todos los campos requeridos');
            }
            setTimeout(() => setShowPopup(null), 5000); // Auto-cerrar después de 5s
            return;
        }

        setIsSubmitting(true);

        try {
            // Calcular períodos de carencia y preparar datos
            const petsWithCalculations: PetFormData[] = pets.map((pet) => {
                const calculation = calculateWaitingPeriod(
                    pet.isOriginal!,
                    pet.isAdopted || false,
                    !!pet.ruac,
                    pet.isMixed || false
                );

                return {
                    ...pet,
                    waitingPeriodDays: calculation.days,
                    waitingPeriodStart: new Date().toISOString(), // Mark start of waiting period
                    waitingPeriodEnd: calculation.endDate,
                } as PetFormData;
            });

            // 1. PRIMERO: Guardar datos principales en Memberstack (sin URLs de fotos)
            console.log('Guardando datos de mascotas en Memberstack...');
            const response = await savePetsToMemberstack(
                petsWithCalculations,
                ambassadorCode
            );

            if (!response.success) {
                throw new Error(response.error || 'Error al guardar las mascotas');
            }

            // 1.5 Sincronizar historias de adopción con Supabase
            try {
                const currentMember = await window.$memberstackDom.getCurrentMember();
                if (currentMember?.data?.id) {
                    await syncPetStoriesToSupabase(currentMember.data.id, {
                        pet1: petsWithCalculations[0]?.adoptionStory,
                        pet2: petsWithCalculations[1]?.adoptionStory,
                        pet3: petsWithCalculations[2]?.adoptionStory,
                    });
                }
            } catch (syncError) {
                console.error('Error no crítico sincronizando historias:', syncError);
            }

            // 2. SEGUNDO: Subir fotos a Supabase y actualizar URLs
            console.log('Subiendo fotos a Supabase...');

            const petsWithFinalData = [...petsWithCalculations];

            for (let i = 0; i < petsWithCalculations.length; i++) {
                const pet = petsWithCalculations[i];
                const tempUserId = `temp_${Date.now()}_pet${i}`;

                if (!pet.photos || pet.photos.length === 0) continue;

                const photoUploads = await uploadMultipleFiles(pet.photos, 'PET_PHOTO', tempUserId);

                if (photoUploads.some(u => !u.success)) continue;

                const photoUrls = photoUploads.map(u => u.publicUrl || '');
                petsWithFinalData[i].photo1Url = photoUrls[0] || '';
                petsWithFinalData[i].photo2Url = photoUrls[1] || '';

                await updatePetPhotos(i, photoUrls);

                // Subir certificado veterinario si excede la edad
                if (pet.exceedsMaxAge && pet.vetCertificate) {
                    const certUpload = await uploadMultipleFiles([pet.vetCertificate], 'VET_CERTIFICATE', tempUserId);
                    if (certUpload[0]?.success) {
                        const certUrl = certUpload[0].publicUrl || '';
                        petsWithFinalData[i].vetCertificateUrl = certUrl;
                        await window.$memberstackDom.updateMember({
                            customFields: { [`pet-${i + 1}-vet-certificate-url`]: certUrl },
                        });
                    }
                }
            }

            // 2.5 TERCERO: Registrar Mascotas en Supabase (Tabla pets)
            try {
                const currentMember = await window.$memberstackDom.getCurrentMember();
                if (currentMember?.data?.id) {
                    console.log('Sincronizando mascotas con la tabla public.pets en Supabase...');

                    // LIMPIEZA: Removemos los objetos File para que el Server Action no falle por tamaño/serialización
                    const cleanPetsData = petsWithFinalData.map(({ photos, vetCertificate, ...rest }) => ({
                        ...rest,
                        // Ya tenemos las URLs en photo1Url, photo2Url y vetCertificateUrl
                    }));

                    const syncResult = await registerPetsInSupabase(currentMember.data.id, cleanPetsData);
                    if (!syncResult.success) {
                        console.error('Error sincronizando mascotas en tabla pets:', syncResult.error);
                    }
                }
            } catch (syncError) {
                console.error('Error no crítico registrando mascotas en Supabase:', syncError);
            }

            // 3. Éxito - Redirigir a selección de plan
            alert('¡Mascotas registradas exitosamente! 🐾');
            console.log('✅ Registro de mascotas completado');

            // Llamar callback si existe, sino redirigir a la ruta anterior
            if (onSuccess) {
                onSuccess();
            } else {
                window.location.href = '/seleccion-plan';
            }

        } catch (error: any) {
            console.error('Error en el registro:', error);
            alert(error.message || 'Hubo un error al procesar tu registro. Por favor intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            {/* Header - Diseño Figma */}
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Ahora sí, cuéntanos de tus peludos
                    <span style={{ display: 'inline-flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E91E63"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E91E63"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </span>
                </h1>
                <p className={styles.subtitle}>
                    Puedes registrar hasta 3 compañeros de cuatro patas
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
                {/* Badge Esquina Superior Derecha (Naranja) */}
                <div className={styles.formBadge}>
                    <svg width="85" height="85" viewBox="0 0 85 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="42.5" cy="42.5" r="42.5" fill="#FF8300" />
                        <rect x="23" y="28" width="40" height="28" rx="4" stroke="white" strokeWidth="4" />
                        <circle cx="43" cy="42" r="8" stroke="white" strokeWidth="4" />
                        <path d="M55 24H31V28H55V24Z" fill="white" />
                        <rect x="52" y="32" width="6" height="4" rx="2" fill="white" />
                    </svg>
                </div>

                {/* Imagen Peludos Esquina Inferior Derecha */}
                <img
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698f84e6bfdd6719e9bd52aa_peludos-img.webp"
                    alt="Peludos"
                    className={styles.dogImage}
                />

                {/* Tarjetas de mascotas */}
                {pets.map((pet, index) => (
                    <PetCard
                        key={index}
                        petIndex={index}
                        petData={pet}
                        onUpdate={(data) => handleUpdatePet(index, data)}
                        onRemove={pets.length > 1 ? () => handleRemovePet(index) : undefined}
                        errors={errors}
                        canRemove={pets.length > 1}
                    />
                ))}

                {/* Botón agregar mascota */}
                {pets.length < 3 && (
                    <div className={styles.addPetWrapper}>
                        <button
                            type="button"
                            onClick={handleAddPet}
                            className={styles.addPetButton}
                            aria-label="Agregar otra mascota"
                        >
                            <span style={{ fontSize: '2rem', lineHeight: '1', fontWeight: 'bold' }}>+</span>
                        </button>
                        <p className={styles.addPetText}>
                            Agregar otro peludo
                        </p>
                    </div>
                )}

                {/* Código de embajador */}
                <div className={styles.ambassadorSection}>
                    <label htmlFor="ambassadorCode" className={styles.label}>
                        👥 ¿Alguien te invitó a la manada?
                    </label>
                    <input
                        id="ambassadorCode"
                        type="text"
                        value={ambassadorCode}
                        onChange={handleAmbassadorCodeChange}
                        placeholder="Código de embajador (Opcional)"
                        className={`${styles.input} ${ambassadorValidation.isValid === true ? styles.inputValid :
                            ambassadorValidation.isValid === false ? styles.inputInvalid : ''
                            }`}
                        style={{
                            borderColor: ambassadorValidation.isValid === true ? '#22C55E' :
                                ambassadorValidation.isValid === false ? '#EF4444' : undefined
                        }}
                    />
                    {ambassadorValidation.message && (
                        <p
                            className={styles.validationMessage}
                            style={{
                                color: ambassadorValidation.isValid === true ? '#166534' :
                                    ambassadorValidation.isValid === false ? '#991B1B' : '#666',
                                fontWeight: '600'
                            }}
                        >
                            {ambassadorValidation.message}
                        </p>
                    )}
                    {!ambassadorValidation.message && (
                        <p className={styles.helpText}>
                            Si un amigo embajador te compartió Club Pata Amiga, ingresa su código aquí
                        </p>
                    )}
                </div>

                {/* Error general (ej: sin mascotas registradas) */}
                {errors['general'] && (
                    <div className={styles.errorMessage} style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontWeight: 500
                    }}>
                        ⚠️ {errors['general']}
                    </div>
                )}

                {/* Botones de navegación */}
                <div className={styles.navigationButtons}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => window.history.back()}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className={styles.previousButton}
                        onClick={() => onBack ? onBack() : window.history.back()}
                    >
                        Anterior
                    </button>

                    <button
                        type="submit"
                        className={styles.nextButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : 'Siguiente'}
                    </button>
                </div>
            </form>
        </div>
    );
}
