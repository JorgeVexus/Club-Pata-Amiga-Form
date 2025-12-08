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
}

export default function BreedAutocomplete({
    label,
    name,
    petType,
    value,
    onChange,
    error,
    required = false,
}: BreedAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<Breed[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
    const [allBreeds, setAllBreeds] = useState<Breed[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
        if (inputValue.length >= 2 && allBreeds.length > 0) {
            const filtered = allBreeds.filter(breed =>
                breed.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [inputValue, allBreeds]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSelectedBreed(null);
        onChange(newValue, false);
    };

    const handleSelectBreed = (breed: Breed) => {
        setInputValue(breed.name);
        setSelectedBreed(breed);
        setShowSuggestions(false);
        onChange(
            breed.name,
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
                        {suggestions.map((breed) => (
                            <li
                                key={breed.id}
                                className={styles.suggestionItem}
                                onClick={() => handleSelectBreed(breed)}
                            >
                                {breed.name}
                                {breed.has_genetic_issues && (
                                    <span className={styles.warningIcon}>⚠️</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selectedBreed?.has_genetic_issues && selectedBreed.warning_message && (
                <div className={styles.warningBox}>
                    {selectedBreed.warning_message}
                </div>
            )}

            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
