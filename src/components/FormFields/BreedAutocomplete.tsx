/**
 * Componente de Autocomplete para Razas
 * Muestra sugerencias mientras el usuario escribe
 * Alerta si la raza tiene problemas genéticos
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from './BreedAutocomplete.module.css';
// import breedsData from '@/data/breeds.json'; // Eliminado, ahora usa DB

interface Breed {
    id: string;
    name: string;
    has_genetic_issues: boolean; // Snake case from DB
    warning_message?: string;
    max_age: number;
}

interface BreedAutocompleteProps {
    label: string;
    name: string;
    petType: 'perro' | 'gato';
    value: string;
    onChange: (value: string, hasWarning: boolean, warningMessage?: string, maxAge?: number) => void;
    error?: string;
    required?: boolean;
    showWarning?: boolean;
}

// Helper para parsear y estructurar el warning_message dinámicamente
const getDynamicWarning = (warningMessage: string, breedName: string) => {
    if (!warningMessage) return null;

    // Intentamos extraer las enfermedades
    // El formato esperado es: "... pueden tener [enfermedades]. No cubrimos..."
    const diseasesMatch = warningMessage.match(/pueden tener\s+([^.]+)\./i);
    const diseasesRaw = diseasesMatch ? diseasesMatch[1] : '';

    let formattedDiseases = '';
    if (diseasesRaw) {
        // Separamos por comas, limpiamos espacios
        const diseases = diseasesRaw.split(',').map(d => d.trim()).filter(Boolean);
        if (diseases.length === 1) {
            formattedDiseases = diseases[0];
        } else if (diseases.length === 2) {
            formattedDiseases = `${diseases[0]} o ${diseases[1]}`;
        } else if (diseases.length > 2) {
            const last = diseases[diseases.length - 1];
            const rest = diseases.slice(0, -1).join(', ');
            formattedDiseases = `${rest} o ${last}`;
        }
    }

    // Intentamos extraer la raza en plural para el segundo párrafo
    // Ej: "⚠️ Los Chihuahua pueden tener..." -> "Chihuahua"
    // Buscamos lo que esté entre "Los/Las " y " pueden tener"
    const pluralMatch = warningMessage.match(/(?:Los|Las)\s+(.+?)\s+pueden tener/i);
    const breedPlural = pluralMatch ? pluralMatch[1] : breedName;

    return {
        formattedDiseases,
        breedPlural
    };
};

export default function BreedAutocomplete({
    label,
    name,
    petType,
    value,
    onChange,
    error,
    required = false,
    showWarning = true,
}: BreedAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<Breed[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
    const [allBreeds, setAllBreeds] = useState<Breed[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1); // 🆕 Para navegación por teclado

    // Cargar razas desde el servidor al montar (o al cambiar tipo)
    useEffect(() => {
        const fetchBreeds = async () => {
            setIsLoading(true);
            try {
                // Importación dinámica para evitar error si no se usa
                const { getBreeds } = await import('@/app/actions/breed.actions');
                const { breeds, error } = await getBreeds(petType);
                if (breeds) {
                    setAllBreeds(breeds);
                } else {
                    console.error(error);
                }
            } catch (err) {
                console.error('Error cargando razas:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBreeds();
    }, [petType]);

    // Filtrar sugerencias mientras el usuario escribe
    useEffect(() => {
        if (inputValue.length >= 1 && allBreeds.length > 0) {
            const filtered = allBreeds.filter(breed =>
                breed.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        setActiveIndex(-1); // Reset al cambiar input
    }, [inputValue, allBreeds]);

    // 🆕 Manejo de Teclado
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
                handleSelectBreed(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSelectedBreed(null);
        onChange(newValue, false);
    };

    const handleSelectBreed = (breed: Breed) => {
        const displayName = (breed.id === 'mestizo' && petType === 'gato') ? 'Doméstico' : breed.name;
        setInputValue(displayName);
        setSelectedBreed(breed);
        setShowSuggestions(false);
        onChange(
            displayName,
            breed.has_genetic_issues, // DB usa snake_case
            breed.warning_message,    // DB usa snake_case
            breed.max_age             // DB usa snake_case
        );
    };

    return (
        <div className={styles.fieldWrapper}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <div className={styles.autocompleteWrapper}>
                <input
                    id={name}
                    name={name}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown} // 🆕
                    onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={isLoading ? "Cargando razas..." : "Escribe para buscar..."}
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    required={required}
                    autoComplete="off"
                    disabled={isLoading}
                />

                {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                        {suggestions.map((breed, index) => {
                            const displayName = (breed.id === 'mestizo' && petType === 'gato') ? 'Doméstico' : breed.name;
                            return (
                                <li
                                    key={breed.id}
                                    className={`${styles.suggestionItem} ${index === activeIndex ? styles.active : ''}`}
                                    onClick={() => handleSelectBreed(breed)}
                                    style={{ background: index === activeIndex ? '#f5f5f5' : 'transparent' }} // Fallback style
                                >
                                    {displayName}
                                    {showWarning && breed.has_genetic_issues && (
                                        <span className={styles.warningIcon}>⚠️</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {showWarning && selectedBreed?.has_genetic_issues && selectedBreed.warning_message && (() => {
                const dynamicInfo = getDynamicWarning(selectedBreed.warning_message, selectedBreed.name);
                
                if (!dynamicInfo || !dynamicInfo.formattedDiseases) {
                    return (
                        <div className={styles.warningBox}>
                            {selectedBreed.warning_message}
                        </div>
                    );
                }

                return (
                    <div className={styles.warningBoxDynamic}>
                        <div className={styles.warningTitle}>
                            ℹ️ <strong>Queremos lo mejor para tu {selectedBreed.name}.</strong> 🐾
                        </div>
                        <p className={styles.warningParagraph}>
                            Sabemos que, como muchas otras razas, los {dynamicInfo.breedPlural} pueden tener mayor predisposición a desarrollar algunas condiciones de salud, como {dynamicInfo.formattedDiseases}.
                        </p>
                        <p className={styles.warningParagraph}>
                            En <strong>Pata Amiga</strong> creemos que la confianza comienza con la transparencia. Por eso, es importante que sepas que nuestra membresía está diseñada para acompañarte ante imprevistos y accidentes. Actualmente, no contempla reintegros relacionados con enfermedades genéticas, hereditarias o congénitas.
                        </p>
                        <p className={styles.warningParagraph}>
                            Nuestro compromiso es brindarte claridad desde el primer día para que siempre sepas cómo funciona tu membresía y puedas aprovecharla al máximo.
                        </p>
                    </div>
                );
            })()}

            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
