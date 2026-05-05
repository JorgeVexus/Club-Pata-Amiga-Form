/**
 * Paso 5: Completar datos de mascota
 * Post-pago: Datos complementarios
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
    const petBasic = data?.petBasic;
    const petType = petBasic?.petType === 'gato' ? 'gato' : 'perro';

    const isSenior = petBasic?.petAgeUnit === 'years'
        ? petBasic?.petAge >= 10
        : Math.floor(petBasic?.petAge / 12) >= 10;

    const [breedType, setBreedType] = useState<'mestizo' | 'raza'>('raza');

    const [pets, setPets] = useState<any[]>([{
        gender: '',
        breed: '',
        isMixedBreed: false,
        coatColor: '',
        noseColor: '',
        eyeColor: '',
        isAdopted: false,
        adoptionStory: '',
        primaryPhoto: null as File | null,
        vetCertificate: null as File | null,
        // Campos básicos para mascotas extra
        name: '',
        petType: 'perro',
        age: 0,
        ageUnit: 'years'
    }]);

    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (data?.petComplete && !isLoaded) {
            const pet = data.petComplete;
            const isMixed = pet.isMixedBreed || pet.breed === 'Mestizo' || pet.breed === 'Doméstico';

            const updatedPets = [...pets];
            updatedPets[0] = {
                ...updatedPets[0],
                gender: pet.gender || '',
                breed: pet.breed || '',
                isMixedBreed: isMixed,
                coatColor: pet.coatColor || '',
                noseColor: pet.noseColor || '',
                eyeColor: pet.eyeColor || '',
                isAdopted: pet.isAdopted || false,
                adoptionStory: pet.adoptionStory || '',
            };
            setPets(updatedPets);

            setBreedType(isMixed ? 'mestizo' : 'raza');
            setIsLoaded(true);
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
    };

    const addExtraPet = () => {
        if (pets.length >= 3) {
            showToast('Máximo 3 mascotas permitidas', 'warning');
            return;
        }
        setPets([...pets, {
            name: '',
            petType: 'perro',
            age: 0,
            ageUnit: 'years',
            gender: '',
            breed: '',
            isMixedBreed: false,
            coatColor: '',
            noseColor: '',
            eyeColor: '',
            isAdopted: false,
            adoptionStory: '',
            primaryPhoto: null,
            vetCertificate: null
        }]);
    };

    const removePet = (index: number) => {
        if (index === 0) return;
        const updatedPets = pets.filter((_, i) => i !== index);
        setPets(updatedPets);
        
        const updatedErrors = { ...errors };
        delete updatedErrors[index];
        setErrors(updatedErrors);
    };

    const handleBreedTypeChange = (index: number, type: 'mestizo' | 'raza') => {
        if (index === 0) setBreedType(type);
        
        const currentPetType = index === 0 ? petType : pets[index].petType;
        
        const newData = {
            isMixedBreed: type === 'mestizo',
            breed: type === 'mestizo' ? (currentPetType === 'gato' ? 'Doméstico' : 'Mestizo') : ''
        };
        updatePetData(index, newData);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, Record<string, string>> = {};
        let isValid = true;

        pets.forEach((pet, index) => {
            const petErrors: Record<string, string> = {};
            
            // Validaciones para todas las mascotas
            if (!pet.gender) petErrors.gender = 'Selecciona el sexo';
            if (!pet.coatColor) petErrors.coatColor = 'Selecciona el color';
            
            // Validaciones específicas para mascotas extra
            if (index > 0) {
                if (!pet.name.trim()) petErrors.name = 'El nombre es requerido';
                if (!pet.age || pet.age <= 0) petErrors.age = 'Ingresa la edad';
                // Validación de raza para extras si no es mestizo
                if (!pet.isMixedBreed && !pet.breed) petErrors.breed = 'Selecciona la raza';
            } else {
                // Validación de raza para la mascota principal
                if (breedType === 'raza' && !pet.breed) petErrors.breed = 'Selecciona la raza';
            }

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
        // Enviamos el arreglo completo de mascotas
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
                        {petBasic?.petName
                            ? <>Completa los datos de {petType === 'gato' ? '🐱' : '🐶'} <em style={{ fontStyle: 'normal', color: '#00BBB4' }}>{petBasic.petName}</em></>
                            : 'Completa los datos de tu mascota'
                        }
                    </h2>
                    <p className={styles.formSubtitle}>
                        Estos datos nos ayudan a identificar a tu peludo amigo
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.formBody}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Información general</h3>

                        <SelectWithInfo
                            label="Sexo"
                            name="gender"
                            value={pets[0].gender}
                            onChange={(value) => updatePetData(0, { gender: value })}
                            options={genderOptions}
                            infoText=""
                            error={errors[0]?.gender}
                            required
                        />

                        <div className={styles.fieldWrapper}>
                            <label className={styles.label}>
                                Tipo
                                <span className={styles.required}> *</span>
                            </label>
                            <div className={styles.breedTypeSwitch}>
                                <button
                                    type="button"
                                    className={`${styles.switchButton} ${pets[0].isMixedBreed ? styles.switchActive : ''}`}
                                    onClick={() => handleBreedTypeChange(0, 'mestizo')}
                                >
                                    {pets[0].isMixedBreed && (
                                        <span className={styles.switchIcon}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                    )}
                                    {petType === 'gato' ? 'Doméstico' : 'Mestizo'}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.switchButton} ${!pets[0].isMixedBreed ? styles.switchActive : ''}`}
                                    onClick={() => handleBreedTypeChange(0, 'raza')}
                                >
                                    {!pets[0].isMixedBreed && (
                                        <span className={styles.switchIcon}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                    )}
                                    Raza
                                </button>
                            </div>
                            <p className={styles.helpText}>
                                Selecciona si tu mascota es {petType === 'gato' ? 'doméstica' : 'mestiza'} o de raza definida
                            </p>
                        </div>

                        {breedType === 'raza' && (
                            <BreedAutocomplete
                                label="Raza"
                                name="breed"
                                petType={petType}
                                value={pets[0].breed}
                                onChange={(value) => {
                                    updatePetData(0, {
                                        breed: value,
                                        isMixedBreed: value === 'Mestizo' || value === 'Doméstico'
                                    });
                                }}
                                error={errors[0]?.breed}
                                required
                            />
                        )}

                        <div className={`${styles.adoptionSection} ${styles.fadeIn}`}>
                            <div className={styles.adoptionHeader}>
                                <div className={styles.adoptionIcon}>🏠</div>
                                <div>
                                    <h4 className={styles.adoptionTitle}>¿Tu mascota es adoptada?</h4>
                                    <p className={styles.adoptionSubtitle}>Nos encantaría conocer su origen</p>
                                </div>
                            </div>

                            <div className={styles.adoptionCheckboxWrapper}>
                                <label className={styles.adoptionCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={pets[0].isAdopted}
                                        onChange={(e) => updatePetData(0, { isAdopted: e.target.checked })}
                                    />
                                    <span className={styles.adoptionCheckboxText}>¡Sí, es rescatada / adoptada!</span>
                                </label>
                            </div>

                            <p className={styles.adoptionNotice}>
                                ⚠️ AVISO: Al llenar la historia nos autorizas a publicarla en nuestras redes para inspirar a otros.
                            </p>

                            {pets[0].isAdopted && (
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
                                        value={pets[0].adoptionStory}
                                        onChange={(e) => updatePetData(0, { adoptionStory: e.target.value })}
                                        maxLength={500}
                                    />
                                    <div className={styles.adoptionCharCount}>
                                        <strong>{pets[0].adoptionStory.length}</strong> / 500 caracteres
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
                                name="coatColor"
                                category="coat"
                                petType={petType}
                                value={pets[0].coatColor}
                                onChange={(value) => updatePetData(0, { coatColor: value })}
                                error={errors[0]?.coatColor}
                                required
                            />

                            <ColorAutocomplete
                                label="Color de nariz"
                                name="noseColor"
                                category="nose"
                                petType={petType}
                                value={pets[0].noseColor}
                                onChange={(value) => updatePetData(0, { noseColor: value })}
                            />
                        </div>

                        <ColorAutocomplete
                            label="Color de ojos"
                            name="eyeColor"
                            category="eye"
                            petType={petType}
                            value={pets[0].eyeColor}
                            onChange={(value) => updatePetData(0, { eyeColor: value })}
                        />
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Fotografía</h3>

                        <label className={styles.fileUploadLabel}>
                            <input
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={(e) => handlePhotoChange(0, e)}
                                className={styles.fileInput}
                            />
                            <div className={styles.fileUploadBox}>
                                {pets[0].primaryPhoto ? (
                                    <>
                                        <span className={styles.fileIcon}>✓</span>
                                        <span className={styles.uploadText}>{pets[0].primaryPhoto.name}</span>
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
                                    Como es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual para completar su registro. Puedes subir su certificado médico aquí mismo o después desde tu cuenta. 🐾💙
                                </p>

                                <label className={styles.fileUploadLabel}>
                                    <input
                                        type="file"
                                        accept=".pdf,image/jpeg,image/png"
                                        onChange={(e) => handleVetCertificateChange(0, e)}
                                        className={styles.fileInput}
                                    />
                                    <div className={styles.fileUploadBox}>
                                        {pets[0].vetCertificate ? (
                                            <>
                                                <span className={styles.fileIcon}>✓</span>
                                                <span className={styles.uploadText}>{pets[0].vetCertificate.name}</span>
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

                    {/* Mascotas Extra */}
                    {pets.slice(1).map((pet, index) => {
                        const actualIndex = index + 1;
                        const isExtraPetSenior = pet.ageUnit === 'years' ? pet.age >= 10 : pet.age >= 120;

                        return (
                            <div key={actualIndex} className={`${styles.extraPetSection} ${styles.fadeIn}`}>
                                <div className={styles.extraPetHeader}>
                                    <h3 className={styles.sectionTitle}>Mascota extra #{actualIndex + 1}</h3>
                                    <button
                                        type="button"
                                        className={styles.removePetButton}
                                        onClick={() => removePet(actualIndex)}
                                        title="Eliminar mascota"
                                    >
                                        ×
                                    </button>
                                </div>

                                <TextInput
                                    label="Nombre de la mascota"
                                    name={`pet-name-${actualIndex}`}
                                    value={pet.name}
                                    onChange={(val) => updatePetData(actualIndex, { name: val })}
                                    placeholder="Nombre"
                                    error={errors[actualIndex]?.name}
                                    required
                                />

                                <div className={styles.row}>
                                    <PetTypeSelector
                                        value={pet.petType}
                                        onChange={(val) => updatePetData(actualIndex, { 
                                            petType: val, 
                                            breed: val === 'gato' ? 'Doméstico' : 'Mestizo', 
                                            isMixedBreed: true 
                                        })}
                                        error={errors[actualIndex]?.petType}
                                    />
                                    <AgeInput
                                        value={pet.age}
                                        unit={pet.ageUnit}
                                        onChange={(val, unit) => updatePetData(actualIndex, { age: val, ageUnit: unit })}
                                        error={errors[actualIndex]?.age}
                                    />
                                    {((pet.ageUnit === 'years' && pet.age >= 10) || 
                                      (pet.ageUnit === 'months' && pet.age >= 120)) && (
                                        <div className={`${styles.infoBox} ${styles.warning}`} style={{ marginTop: '-10px', marginBottom: '10px' }}>
                                            <span className={styles.infoIcon}>⚠️</span>
                                            <p style={{ fontSize: '0.85rem', margin: 0 }}>
                                                Como es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual. Puedes subir su certificado médico aquí mismo o después desde tu cuenta. 🐾💙
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <SelectWithInfo
                                    label="Sexo"
                                    name={`gender-${actualIndex}`}
                                    value={pet.gender}
                                    onChange={(val) => updatePetData(actualIndex, { gender: val })}
                                    options={genderOptions}
                                    infoText=""
                                    error={errors[actualIndex]?.gender}
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
                                            onClick={() => handleBreedTypeChange(actualIndex, 'mestizo')}
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
                                            onClick={() => handleBreedTypeChange(actualIndex, 'raza')}
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
                                        name={`breed-${actualIndex}`}
                                        petType={pet.petType as 'perro' | 'gato'}
                                        value={pet.breed}
                                        onChange={(val) => updatePetData(actualIndex, { 
                                            breed: val,
                                            isMixedBreed: val === 'Mestizo' || val === 'Doméstico'
                                        })}
                                        error={errors[actualIndex]?.breed}
                                        required
                                    />
                                )}
                                
                                <div className={styles.adoptionSection}>
                                    <div className={styles.adoptionHeader}>
                                        <div className={styles.adoptionIcon}>🏠</div>
                                        <div>
                                            <h4 className={styles.adoptionTitle}>¿Tu mascota es adoptada?</h4>
                                            <p className={styles.adoptionSubtitle}>Nos encantaría conocer su origen</p>
                                        </div>
                                    </div>

                                    <div className={styles.adoptionCheckboxWrapper}>
                                        <label className={styles.adoptionCheckbox}>
                                            <input
                                                type="checkbox"
                                                checked={pet.isAdopted}
                                                onChange={(e) => updatePetData(actualIndex, { isAdopted: e.target.checked })}
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
                                                value={pet.adoptionStory || ''}
                                                onChange={(e) => updatePetData(actualIndex, { adoptionStory: e.target.value })}
                                                maxLength={500}
                                            />
                                            <div className={styles.adoptionCharCount}>
                                                <strong>{(pet.adoptionStory || '').length}</strong> / 500 caracteres
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.row}>
                                    <ColorAutocomplete
                                        label="Color de pelo"
                                        name={`coatColor-${actualIndex}`}
                                        category="coat"
                                        petType={pet.petType as 'perro' | 'gato'}
                                        value={pet.coatColor}
                                        onChange={(val) => updatePetData(actualIndex, { coatColor: val })}
                                        error={errors[actualIndex]?.coatColor}
                                        required
                                    />
                                    <ColorAutocomplete
                                        label="Color de nariz"
                                        name={`noseColor-${actualIndex}`}
                                        category="nose"
                                        petType={pet.petType as 'perro' | 'gato'}
                                        value={pet.noseColor}
                                        onChange={(val) => updatePetData(actualIndex, { noseColor: val })}
                                    />
                                </div>

                                <ColorAutocomplete
                                    label="Color de ojos"
                                    name={`eyeColor-${actualIndex}`}
                                    category="eye"
                                    petType={pet.petType as 'perro' | 'gato'}
                                    value={pet.eyeColor}
                                    onChange={(val) => updatePetData(actualIndex, { eyeColor: val })}
                                />

                                <div className={styles.fileUploadWrapper}>
                                    <label className={styles.label}>Fotografía</label>
                                    <label className={styles.fileUploadLabel}>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            onChange={(e) => handlePhotoChange(actualIndex, e)}
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
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {isExtraPetSenior && (
                                    <div className={styles.alertBox}>
                                        <span className={styles.alertIcon}>⚕️</span>
                                        <div>
                                            <strong>Información sobre mascota senior</strong>
                                            <p>
                                                Como es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual para completar su registro. Puedes subir su certificado médico aquí mismo o después desde tu cuenta. 🐾💙
                                            </p>
                                            <label className={styles.fileUploadLabel}>
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/jpeg,image/png"
                                                    onChange={(e) => handleVetCertificateChange(actualIndex, e)}
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
                                                            <span className={styles.uploadText}>Subir certificado</span>
                                                        </>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Botón Añadir otra mascota */}
                    {pets.length < 3 && (
                        <div className={styles.addPetContainer}>
                            <button
                                type="button"
                                className={styles.addPetButton}
                                onClick={addExtraPet}
                            >
                                +
                            </button>
                            <span className={styles.addPetLabel}>Añadir otra mascota</span>
                        </div>
                    )}

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
