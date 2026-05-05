/**
 * Paso 5: Completar datos de mascota
 * Post-pago: Datos complementarios para todas las mascotas registradas
 */

'use client';

import React, { useState, useEffect } from 'react';
import SelectWithInfo from '@/components/FormFields/SelectWithInfo';
import BreedAutocomplete from '@/components/FormFields/BreedAutocomplete';
import ColorAutocomplete from '@/components/FormFields/ColorAutocomplete';
import TextInput from '@/components/FormFields/TextInput';
import PetTypeSelector from '../PetTypeSelector';
import AgeInput from '../AgeInput';
import styles from './Step5CompletePet.module.css';

const genderOptions = [
    { value: 'macho', label: 'Macho' },
    { value: 'hembra', label: 'Hembra' }
];

interface Step5CompletePetProps {
    data: any;
    member: any;
    onNext: (data: any) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step5CompletePet({ data, onNext, showToast }: Step5CompletePetProps) {
    const [pets, setPets] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Inicializar mascotas basadas en Step 2
    useEffect(() => {
        if (!isLoaded) {
            const petBasicArray = Array.isArray(data?.petBasic) 
                ? data.petBasic 
                : (data?.petBasic ? [data.petBasic] : []);

            if (petBasicArray.length > 0) {
                const initialPets = petBasicArray.map((basic: any) => {
                    // Ver si ya hay datos completados para esta mascota (de un guardado previo)
                    const completedData = data?.petComplete?.find((p: any) => p.name === basic.petName) || {};
                    
                    const isMixed = completedData.isMixedBreed || 
                                   completedData.breed === 'Mestizo' || 
                                   completedData.breed === 'Doméstico' || 
                                   (basic.isMixed !== undefined ? basic.isMixed : true);

                    return {
                        name: basic.petName || '',
                        petType: basic.petType || 'perro',
                        age: basic.petAge || 0,
                        ageUnit: basic.petAgeUnit || 'years',
                        gender: completedData.gender || '',
                        breed: completedData.breed || (isMixed ? (basic.petType === 'gato' ? 'Doméstico' : 'Mestizo') : ''),
                        isMixedBreed: isMixed,
                        coatColor: completedData.coatColor || '',
                        noseColor: completedData.noseColor || '',
                        eyeColor: completedData.eyeColor || '',
                        isAdopted: completedData.isAdopted || false,
                        adoptionStory: completedData.adoptionStory || '',
                        primaryPhoto: null as File | null,
                        vetCertificate: null as File | null,
                    };
                });
                setPets(initialPets);
                setIsLoaded(true);
            } else {
                // Fallback si no hay petBasic (no debería pasar)
                setPets([{
                    name: '',
                    petType: 'perro',
                    age: 0,
                    ageUnit: 'years',
                    gender: '',
                    breed: '',
                    isMixedBreed: true,
                    coatColor: '',
                    noseColor: '',
                    eyeColor: '',
                    isAdopted: false,
                    adoptionStory: '',
                    primaryPhoto: null,
                    vetCertificate: null
                }]);
                setIsLoaded(true);
            }
        }
    }, [data, isLoaded]);

    const handlePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('La foto no debe superar 5MB', 'error');
                return;
            }
            const updatedPets = [...pets];
            updatedPets[index].primaryPhoto = file;
            setPets(updatedPets);
        }
    };

    const handleVetCertificateChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('El certificado no debe superar 5MB', 'error');
                return;
            }
            const updatedPets = [...pets];
            updatedPets[index].vetCertificate = file;
            setPets(updatedPets);
        }
    };

    const updatePetData = (index: number, newData: any) => {
        const updatedPets = [...pets];
        updatedPets[index] = { ...updatedPets[index], ...newData };
        setPets(updatedPets);
        
        // Limpiar errores si el campo actualizado tenía error
        if (errors[index]) {
            const updatedErrors = { ...errors };
            const keys = Object.keys(newData);
            keys.forEach(key => {
                if (updatedErrors[index][key]) {
                    delete updatedErrors[index][key];
                }
            });
            if (Object.keys(updatedErrors[index]).length === 0) {
                delete updatedErrors[index];
            }
            setErrors(updatedErrors);
        }
    };

    const handleBreedTypeChange = (index: number, type: 'mestizo' | 'raza') => {
        const pet = pets[index];
        const newData = {
            isMixedBreed: type === 'mestizo',
            breed: type === 'mestizo' ? (pet.petType === 'gato' ? 'Doméstico' : 'Mestizo') : ''
        };
        updatePetData(index, newData);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, Record<string, string>> = {};
        let isValid = true;

        pets.forEach((pet, index) => {
            const petErrors: Record<string, string> = {};
            
            if (!pet.gender) petErrors.gender = 'Selecciona el sexo';
            if (!pet.coatColor) petErrors.coatColor = 'Selecciona el color';
            if (!pet.isMixedBreed && !pet.breed) petErrors.breed = 'Selecciona la raza';
            
            // Si es mascota añadida aquí (no venía de Step 2, aunque ahora todas vienen de Step 2)
            if (!pet.name.trim()) petErrors.name = 'El nombre es requerido';

            if (Object.keys(petErrors).length > 0) {
                newErrors[index] = petErrors;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast('Completa los campos requeridos en todas las mascotas', 'error');
            return;
        }
        setIsLoading(true);
        await onNext(pets);
        setIsLoading(false);
    };

    return (
        <div className={styles.containerCenter}>
            <div className={styles.pageBackground} />
            
            <div className={styles.formCard}>
                <div className={styles.topProgressBar}>
                    <div className={styles.topProgressBarFill} style={{ width: '100%' }} />
                </div>

                <div className={styles.stepBadge}>
                    <img
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png"
                        alt="Club Pata Amiga Logo"
                        className={styles.stepBadgeLogo}
                    />
                    <div className={styles.stepBadgeText}>PASO 2 DE 2 (FINALIZA TU REGISTRO)</div>
                    <div className={styles.stepBadgeIcon} aria-hidden="true" />
                </div>

                <div className={styles.formHeader}>
                    <h2 className={styles.formTitle}>
                        FINALIZA EL REGISTRO DE TU MANADA 🐾
                    </h2>
                    <p className={styles.formSubtitle}>
                        Completa la información complementaria de tus peludos para activar sus beneficios
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.formBody}>
                    {pets.map((pet, index) => {
                        const isSenior = pet.ageUnit === 'years' ? pet.age >= 10 : pet.age >= 120;
                        
                        return (
                            <div key={index} className={`${styles.petSection} ${styles.fadeIn}`}>
                                <div className={styles.petHeader}>
                                    <div className={styles.petBadge}>
                                        {pet.petType === 'gato' ? '🐱' : '🐶'} {pet.name || `Mascota ${index + 1}`}
                                    </div>
                                </div>

                                <div className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Información general</h3>

                                    <SelectWithInfo
                                        label="Sexo"
                                        name={`gender-${index}`}
                                        value={pet.gender}
                                        onChange={(value) => updatePetData(index, { gender: value })}
                                        options={genderOptions}
                                        infoText=""
                                        error={errors[index]?.gender}
                                        required
                                    />

                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>
                                            Tipo de raza
                                            <span className={styles.required}> *</span>
                                        </label>
                                        <div className={styles.breedTypeSwitch}>
                                            <button
                                                type="button"
                                                className={`${styles.switchButton} ${pet.isMixedBreed ? styles.switchActive : ''}`}
                                                onClick={() => handleBreedTypeChange(index, 'mestizo')}
                                            >
                                                {pet.isMixedBreed && (
                                                    <span className={styles.switchIcon}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </span>
                                                )}
                                                {pet.petType === 'gato' ? 'Doméstico' : 'Mestizo'}
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.switchButton} ${!pet.isMixedBreed ? styles.switchActive : ''}`}
                                                onClick={() => handleBreedTypeChange(index, 'raza')}
                                            >
                                                {!pet.isMixedBreed && (
                                                    <span className={styles.switchIcon}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </span>
                                                )}
                                                Raza
                                            </button>
                                        </div>
                                    </div>

                                    {!pet.isMixedBreed && (
                                        <BreedAutocomplete
                                            label="Raza"
                                            name={`breed-${index}`}
                                            petType={pet.petType}
                                            value={pet.breed}
                                            onChange={(value) => {
                                                updatePetData(index, {
                                                    breed: value,
                                                    isMixedBreed: value === 'Mestizo' || value === 'Doméstico'
                                                });
                                            }}
                                            error={errors[index]?.breed}
                                            required
                                        />
                                    )}

                                    <div className={styles.adoptionSection}>
                                        <div className={styles.adoptionHeader}>
                                            <div className={styles.adoptionIcon}>🏠</div>
                                            <div>
                                                <h4 className={styles.adoptionTitle}>¿{pet.name} es adoptado?</h4>
                                                <p className={styles.adoptionSubtitle}>Nos encantaría conocer su origen</p>
                                            </div>
                                        </div>

                                        <div className={styles.adoptionCheckboxWrapper}>
                                            <label className={styles.adoptionCheckbox}>
                                                <input
                                                    type="checkbox"
                                                    checked={pet.isAdopted}
                                                    onChange={(e) => updatePetData(index, { isAdopted: e.target.checked })}
                                                />
                                                <span className={styles.adoptionCheckboxText}>¡Sí, es rescatada / adoptada!</span>
                                            </label>
                                        </div>

                                        <p className={styles.adoptionNotice}>
                                            ⚠️ AVISO: Al llenar la historia nos autorizas a publicarla en nuestras redes para inspirar a otros.
                                        </p>

                                        {pet.isAdopted && (
                                            <div className={styles.adoptionStoryWrapper}>
                                                <label className={styles.adoptionStoryLabel}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00BBB4' }}>
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                    </svg>
                                                    Cuéntanos su historia
                                                </label>
                                                <textarea
                                                    className={styles.adoptionTextarea}
                                                    placeholder="Ej: La encontramos en un refugio hace 2 años y desde entonces es la alegría de la casa..."
                                                    value={pet.adoptionStory}
                                                    onChange={(e) => updatePetData(index, { adoptionStory: e.target.value })}
                                                    maxLength={500}
                                                />
                                                <div className={styles.adoptionCharCount}>
                                                    <strong>{pet.adoptionStory.length}</strong> / 500 caracteres
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Características físicas</h3>

                                    <div className={styles.row}>
                                        <ColorAutocomplete
                                            label="Color de pelo"
                                            name={`coatColor-${index}`}
                                            category="coat"
                                            petType={pet.petType}
                                            value={pet.coatColor}
                                            onChange={(value) => updatePetData(index, { coatColor: value })}
                                            error={errors[index]?.coatColor}
                                            required
                                        />

                                        <ColorAutocomplete
                                            label="Color de nariz"
                                            name={`noseColor-${index}`}
                                            category="nose"
                                            petType={pet.petType}
                                            value={pet.noseColor}
                                            onChange={(value) => updatePetData(index, { noseColor: value })}
                                        />
                                    </div>

                                    <ColorAutocomplete
                                        label="Color de ojos"
                                        name={`eyeColor-${index}`}
                                        category="eye"
                                        petType={pet.petType}
                                        value={pet.eyeColor}
                                        onChange={(value) => updatePetData(index, { eyeColor: value })}
                                    />
                                </div>

                                <div className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Fotografía</h3>

                                    <label className={styles.fileUploadLabel}>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            onChange={(e) => handlePhotoChange(index, e)}
                                            className={styles.fileInput}
                                        />
                                        <div className={styles.fileUploadBox}>
                                            {pet.primaryPhoto ? (
                                                <>
                                                    <span className={styles.fileIcon}>✓</span>
                                                    <span className={styles.uploadText}>{pet.primaryPhoto.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={styles.fileIcon}>📷</span>
                                                    <span className={styles.uploadText}>Haz clic para subir foto</span>
                                                    <span className={styles.helpText}>JPG/PNG, máx 5MB</span>
                                                </>
                                            )}
                                        </div>
                                    </label>

                                    <p className={styles.helpText}>
                                        📅 Tienes 15 días para subir la foto desde tu cuenta si no la tienes ahora.
                                    </p>
                                </div>

                                {isSenior && (
                                    <div className={styles.alertBox}>
                                        <span className={styles.alertIcon}>⚕️</span>
                                        <div>
                                            <strong>Información sobre mascota senior</strong>
                                            <p>
                                                Como {pet.name} es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual para completar su registro. 🐾💙
                                            </p>
                                            <p className={styles.helpText}>
                                                Puedes subir su certificado médico vigente (no mayor a 3 meses) aquí mismo o enviarlo más tarde desde tu panel de usuario.
                                            </p>

                                            <label className={styles.fileUploadLabel}>
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/jpeg,image/png"
                                                    onChange={(e) => handleVetCertificateChange(index, e)}
                                                    className={styles.fileInput}
                                                />
                                                <div className={styles.fileUploadBox}>
                                                    {pet.vetCertificate ? (
                                                        <>
                                                            <span className={styles.fileIcon}>✓</span>
                                                            <span className={styles.uploadText}>{pet.vetCertificate.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className={styles.fileIcon}>📄</span>
                                                            <span className={styles.uploadText}>Subir certificado (opcional ahora)</span>
                                                            <span className={styles.helpText}>PDF/JPG/PNG, máx 5MB</span>
                                                        </>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                
                                {index < pets.length - 1 && <hr className={styles.divider} />}
                            </div>
                        );
                    })}

                    <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Finalizando...' : 'Completar registro ✓'}
                    </button>
                </form>
            </div>
        </div>
    );
}
