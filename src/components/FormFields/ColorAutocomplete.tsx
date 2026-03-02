/**
 * Componente de Autocomplete para Colores (Pelo, Nariz, Ojos)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PetColor, ColorCategory } from '@/app/actions/coat-color.actions';
import styles from './BreedAutocomplete.module.css'; // Reutilizamos estilos

interface ColorAutocompleteProps {
    label: string;
    name: string;
    petType: 'perro' | 'gato';
    category?: ColorCategory;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
}

export default function ColorAutocomplete({
    label,
    name,
    petType,
    category = 'coat',
    value,
    onChange,
    error,
    required = false,
}: ColorAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<PetColor[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allColors, setAllColors] = useState<PetColor[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
        const fetchColors = async () => {
            setIsLoading(true);
            try {
                const { getPetColors } = await import('@/app/actions/coat-color.actions');
                const { colors, error } = await getPetColors(petType, category);
                if (colors) {
                    setAllColors(colors);
                } else {
                    console.error(error);
                }
            } catch (err) {
                console.error('Error cargando colores:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchColors();
    }, [petType, category]);

    useEffect(() => {
        if (inputValue.length >= 1 && allColors.length > 0) {
            const filtered = allColors.filter(color =>
                color.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        setActiveIndex(-1);
    }, [inputValue, allColors]);

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
                handleSelectColor(suggestions[activeIndex]);
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

    const handleSelectColor = (color: PetColor) => {
        setInputValue(color.name);
        setShowSuggestions(false);
        onChange(color.name);
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
                    value={inputValue || ''}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue?.length >= 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={isLoading ? "Cargando..." : "Escribe para buscar..."}
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    required={required}
                    autoComplete="off"
                    disabled={isLoading}
                />

                {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                        {suggestions.map((color, index) => (
                            <li
                                key={color.id}
                                className={`${styles.suggestionItem} ${index === activeIndex ? styles.active : ''}`}
                                onClick={() => handleSelectColor(color)}
                                style={{ background: index === activeIndex ? '#f5f5f5' : 'transparent' }}
                            >
                                {color.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
