/**
 * Componente de Input de Teléfono con Bandera de México
 * Formato automático: +52 123 123 1234
 */

import React from 'react';
import styles from './PhoneInput.module.css';

interface PhoneInputProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    helpText?: string;
    required?: boolean;
    memberstackField?: string;
}

export default function PhoneInput({
    label,
    name,
    value,
    onChange,
    error,
    helpText,
    required = false,
    memberstackField,
}: PhoneInputProps) {
    const formatPhoneNumber = (input: string): string => {
        // Remover todo excepto números
        const numbers = input.replace(/\D/g, '');

        // Limitar a 10 dígitos
        const limited = numbers.slice(0, 10);

        // Formatear: 123 123 1234
        if (limited.length <= 3) {
            return limited;
        } else if (limited.length <= 6) {
            return `${limited.slice(0, 3)} ${limited.slice(3)}`;
        } else {
            return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        onChange(formatted);
    };

    return (
        <div className={styles.fieldWrapper}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <div className={styles.inputWrapper}>
                <div className={styles.prefix}>
                    <span className={styles.flag}>🇲🇽</span>
                    <span className={styles.code}>+52</span>
                </div>

                <input
                    id={name}
                    name={name}
                    type="tel"
                    value={value}
                    onChange={handleChange}
                    placeholder="123 123 1234"
                    className={`${styles.input} ${error ? 'input-error' : ''}`}
                    required={required}
                    data-ms-member={memberstackField}
                />
            </div>

            {helpText && !error && (
                <p className="help-text">{helpText}</p>
            )}

            {error && (
                <p className="error-text">{error}</p>
            )}
        </div>
    );
}
