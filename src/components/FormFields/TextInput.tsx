/**
 * Componente de Input de Texto Reutilizable
 * Sigue la guía de estilos con border-radius 50px y fondo blanco 60%
 */

import React from 'react';
import styles from './TextInput.module.css';

interface TextInputProps {
    label: string;
    name: string;
    type?: 'text' | 'email' | 'password' | 'tel';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    helpText?: string;
    required?: boolean;
    memberstackField?: string;
    maxLength?: number;
    pattern?: string;
    onBlur?: () => void;
}

export default function TextInput({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    helpText,
    required = false,
    memberstackField,
    maxLength,
    pattern,
    onBlur,
}: TextInputProps) {
    return (
        <div className={styles.fieldWrapper}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder}
                className={`${styles.input} ${error ? 'input-error' : ''}`}
                required={required}
                data-ms-member={memberstackField}
                maxLength={maxLength}
                pattern={pattern}
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
