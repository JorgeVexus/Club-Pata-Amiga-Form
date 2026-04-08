/**
 * Componente de Selector de Fecha Mejorado
 * Optimizado para Mobile-First con UX/UI Pro Max
 * Permite seleccionar fecha con calendario nativo o escribir manualmente
 */

import React, { useState, useEffect, useRef } from 'react';
import { format, parse, isValid, parseISO } from 'date-fns';
import styles from './DatePicker.module.css';

interface DatePickerProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    helpText?: string;
    required?: boolean;
    memberstackField?: string;
    minDate?: string;
    maxDate?: string;
}

export default function DatePicker({
    label,
    name,
    value,
    onChange,
    error,
    helpText,
    required = false,
    memberstackField,
    minDate,
    maxDate,
}: DatePickerProps) {
    const [displayValue, setDisplayValue] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Sincronizar displayValue con value cuando cambia externamente
    useEffect(() => {
        if (value) {
            try {
                const date = parseISO(value);
                if (isValid(date)) {
                    setDisplayValue(format(date, 'dd/MM/yyyy'));
                } else {
                    setDisplayValue('');
                }
            } catch (e) {
                setDisplayValue('');
            }
        } else {
            setDisplayValue('');
        }
    }, [value]);

    // Formatear input mientras el usuario escribe
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/[^\d]/g, ''); // Solo números
        input = input.slice(0, 8); // Máximo DDMMYYYY

        // Formatear visualmente con /
        let formatted = '';
        if (input.length > 0) {
            formatted = input.slice(0, 2);
            if (input.length > 2) {
                formatted += '/' + input.slice(2, 4);
                if (input.length > 4) {
                    formatted += '/' + input.slice(4, 8);
                }
            }
        }

        setDisplayValue(formatted);

        // Si la fecha está completa, intentar validar y notificar cambio
        if (input.length === 8) {
            const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());
            if (isValid(parsedDate)) {
                const isoDate = format(parsedDate, 'yyyy-MM-dd');
                onChange(isoDate);
            }
        }
    };

    // Manejar cambio desde el calendario nativo
    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value; // Viene en formato YYYY-MM-DD
        if (newValue) {
            onChange(newValue);
        }
    };

    return (
        <div className={`${styles.fieldWrapper} ${error ? styles.hasError : ''}`}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <div className={styles.inputWrapper}>
                {/* Input de texto para escribir manualmente (Desktop Friendly) */}
                <input
                    id={name}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleInputChange}
                    placeholder="DD/MM/AAAA"
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    required={required}
                    data-ms-member={memberstackField}
                    maxLength={10}
                    autoComplete="off"
                />

                {/* El trigger del calendario nativo (Mobile First Overlay) */}
                <div className={styles.calendarTriggerContainer}>
                    <input
                        ref={dateInputRef}
                        id={`${name}-date-picker`}
                        type="date"
                        value={value || ''}
                        onChange={handleNativeDateChange}
                        className={styles.nativeDateInput}
                        min={minDate}
                        max={maxDate}
                        tabIndex={-1}
                        aria-label="Seleccionar fecha"
                    />
                    <div className={styles.calendarIconWrapper}>
                        <svg 
                            width="22" 
                            height="22" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className={styles.calendarIcon}
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                        </svg>
                    </div>
                </div>
            </div>

            {helpText && !error && (
                <p className={styles.helpText}>{helpText}</p>
            )}

            {error && (
                <p className={styles.errorText}>{error}</p>
            )}
        </div>
    );
}
