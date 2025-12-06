/**
 * Componente de Select con Icono de Información
 * Dropdown estilizado con tooltip informativo
 */

'use client';

import React, { useState } from 'react';
import styles from './SelectWithInfo.module.css';

interface SelectWithInfoProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    infoText: string;
    error?: string;
    required?: boolean;
    placeholder?: string;
}

export default function SelectWithInfo({
    label,
    name,
    value,
    onChange,
    options,
    infoText,
    error,
    required = false,
    placeholder = 'Selecciona una opción',
}: SelectWithInfoProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className={styles.fieldWrapper}>
            <div className={styles.labelWrapper}>
                <label htmlFor={name} className={styles.label}>
                    {label}
                    {required && <span className={styles.required}> *</span>}
                </label>

                {/* Icono de información */}
                <button
                    type="button"
                    className={styles.infoButton}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    aria-label="Más información"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>

                {/* Tooltip */}
                {showTooltip && (
                    <div className={styles.tooltip}>
                        {infoText}
                    </div>
                )}
            </div>

            <div className={styles.selectWrapper}>
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${styles.select} ${error ? styles.selectError : ''}`}
                    required={required}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Flecha personalizada */}
                <span className={styles.arrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
            </div>

            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
