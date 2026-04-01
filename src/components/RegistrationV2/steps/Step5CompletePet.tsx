/**
 * Paso 5: Completar datos de mascota
 * Post-pago: Datos complementarios
 * Carga datos si ya existen
 */

'use client';

import React, { useState, useEffect } from 'react';
import SelectWithInfo from '@/components/FormFields/SelectWithInfo';
import BreedAutocomplete from '@/components/FormFields/BreedAutocomplete';
import ColorAutocomplete from '@/components/FormFields/ColorAutocomplete';
import styles from './steps.module.css';

// Opciones básicas
const genderOptions = [
    { value: 'macho', label: 'Macho' },
    { value: 'hembra', label: 'Hembra' }
];

// Eliminamos colorOptions ya que ahora usamos autocompletado

interface Step5CompletePetProps {
    data: any;
    member: any;
    onNext: (data: any) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step5CompletePet({ data, onNext, showToast }: Step5CompletePetProps) {
    const petBasic = data?.petBasic;
    const isSenior = petBasic?.petAgeUnit === 'years'
        ? petBasic?.petAge >= 10
        : Math.floor(petBasic?.petAge / 12) >= 10;

    // Tipo de raza: 'mestizo' | 'raza'
    const [breedType, setBreedType] = useState<'mestizo' | 'raza'>('raza');

    const [formData, setFormData] = useState({
        gender: '',
        breed: '',
        isMixedBreed: false,
        coatColor: '',
        noseColor: '',
        eyeColor: '',
        isAdopted: false,
        adoptionStory: '',
        primaryPhoto: null as File | null,
        vetCertificate: null as File | null
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar datos guardados
    useEffect(() => {
        if (data?.petComplete && !isLoaded) {
            const pet = data.petComplete;
            const isMixed = pet.isMixedBreed || pet.breed === 'Mestizo';

            setFormData(prev => ({
                ...prev,
                gender: pet.gender || '',
                breed: pet.breed || '',
                isMixedBreed: isMixed,
                coatColor: pet.coatColor || '',
                noseColor: pet.noseColor || '',
                eyeColor: pet.eyeColor || '',
                isAdopted: pet.isAdopted || false,
                adoptionStory: pet.adoptionStory || '',
            }));

            setBreedType(isMixed ? 'mestizo' : 'raza');
            setIsLoaded(true);
        }
    }, [data, isLoaded]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('La foto no debe superar 5MB', 'error');
                return;
            }
            setFormData(prev => ({ ...prev, primaryPhoto: file }));
        }
    };

    const handleVetCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('El certificado no debe superar 5MB', 'error');
                return;
            }
            setFormData(prev => ({ ...prev, vetCertificate: file }));
        }
    };

    const handleBreedTypeChange = (type: 'mestizo' | 'raza') => {
        setBreedType(type);
        if (type === 'mestizo') {
            setFormData(prev => ({
                ...prev,
                breed: 'Mestizo',
                isMixedBreed: true
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                breed: '',
                isMixedBreed: false
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.gender) newErrors.gender = 'Selecciona el sexo';
        if (breedType === 'raza' && !formData.breed) newErrors.breed = 'Selecciona la raza';
        if (!formData.coatColor) newErrors.coatColor = 'Selecciona el color';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Completa los campos requeridos', 'error');
            return;
        }

        setIsLoading(true);
        await onNext(formData);
        setIsLoading(false);
    };

    const petType = petBasic?.petType === 'gato' ? 'gato' : 'perro';

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <span className={styles.stepBadge}>Paso 2 de 2 post-pago</span>
                <h2 className={styles.title}>
                    {petBasic?.petName 
                        ? <>Completa los datos de {petType === 'gato' ? '🐱' : '🐶'} <em style={{ fontStyle: 'normal', color: 'var(--color-primary, #00BBB4)' }}>{petBasic.petName}</em></>
                        : 'Completa los datos de tu mascota'
                    }
                </h2>
                <p className={styles.subtitle}>
                    Estos datos nos ayudan a identificar a tu peludo amigo
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Información general</h3>

                    <SelectWithInfo
                        label="Sexo"
                        name="gender"
                        value={formData.gender}
                        onChange={(value) => setFormData({ ...formData, gender: value })}
                        options={genderOptions}
                        infoText=""
                        error={errors.gender}
                        required
                    />

                    {/* Switch Mestizo / Raza */}
                    <div className={styles.fieldWrapper}>
                        <label className={styles.label}>
                            Tipo
                            <span className={styles.required}> *</span>
                        </label>
                        <div className={styles.breedTypeSwitch}>
                            <button
                                type="button"
                                className={`${styles.switchButton} ${breedType === 'mestizo' ? styles.switchActive : ''}`}
                                onClick={() => handleBreedTypeChange('mestizo')}
                            >
                                Mestizo
                            </button>
                            <button
                                type="button"
                                className={`${styles.switchButton} ${breedType === 'raza' ? styles.switchActive : ''}`}
                                onClick={() => handleBreedTypeChange('raza')}
                            >
                                Raza
                            </button>
                        </div>
                        <p className={styles.helpText}>
                            Selecciona si tu mascota es mestiza o de raza definida
                        </p>
                    </div>

                    {/* Campo de Raza (solo si selecciona 'raza') */}
                    {breedType === 'raza' && (
                        <BreedAutocomplete
                            label="Raza"
                            name="breed"
                            petType={petType}
                            value={formData.breed}
                            onChange={(value, hasWarning, warningMessage) => {
                                setFormData({
                                    ...formData,
                                    breed: value,
                                    isMixedBreed: value === 'Mestizo'
                                });
                            }}
                            error={errors.breed}
                            required
                        />
                    )}
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Características físicas</h3>

                    <div className={styles.row}>
                        <ColorAutocomplete
                            label="Color de pelo"
                            name="coatColor"
                            category="coat"
                            petType={petType}
                            value={formData.coatColor}
                            onChange={(value) => setFormData({ ...formData, coatColor: value })}
                            error={errors.coatColor}
                            required
                        />

                        <ColorAutocomplete
                            label="Color de nariz"
                            name="noseColor"
                            category="nose"
                            petType={petType}
                            value={formData.noseColor}
                            onChange={(value) => setFormData({ ...formData, noseColor: value })}
                        />
                    </div>

                    <ColorAutocomplete
                        label="Color de ojos"
                        name="eyeColor"
                        category="eye"
                        petType={petType}
                        value={formData.eyeColor}
                        onChange={(value) => setFormData({ ...formData, eyeColor: value })}
                    />
                </div>

                {/* Foto */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Fotografía</h3>

                    <label className={styles.fileUploadLabel}>
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handlePhotoChange}
                            className={styles.fileInput}
                        />
                        <div className={styles.fileUploadBox}>
                            {formData.primaryPhoto ? (
                                <>
                                    <span className={styles.fileIcon}>✓</span>
                                    <span>{formData.primaryPhoto.name}</span>
                                </>
                            ) : (
                                <>
                                    <span className={styles.fileIcon}>📷</span>
                                    <span>Haz clic para subir foto</span>
                                    <small>JPG/PNG, máx 5MB</small>
                                </>
                            )}
                        </div>
                    </label>

                    <p className={styles.helpText}>
                        📅 Tienes 15 días para subir la foto desde tu cuenta si no la tienes ahora.
                    </p>
                </div>

                {/* Certificado para seniors */}
                {isSenior && (
                    <div className={styles.alertBox}>
                        <span className={styles.alertIcon}>⚕️</span>
                        <div>
                            <strong>Certificado veterinario requerido</strong>
                            <p>
                                Como {petBasic?.petName} tiene {petBasic?.petAgeUnit === 'years'
                                    ? petBasic?.petAge
                                    : Math.floor(petBasic?.petAge / 12)} años,
                                necesitarás subir un certificado veterinario dentro de los
                                próximos 15 días.
                            </p>

                            <label className={styles.fileUploadLabel}>
                                <input
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png"
                                    onChange={handleVetCertificateChange}
                                    className={styles.fileInput}
                                />
                                <div className={styles.fileUploadBox}>
                                    {formData.vetCertificate ? (
                                        <>
                                            <span className={styles.fileIcon}>✓</span>
                                            <span>{formData.vetCertificate.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className={styles.fileIcon}>📄</span>
                                            <span>Subir certificado (opcional ahora)</span>
                                            <small>PDF/JPG/PNG, máx 5MB</small>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>
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
    );
}
