/**
 * Componente de Autocomplete para Razas
 * Muestra sugerencias mientras el usuario escribe
 * Alerta si la raza tiene problemas genéticos
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from './BreedAutocomplete.module.css';
import breedsData from '@/data/breeds.json';

interface Breed {
    name: string;
    hasGeneticIssues: boolean;
    warningMessage?: string;
    maxAge: number;
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

    // Obtener razas según el tipo de mascota
    const breeds: Breed[] = petType === 'perro' ? breedsData.perros : breedsData.gatos;

    // Filtrar sugerencias mientras el usuario escribe
    useEffect(() => {
        if (inputValue.length >= 2) {
            const filtered = breeds.filter(breed =>
                breed.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [inputValue, breeds]);

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
            breed.hasGeneticIssues,
            breed.warningMessage,
            breed.maxAge
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
                    placeholder="Escribe para buscar..."
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    required={required}
                    autoComplete="off"
                />

                {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                        {suggestions.map((breed, index) => (
                            <li
                                key={index}
                                className={styles.suggestionItem}
                                onClick={() => handleSelectBreed(breed)}
                            >
                                {breed.name}
                                {breed.hasGeneticIssues && (
                                    <span className={styles.warningIcon}>⚠️</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selectedBreed?.hasGeneticIssues && selectedBreed.warningMessage && (
                <div className={styles.warningBox}>
                    {selectedBreed.warningMessage}
                </div>
            )}

            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
