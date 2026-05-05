'use client';

import React from 'react';
import styles from './AgeInput.module.css';
import type { AgeInputProps } from '@/types/registration.types';

export default function AgeInput({ 
    value, 
    unit, 
    onChange, 
    error,
    maxYears = 25 
}: AgeInputProps) {
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange(0, unit);
            return;
        }
        
        const numValue = parseInt(val, 10);
        if (isNaN(numValue)) return;
        
        // Validar mínimos y máximos
        const max = unit === 'years' ? maxYears : 300;
        const clampedValue = Math.min(Math.max(0, numValue), max);
        
        onChange(clampedValue, unit);
    };

    const handleUnitChange = (newUnit: 'years' | 'months') => {
        // Convertir valor si cambia la unidad
        let newValue = value;
        if (unit === 'years' && newUnit === 'months') {
            newValue = value * 12;
        } else if (unit === 'months' && newUnit === 'years') {
            newValue = Math.floor(value / 12);
        }
        onChange(newValue, newUnit);
    };

    const max = unit === 'years' ? 25 : 300;
    const placeholder = unit === 'years' ? 'Ej: 3' : 'Ej: 36';
    const helpText = unit === 'years' 
        ? 'Máximo 25 años' 
        : 'Máximo 300 meses (25 años)';

    return (
        <div className={styles.container}>
            <label className={styles.label}>
                ¿Qué edad tiene?
            </label>
            <div className={styles.inputWrapper}>
                <input
                    type="number"
                    min={0}
                    max={max}
                    value={value || ''}
                    onChange={handleNumberChange}
                    placeholder={placeholder}
                    className={`${styles.numberInput} ${error ? styles.error : ''}`}
                />
                <div className={styles.unitToggle}>
                    <button
                        type="button"
                        className={`${styles.unitButton} ${unit === 'years' ? styles.active : ''}`}
                        onClick={() => handleUnitChange('years')}
                    >
                        Años
                    </button>
                    <button
                        type="button"
                        className={`${styles.unitButton} ${unit === 'months' ? styles.active : ''}`}
                        onClick={() => handleUnitChange('months')}
                    >
                        Meses
                    </button>
                </div>
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
            {!error && <span className={styles.helpText}>{helpText}</span>}
        </div>
    );
}
