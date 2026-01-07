/**
 * Componente de TextArea Reutilizable
 */

import React from 'react';
import styles from './TextArea.module.css';

interface TextAreaProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    helpText?: string;
    required?: boolean;
    maxLength?: number;
    rows?: number;
}

export default function TextArea({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    helpText,
    required = false,
    maxLength,
    rows = 4,
}: TextAreaProps) {
    return (
        <div className={styles.fieldWrapper}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <textarea
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${styles.textarea} ${error ? 'input-error' : ''}`}
                required={required}
                maxLength={maxLength}
                rows={rows}
            />

            {helpText && !error && (
                <p className="help-text">{helpText}</p>
            )}

            {error && (
                <p className="error-text">{error}</p>
            )}
        </div>
    );
}
