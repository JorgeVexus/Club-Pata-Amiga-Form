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
import { syncPetStoriesToSupabase, registerPetsInSupabase, getPetsByUserId, getUserDataByMemberstackId, updateUserAmbassadorCode } from '@/app/actions/user.actions';
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
    const [isLoadingPets, setIsLoadingPets] = useState(true);
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

    // Cargar mascotas existentes desde Supabase al montar
    React.useEffect(() => {
        const loadExistingPets = async () => {
            try {
                // Esperar a que Memberstack cargue
                let attempts = 0;
                while (!window.$memberstackDom && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }

                if (!window.$memberstackDom) {
                    setIsLoadingPets(false);
                    return;
                }

                const { data: member } = await window.$memberstackDom.getCurrentMember();
                if (!member?.id) {
                    setIsLoadingPets(false);
                    return;
                }

                console.log('📥 Cargando mascotas existentes desde Supabase...');
                
                // Cargar mascotas
                const result = await getPetsByUserId(member.id);
                // Cargar datos del usuario (incluye código de embajador)
                const userResult = await getUserDataByMemberstackId(member.id);

                if (userResult.success && userResult.userData?.ambassador_code) {
                    setAmbassadorCode(userResult.userData.ambassador_code);
                    // Validar el código para mostrar el nombre del embajador
                    validateAmbassadorCode(userResult.userData.ambassador_code);
                }

                if (result.success && result.pets && result.pets.length > 0) {
                    console.log('✅ Mascotas cargadas:', result.pets);

                    // Mapear datos de Supabase al formato del formulario
                    const mappedPets: Partial<PetFormData>[] = result.pets.map((pet: any) => ({
                        name: pet.name || '',
                        petType: pet.breed?.toLowerCase().includes('gato') ? 'gato' : 'perro',
                        gender: pet.gender || '',
                        isMixed: pet.breed === 'Mestizo',
                        breed: pet.breed || '',
                        breedSize: pet.breed_size || '',
                        age: pet.age || '',
                        // No podemos recuperar los archivos File, solo las URLs
                        photo1Url: pet.photo_url || '',
                        photo2Url: pet.photo2_url || '',
                        vetCertificateUrl: pet.vet_certificate_url || '',
                        // Período de carencia
                        waitingPeriodEnd: pet.waiting_period_end || '',
                        waitingPeriodDays: pet.waiting_period_end 
                            ? Math.ceil((new Date(pet.waiting_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            : 0,
                        isOriginal: true,
                        isActive: pet.status !== 'inactive',
                        registrationDate: pet.created_at || new Date().toISOString(),
                    }));

                    setPets(mappedPets);
                }
            } catch (error) {
                console.error('Error cargando mascotas:', error);
            } finally {
                setIsLoadingPets(false);
            }
        };

        loadExistingPets();
    }, []);

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

            if (!pet.gender) {
                newErrors[`pet-${petNum}-gender`] = 'Selecciona el sexo de la mascota';
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

            // 1.6 Guardar código de embajador en Supabase
            if (ambassadorCode && ambassadorValidation.isValid) {
                try {
                    const currentMember = await window.$memberstackDom.getCurrentMember();
                    if (currentMember?.data?.id) {
                        await updateUserAmbassadorCode(currentMember.data.id, ambassadorCode);
                        console.log('✅ Código de embajador guardado en Supabase');
                    }
                } catch (ambassadorError) {
                    console.error('Error no crítico guardando código de embajador:', ambassadorError);
                }
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
            <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>
                    Ahora sí! Es momento de conocer a tus peludos
                    <span className={styles.titleHearts} aria-hidden="true">
                        😊💕
                    </span>
                </h2>
                <p className={styles.stepSubtitle}>
                    Puedes registrar hasta 3 compañeros de cuatro patas
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
                {/* Badge Esquina Superior Derecha (Naranja) */}
                <div className={styles.formBadge}>
                    <svg width="85" height="85" viewBox="0 0 85.0071 85.0071" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M42.5035 85.0071C65.9776 85.0071 85.0071 65.9776 85.0071 42.5035C85.0071 19.0295 65.9776 0 42.5035 0C19.0295 0 0 19.0295 0 42.5035C0 65.9776 19.0295 85.0071 42.5035 85.0071Z" fill="#FF8300" />
                        <path d="M16.6075 30.9406C15.5022 30.9406 14.6095 30.0479 14.6095 28.9427C14.6095 25.2442 17.6207 22.2331 21.3191 22.2331C22.4244 22.2331 23.3171 23.1258 23.3171 24.2311C23.3171 25.3363 22.4244 26.2291 21.3191 26.2291C19.8241 26.2291 18.6126 27.4406 18.6126 28.9356C18.6126 30.0408 17.7198 30.9336 16.6146 30.9336L16.6075 30.9406Z" fill="white" />
                        <path d="M68.3925 30.9407C67.2872 30.9407 66.3945 30.0479 66.3945 28.9427C66.3945 27.4477 65.183 26.2361 63.688 26.2361C62.5827 26.2361 61.69 25.3434 61.69 24.2381C61.69 23.1329 62.5827 22.2401 63.688 22.2401C67.3864 22.2401 70.3976 25.2513 70.3976 28.9497C70.3976 30.055 69.5049 30.9477 68.3996 30.9477L68.3925 30.9407Z" fill="white" />
                        <path d="M63.688 63.9006C62.5827 63.9006 61.69 63.0078 61.69 61.9026C61.69 60.7973 62.5827 59.9046 63.688 59.9046C65.183 59.9046 66.3945 58.693 66.3945 57.198C66.3945 56.0928 67.2872 55.2001 68.3925 55.2001C69.4978 55.2001 70.3905 56.0928 70.3905 57.198C70.3905 60.8965 67.3793 63.9076 63.6809 63.9076L63.688 63.9006Z" fill="white" />
                        <path d="M21.3191 63.9006C17.6207 63.9006 14.6095 60.8894 14.6095 57.191C14.6095 56.0857 15.5022 55.193 16.6075 55.193C17.7128 55.193 18.6055 56.0857 18.6055 57.191C18.6055 58.6859 19.817 59.8975 21.312 59.8975C22.4173 59.8975 23.31 60.7902 23.31 61.8955C23.31 63.0008 22.4173 63.8935 21.312 63.8935L21.3191 63.9006Z" fill="white" />
                        <path d="M16.6075 59.189C15.5022 59.189 14.6095 58.2962 14.6095 57.191V28.9427C14.6095 27.8374 15.5022 26.9447 16.6075 26.9447C17.7128 26.9447 18.6055 27.8374 18.6055 28.9427V57.191C18.6055 58.2962 17.7128 59.189 16.6075 59.189Z" fill="white" />
                        <path d="M68.3925 59.189C67.2872 59.189 66.3945 58.2962 66.3945 57.191V28.9427C66.3945 27.8374 67.2872 26.9447 68.3925 26.9447C69.4978 26.9447 70.3905 27.8374 70.3905 28.9427V57.191C70.3905 58.2962 69.4978 59.189 68.3925 59.189Z" fill="white" />
                        <path d="M63.688 63.9006H21.3191C20.2138 63.9006 19.3211 63.0078 19.3211 61.9026C19.3211 60.7973 20.2138 59.9046 21.3191 59.9046H63.688C64.7933 59.9046 65.686 60.7973 65.686 61.9026C65.686 63.0078 64.7933 63.9006 63.688 63.9006Z" fill="white" />
                        <path d="M63.688 26.2361H21.3191C20.2138 26.2361 19.3211 25.3434 19.3211 24.2381C19.3211 23.1329 20.2138 22.2401 21.3191 22.2401H63.688C64.7933 22.2401 65.686 23.1329 65.686 24.2381C65.686 25.3434 64.7933 26.2361 63.688 26.2361Z" fill="white" />
                        <path d="M58.9764 35.6522H47.208C46.1028 35.6522 45.2101 34.7595 45.2101 33.6542C45.2101 32.549 46.1028 31.6562 47.208 31.6562H58.9764C60.0817 31.6562 60.9744 32.549 60.9744 33.6542C60.9744 34.7595 60.0817 35.6522 58.9764 35.6522Z" fill="white" />
                        <path d="M54.2719 45.0683H47.208C46.1028 45.0683 45.2101 44.1756 45.2101 43.0703C45.2101 41.9651 46.1028 41.0723 47.208 41.0723H54.2719C55.3772 41.0723 56.2699 41.9651 56.2699 43.0703C56.2699 44.1756 55.3772 45.0683 54.2719 45.0683Z" fill="white" />
                        <path d="M33.0874 45.0684C29.389 45.0684 26.3778 42.0572 26.3778 38.3588C26.3778 34.6603 29.389 31.6492 33.0874 31.6492C36.7859 31.6492 39.797 34.6603 39.797 38.3588C39.797 42.0572 36.7859 45.0684 33.0874 45.0684ZM33.0874 35.6522C31.5925 35.6522 30.3809 36.8638 30.3809 38.3588C30.3809 39.8537 31.5925 41.0653 33.0874 41.0653C34.5824 41.0653 35.7939 39.8537 35.7939 38.3588C35.7939 36.8638 34.5824 35.6522 33.0874 35.6522Z" fill="white" />
                        <path d="M40.1442 52.1322C39.0389 52.1322 38.1462 51.2395 38.1462 50.1342C38.1462 47.3427 35.879 45.0754 33.0874 45.0754C31.9822 45.0754 31.0894 44.1827 31.0894 43.0774C31.0894 41.9722 31.9822 41.0794 33.0874 41.0794C38.0824 41.0794 42.1493 45.1463 42.1493 50.1413C42.1493 51.2466 41.2566 52.1393 40.1513 52.1393L40.1442 52.1322Z" fill="white" />
                        <path d="M26.0236 52.1322C24.9183 52.1322 24.0256 51.2395 24.0256 50.1342C24.0256 45.1392 28.0924 41.0723 33.0874 41.0723C34.1927 41.0723 35.0854 41.9651 35.0854 43.0703C35.0854 44.1756 34.1927 45.0683 33.0874 45.0683C30.2959 45.0683 28.0287 47.3356 28.0287 50.1271C28.0287 51.2324 27.136 52.1251 26.0307 52.1251L26.0236 52.1322Z" fill="white" />
                        <path d="M26.0236 54.4845C24.9183 54.4845 24.0256 53.5917 24.0256 52.4865V50.1342C24.0256 49.0289 24.9183 48.1362 26.0236 48.1362C27.1289 48.1362 28.0216 49.0289 28.0216 50.1342V52.4865C28.0216 53.5917 27.1289 54.4845 26.0236 54.4845Z" fill="white" />
                        <path d="M40.1442 54.4845C39.0389 54.4845 38.1462 53.5917 38.1462 52.4865V50.1342C38.1462 49.0289 39.0389 48.1362 40.1442 48.1362C41.2495 48.1362 42.1422 49.0289 42.1422 50.1342V52.4865C42.1422 53.5917 41.2495 54.4845 40.1442 54.4845Z" fill="white" />
                        <path d="M40.1442 54.4845H26.0236C24.9183 54.4845 24.0256 53.5917 24.0256 52.4865C24.0256 51.3812 24.9183 50.4885 26.0236 50.4885H40.1442C41.2495 50.4885 42.1422 51.3812 42.1422 52.4865C42.1422 53.5917 41.2495 54.4845 40.1442 54.4845Z" fill="white" />
                    </svg>
                </div>

                {/* Indicador de carga */}
                {isLoadingPets && (
                    <div className={styles.loadingPets}>
                        <div className={styles.spinner}></div>
                        <p>Cargando tus mascotas...</p>
                    </div>
                )}

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

                {/* Botón para agregar nueva mascota (si hay menos de 3) - Diseño Figma */}
                {pets.length < 3 && (
                    <div className={styles.addPetCard} onClick={handleAddPet}>
                        <div className={styles.addPetLeft}>
                            <div className={styles.addPetIcon}>
                                <img
                                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698f931826f8df80c7f6bd7d_huella%20plus.svg"
                                    alt="Agregar"
                                />
                            </div>
                            <div className={styles.addPetTexts}>
                                <p className={styles.addPetTitle}>Agregar otro peludo</p>
                                <p className={styles.addPetSubtitle}>Puedes registrar hasta 3</p>
                            </div>
                        </div>

                        {/* Lista de compañeros ya registrados */}
                        <div className={styles.addPetRight}>
                            <p className={styles.registeredLabel}>Compañeros registrados</p>
                            <div className={styles.registeredPetsList}>
                                {pets.map((pet, idx) => (
                                    <div key={idx} className={styles.petPill}>
                                        <span className={styles.petPillName}>
                                            {pet.name || `Peludo ${idx + 1}`}
                                        </span>
                                        <div className={styles.petPillIcon}>
                                            {pet.petType === 'gato' ? '🐱' : '🐶'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                        className={styles.cancelLink}
                        onClick={() => window.history.back()}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className={styles.previousButton}
                        onClick={() => onBack ? onBack() : window.history.back()}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Anterior
                    </button>

                    <button
                        type="submit"
                        className={styles.nextButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : 'Siguiente'}
                        <div className={styles.nextIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </button>
                </div>
            </form>
        </div>
    );
}
