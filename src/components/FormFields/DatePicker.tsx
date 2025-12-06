/**
 * Componente de Selector de Fecha Mejorado
 * Permite seleccionar fecha con calendario o escribir manualmente con formato automático
 */

import React, { useState, useEffect } from 'react';
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

    // Sincronizar displayValue con value cuando cambia externamente
    useEffect(() => {
        if (value) {
            const [year, month, day] = value.split('-');
            setDisplayValue(`${day}/${month}/${year}`);
        } else {
            setDisplayValue('');
        }
    }, [value]);

    // Formatear input mientras el usuario escribe
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/[^\d]/g, ''); // Solo números

        // Limitar a 8 dígitos (DDMMYYYY)
        input = input.slice(0, 8);

        // Formatear automáticamente con /
        let formatted = '';
        if (input.length > 0) {
            // Día (máximo 31)
            let day = input.slice(0, 2);
            if (parseInt(day) > 31) day = '31';
            formatted = day;

            if (input.length >= 3) {
                // Mes (01-12)
                let month = input.slice(2, 4);
                const monthNum = parseInt(month);

                // Solo validar cuando se han escrito 2 dígitos del mes
                if (month.length === 2) {
                    if (monthNum > 12) month = '12';
                    if (monthNum === 0) month = '01';
                }

                formatted += '/' + month;

                if (input.length >= 5) {
                    // Año
                    const year = input.slice(4, 8);
                    formatted += '/' + year;
                }
            }
        }

        setDisplayValue(formatted);

        // Si la fecha está completa, validar y actualizar
        if (input.length === 8) {
            const day = input.slice(0, 2);
            const month = input.slice(2, 4);
            const year = input.slice(4, 8);

            // Validar que la fecha sea válida
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const isValidDate =
                dateObj.getFullYear() === parseInt(year) &&
                dateObj.getMonth() === parseInt(month) - 1 &&
                dateObj.getDate() === parseInt(day);

            if (isValidDate) {
                const isoDate = `${year}-${month}-${day}`;
                onChange(isoDate);
            }
        }
    };

    // Manejar cambio desde el calendario
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
    };

    // Abrir el calendario nativo
    const openCalendar = () => {
        const dateInput = document.getElementById(`${name}-date-picker`) as HTMLInputElement;
        if (dateInput && dateInput.showPicker) {
            dateInput.showPicker();
        }
    };

    return (
        <div className={styles.fieldWrapper}>
            <label htmlFor={name} className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            <div className={styles.inputWrapper}>
                {/* Input de texto para escribir manualmente */}
                <input
                    id={name}
                    name={name}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    placeholder="DD/MM/AAAA"
                    className={`${styles.input} ${error ? 'input-error' : ''}`}
                    required={required}
                    data-ms-member={memberstackField}
                    maxLength={10}
                    autoComplete="off"
                />

                {/* Input de fecha oculto para el calendario */}
                <input
                    id={`${name}-date-picker`}
                    type="date"
                    value={value}
                    onChange={handleDateChange}
                    className={styles.dateInput}
                    min={minDate}
                    max={maxDate}
                    tabIndex={-1}
                />

                {/* Icono de calendario clickeable */}
                <button
                    type="button"
                    className={styles.calendarButton}
                    onClick={openCalendar}
                    tabIndex={-1}
                    aria-label="Abrir calendario"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </button>
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
