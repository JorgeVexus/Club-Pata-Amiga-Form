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
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Validar formulario
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

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
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        setIsSubmitting(true);

        try {
            // Calcular períodos de carencia y preparar datos
            const petsWithCalculations: PetFormData[] = pets.map((pet) => {
                const calculation = calculateWaitingPeriod(
                    pet.isOriginal!,
                    pet.isAdopted || false,
                    !!pet.ruac
                );

                return {
                    ...pet,
                    waitingPeriodDays: calculation.days,
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

            // 2. SEGUNDO: Subir fotos a Supabase y actualizar URLs
            console.log('Subiendo fotos a Supabase...');
            console.log('🔍 DEBUG: petsWithCalculations:', petsWithCalculations.map(p => ({
                name: p.name,
                photosCount: p.photos?.length || 0,
                photos: p.photos
            })));

            for (let i = 0; i < petsWithCalculations.length; i++) {
                const pet = petsWithCalculations[i];
                const tempUserId = `temp_${Date.now()}_pet${i}`;

                // Subir fotos de la mascota
                if (!pet.photos || pet.photos.length === 0) {
                    console.warn(`⚠️ Mascota ${i + 1} no tiene fotos. pet.photos:`, pet.photos);
                    continue;
                }

                console.log(`📸 Subiendo ${pet.photos.length} fotos para mascota ${i + 1}...`);
                const photoUploads = await uploadMultipleFiles(
                    pet.photos,
                    'PET_PHOTO',
                    tempUserId
                );

                if (photoUploads.some(u => !u.success)) {
                    console.error(`Error al subir fotos de la mascota ${i + 1}`);
                    // Continuar con las demás mascotas aunque falle una
                    continue;
                }

                // Actualizar URLs de fotos en Memberstack
                const photoUrls = photoUploads.map(u => u.publicUrl || '');
                console.log(`✅ Actualizando URLs de fotos para mascota ${i + 1}:`, photoUrls);
                await updatePetPhotos(i, photoUrls);

                // Subir certificado veterinario si excede la edad
                if (pet.exceedsMaxAge && pet.vetCertificate) {
                    console.log(`Subiendo certificado veterinario para mascota ${i + 1}...`);
                    const certUpload = await uploadMultipleFiles(
                        [pet.vetCertificate],
                        'VET_CERTIFICATE',
                        tempUserId
                    );

                    if (certUpload[0]?.success) {
                        // Actualizar URL del certificado en Memberstack
                        const petNum = i + 1;
                        await window.$memberstackDom.updateMember({
                            customFields: {
                                [`pet-${petNum}-vet-certificate-url`]: certUpload[0].publicUrl || '',
                            },
                        });
                        console.log(`✅ Certificado veterinario subido para mascota ${i + 1}`);
                    } else {
                        console.error(`Error al subir certificado de mascota ${i + 1}`);
                    }
                }
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
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Ahora sí, cuéntanos de tus peludos</h1>
                <p className={styles.subtitle}>
                    Puedes registrar hasta 3 compañeros de cuatro patas
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
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
                            <span className={styles.plusIcon}>+</span>
                        </button>
                        <p className={styles.addPetText}>
                            Agregar otro peludo (Puedes registrar hasta 3)
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
                        onChange={(e) => setAmbassadorCode(e.target.value)}
                        placeholder="Código de embajador (Opcional)"
                        className={styles.input}
                    />
                    <p className={styles.helpText}>
                        Si un amigo embajador te compartió Club Pata Amiga, ingresa su código aquí
                    </p>
                </div>

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
