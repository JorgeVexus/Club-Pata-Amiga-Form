'use client';

import React from 'react';
import styles from './PetTypeSelector.module.css';
import type { PetTypeSelectorProps } from '@/types/registration.types';

export default function PetTypeSelector({ value, onChange, error }: PetTypeSelectorProps) {
    const options = [
        { 
            value: 'perro' as const, 
            label: 'Perro',
            icon: '🐕'
        },
        { 
            value: 'gato' as const, 
            label: 'Gato',
            icon: '🐈'
        }
    ];

    return (
        <div className={styles.container}>
            <label className={styles.label}>
                ¿Qué mascota quieres proteger?
            </label>
            <div className={styles.optionsContainer}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={`${styles.optionCard} ${value === option.value ? styles.selected : ''}`}
                        onClick={() => onChange(option.value)}
                    >
                        <span className={styles.icon} role="img" aria-label={option.label}>
                            {option.icon}
                        </span>
                        <span className={styles.optionLabel}>{option.label}</span>
                    </button>
                ))}
            </div>
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
}
