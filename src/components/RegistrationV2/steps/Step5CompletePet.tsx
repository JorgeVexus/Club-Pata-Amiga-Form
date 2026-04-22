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
    const petType = petBasic?.petType === 'gato' ? 'gato' : 'perro';

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
            const isMixed = pet.isMixedBreed || pet.breed === 'Mestizo' || pet.breed === 'Doméstico';

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
                breed: petType === 'gato' ? 'Doméstico' : 'Mestizo',
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
                                {breedType === 'mestizo' && (
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
                                className={`${styles.switchButton} ${breedType === 'raza' ? styles.switchActive : ''}`}
                                onClick={() => handleBreedTypeChange('raza')}
                            >
                                {breedType === 'raza' && (
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
                                    isMixedBreed: value === 'Mestizo' || value === 'Doméstico'
                                });
                            }}
                            error={errors.breed}
                            required
                        />
                    )}

                    {/* Sección de Adopción */}
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
                                    checked={formData.isAdopted}
                                    onChange={(e) => setFormData({ ...formData, isAdopted: e.target.checked })}
                                />
                                <span className={styles.adoptionCheckboxText}>¡Sí, es rescatada / adoptada!</span>
                            </label>
                        </div>

                        {formData.isAdopted && (
                            <div className={styles.adoptionStoryWrapper}>
                                <label className={styles.adoptionStoryLabel}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary, #00BBB4)' }}>
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    Cuéntanos su historia
                                </label>
                                <textarea
                                    className={styles.adoptionTextarea}
                                    placeholder="Ej: La encontramos en un refugio hace 2 años y desde entonces es la alegría de la casa..."
                                    value={formData.adoptionStory}
                                    onChange={(e) => setFormData({ ...formData, adoptionStory: e.target.value })}
                                    maxLength={500}
                                />
                                <div className={styles.adoptionCharCount}>
                                    <strong>{formData.adoptionStory.length}</strong> / 500 caracteres
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
                            <strong>Información sobre mascota senior</strong>
                            <p>
                                Como es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual para completar su registro. 🐾💙
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

                <div className={styles.infoNote}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                    </svg>
                    <span>Desde tu perfil podrás registrar a tus otras dos mascotas</span>
                </div>

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
