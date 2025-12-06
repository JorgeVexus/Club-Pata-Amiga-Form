/**
 * Componente de Radio Buttons para "¿Cómo te identificas?"
 */

import React from 'react';
import styles from './RadioGroup.module.css';

interface RadioOption {
    value: string;
    label: string;
}

interface RadioGroupProps {
    label: string;
    name: string;
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    memberstackField?: string;
}

export default function RadioGroup({
    label,
    name,
    options,
    value,
    onChange,
    error,
    required = false,
    memberstackField,
}: RadioGroupProps) {
    return (
        <div className={styles.fieldWrapper}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <div className={styles.radioGroup}>
                {options.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={(e) => onChange(e.target.value)}
                            className={styles.radioInput}
                            data-ms-member={memberstackField}
                            required={required}
                        />
                        <span className={styles.radioCustom}></span>
                        <span className={styles.radioText}>{option.label}</span>
                    </label>
                ))}
            </div>

            {error && (
                <p className="error-text">{error}</p>
            )}
        </div>
    );
}
