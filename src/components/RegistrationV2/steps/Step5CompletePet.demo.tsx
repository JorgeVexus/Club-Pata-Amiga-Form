/**
 * Paso 5: Completar datos de mascota - MODO DEMO
 * Con switch Mestizo/Raza y autocompletado de razas
 */

'use client';

import React, { useState, useEffect } from 'react';
import SelectWithInfo from '@/components/FormFields/SelectWithInfo';
import styles from './steps.module.css';

// Razas comunes para demo (en producción vienen de la BD)
const dogBreeds = [
    'Labrador Retriever', 'Pastor Alemán', 'Golden Retriever', 'Bulldog Francés',
    'Beagle', 'Poodle', 'Chihuahua', 'Pitbull', 'Boxer', 'Dachshund',
    'Yorkshire Terrier', 'Shih Tzu', 'Rottweiler', 'Schnauzer', 'Pug',
    'Border Collie', 'Husky Siberiano', 'Chow Chow', 'Doberman', 'Mestizo'
];

const catBreeds = [
    'Siamés', 'Persa', 'Maine Coon', 'Ragdoll', 'Bengalí',
    'Sphynx', 'Abisinio', 'Birmano', 'Oriental', 'Americano de Pelo Corto',
    'British Shorthair', 'Scottish Fold', 'Devon Rex', 'Cornish Rex', 'Siberiano',
    'Angora Turco', 'Noruego del Bosque', 'Bombay', 'Burmés', 'Mestizo'
];

const genderOptions = [
    { value: 'macho', label: 'Macho' },
    { value: 'hembra', label: 'Hembra' }
];

const dogColors = [
    'Arena', 'Arlequín', 'Atigrado (brindle)', 'Azul (gris azulado)', 'Bicolor',
    'Blanco', 'Brindle invertido', 'Canela', 'Carbón (charcoal)', 'Champagne',
    'Chocolate', 'Chocolate diluido', 'Crema / Beige', 'Dorado', 'Gris',
    'Isabella', 'Lavanda', 'Lila', 'Manchado', 'Marrón', 'Merle',
    'Merle críptico', 'Merle fantasma', 'Negro', 'Otro', 'Piebald',
    'Piebald extremo', 'Pizarra', 'Plateado / Silver', 'Platinum', 'Rojo',
    'Rojo hígado', 'Sable', 'Sable sombreado extremo', 'Tricolor'
];

const catColors = [
    'Amber', 'Apricot', 'Atigrado (tabby)', 'Bicolor', 'Blanco', 'Calicó',
    'Cameo', 'Canela', 'Caramel', 'Carey', 'Chinchilla', 'Chocolate',
    'Clásico / Marmoleado', 'Colorpoint', 'Crema', 'Fawn', 'Golden',
    'Golden shaded', 'Gris / Azul', 'Lavanda', 'Lila', 'Manchado', 'Marrón',
    'Mink', 'Naranja', 'Negro', 'Otro', 'Rayado', 'Sepia', 'Shaded Silver',
    'Silver shaded', 'Smoke', 'Ticked', 'Ticked extremo', 'Torbie',
    'Tricolor', 'Tuxedo'
];


interface Step5CompletePetProps {
    data: any;
    member: any;
    onNext: (data: any) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
    onLogout?: () => void;
}

// Componente de Autocomplete Genérico (versión demo)
function AutocompleteDemo({
    label,
    options,
    value,
    onChange,
    error,
    placeholder = "Escribe para buscar...",
    required = false
}: {
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
}) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (inputValue.length >= 1) {
            const filtered = options.filter(opt =>
                opt.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        setActiveIndex(-1);
    }, [inputValue, options]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                handleSelectItem(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleSelectItem = (item: string) => {
        setInputValue(item);
        setShowSuggestions(false);
        onChange(item);
    };

    return (
        <div className={styles.fieldWrapper}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <div className={styles.autocompleteWrapper}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue.length >= 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className={`${styles.textInput} ${error ? styles.inputError : ''}`}
                    required={required}
                    autoComplete="off"
                />

                {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                        {suggestions.map((item, index) => (
                            <li
                                key={item}
                                className={`${styles.suggestionItem} ${index === activeIndex ? styles.suggestionActive : ''}`}
                                onClick={() => handleSelectItem(item)}
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
}

function BreedAutocompleteDemo({
    petType,
    value,
    onChange,
    error,
    required = false
}: {
    petType: 'perro' | 'gato';
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
}) {
    const breeds = petType === 'gato' ? catBreeds : dogBreeds;
    return (
        <AutocompleteDemo
            label="Raza"
            options={breeds}
            value={value}
            onChange={onChange}
            error={error}
            required={required}
        />
    );
}

export default function Step5CompletePetDemo({ data, onNext, showToast }: Step5CompletePetProps) {
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

    // Cargar datos guardados
    useEffect(() => {
        if (data?.petComplete) {
            const pet = data.petComplete;
            setFormData(prev => ({
                ...prev,
                gender: pet.gender || '',
                breed: pet.breed || '',
                isMixedBreed: pet.isMixedBreed || false,
                coatColor: pet.coatColor || '',
                noseColor: pet.noseColor || '',
                eyeColor: pet.eyeColor || '',
                isAdopted: pet.isAdopted || false,
                adoptionStory: pet.adoptionStory || '',
            }));
            // Set breed type based on saved data
            setBreedType(pet.isMixedBreed || pet.breed === 'Mestizo' ? 'mestizo' : 'raza');
        }
    }, [data]);

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
        await new Promise(resolve => setTimeout(resolve, 600));
        await onNext(formData);
        setIsLoading(false);
    };

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <span className={styles.stepBadge}>Paso 2 de 2 post-pago</span>
                <h2 className={styles.title}>
                    Completa los datos de {petBasic?.petName || 'tu mascota'}
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
                        <BreedAutocompleteDemo
                            petType={petBasic?.petType === 'gato' ? 'gato' : 'perro'}
                            value={formData.breed}
                            onChange={(value) => setFormData({ ...formData, breed: value })}
                            error={errors.breed}
                            required
                        />
                    )}
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Características físicas</h3>

                    <div className={styles.row}>
                        <AutocompleteDemo
                            label="Color de pelo"
                            options={petBasic?.petType === 'gato' ? catColors : dogColors}
                            value={formData.coatColor}
                            onChange={(value) => setFormData({ ...formData, coatColor: value })}
                            error={errors.coatColor}
                            required
                        />

                        <AutocompleteDemo
                            label="Color de nariz"
                            options={petBasic?.petType === 'gato' ? catColors : dogColors}
                            value={formData.noseColor}
                            onChange={(value) => setFormData({ ...formData, noseColor: value })}
                        />
                    </div>

                    <AutocompleteDemo
                        label="Color de ojos"
                        options={petBasic?.petType === 'gato' ? catColors : dogColors}
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
                            <strong>Sobre su salud (Senior 10+ años)</strong>
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
