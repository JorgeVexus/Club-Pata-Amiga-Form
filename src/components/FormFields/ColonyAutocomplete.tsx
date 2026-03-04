/**
 * Componente de Autocomplete para Colonias
 * Permite autocompletar colonias en base a un CP
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from './ColonyAutocomplete.module.css';

interface ColonyAutocompleteProps {
    label: string;
    name: string;
    value: string;
    suggestions: string[];
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    isLoading?: boolean;
}

export default function ColonyAutocomplete({
    label,
    name,
    value,
    suggestions = [],
    onChange,
    error,
    required = false,
    placeholder = "Escribe tu colonia...",
    disabled = false,
    isLoading = false
}: ColonyAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Sincronizar con valor externo (ej. cuando se carga del cache)
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Filtrar sugerencias mientras el usuario escribe
    useEffect(() => {
        if (inputValue.length >= 1 && suggestions.length > 0) {
            const filtered = suggestions.filter(s =>
                s.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredSuggestions(filtered);
            // Mostrar solo si hay sugerencias y el valor no es exactamente una sugerencia ya seleccionada
            setShowSuggestions(filtered.length > 0 && !(filtered.length === 1 && filtered[0] === inputValue));
        } else {
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }
        setActiveIndex(-1);
    }, [inputValue, suggestions]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
                handleSelect(filteredSuggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
    };

    const handleSelect = (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        onChange(suggestion);
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
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue.length >= 1 && filteredSuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={isLoading ? "Cargando..." : placeholder}
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    required={required}
                    autoComplete="off"
                    disabled={disabled || isLoading}
                />

                {showSuggestions && (
                    <ul className={styles.suggestionsList}>
                        {filteredSuggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className={`${styles.suggestionItem} ${index === activeIndex ? styles.active : ''}`}
                                onClick={() => handleSelect(suggestion)}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
