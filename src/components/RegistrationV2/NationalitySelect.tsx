'use client';

import React, { useState, useEffect } from 'react';
import styles from './NationalitySelect.module.css';
import type { NationalitySelectProps, Nationality } from '@/types/registration.types';

// Nacionalidades principales que se muestran primero
const PRIORITY_COUNTRIES = ['MEX', 'USA', 'GTM', 'COL', 'VEN', 'ARG', 'ESP'];

export default function NationalitySelect({ value, onChange, error, required = false }: NationalitySelectProps) {
    const [nationalities, setNationalities] = useState<Nationality[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // En producción esto vendría de la API
        // Por ahora usamos datos estáticos
        const defaultNationalities: Nationality[] = [
            { id: 1, code: 'MEX', nameEs: 'México', nameEn: 'Mexico', phoneCode: '+52', isActive: true },
            { id: 2, code: 'USA', nameEs: 'Estados Unidos', nameEn: 'United States', phoneCode: '+1', isActive: true },
            { id: 3, code: 'GTM', nameEs: 'Guatemala', nameEn: 'Guatemala', phoneCode: '+502', isActive: true },
            { id: 4, code: 'COL', nameEs: 'Colombia', nameEn: 'Colombia', phoneCode: '+57', isActive: true },
            { id: 5, code: 'VEN', nameEs: 'Venezuela', nameEn: 'Venezuela', phoneCode: '+58', isActive: true },
            { id: 6, code: 'ARG', nameEs: 'Argentina', nameEn: 'Argentina', phoneCode: '+54', isActive: true },
            { id: 7, code: 'ESP', nameEs: 'España', nameEn: 'Spain', phoneCode: '+34', isActive: true },
            { id: 8, code: 'CHL', nameEs: 'Chile', nameEn: 'Chile', phoneCode: '+56', isActive: true },
            { id: 9, code: 'PER', nameEs: 'Perú', nameEn: 'Peru', phoneCode: '+51', isActive: true },
            { id: 10, code: 'CUB', nameEs: 'Cuba', nameEn: 'Cuba', phoneCode: '+53', isActive: true },
            { id: 11, code: 'DOM', nameEs: 'República Dominicana', nameEn: 'Dominican Republic', phoneCode: '+1', isActive: true },
            { id: 12, code: 'ECU', nameEs: 'Ecuador', nameEn: 'Ecuador', phoneCode: '+593', isActive: true },
            { id: 13, code: 'BOL', nameEs: 'Bolivia', nameEn: 'Bolivia', phoneCode: '+591', isActive: true },
            { id: 14, code: 'PRY', nameEs: 'Paraguay', nameEn: 'Paraguay', phoneCode: '+595', isActive: true },
            { id: 15, code: 'URY', nameEs: 'Uruguay', nameEn: 'Uruguay', phoneCode: '+598', isActive: true },
        ];
        
        setNationalities(defaultNationalities);
        setIsLoading(false);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = nationalities.find(n => n.nameEs === e.target.value);
        if (selected) {
            onChange(selected.nameEs, selected.code);
        }
    };

    // Separar prioridades del resto
    const priorityNats = nationalities.filter(n => PRIORITY_COUNTRIES.includes(n.code));
    const otherNats = nationalities.filter(n => !PRIORITY_COUNTRIES.includes(n.code));

    return (
        <div className={styles.container}>
            <label className={styles.label}>
                Nacionalidad
                {required && <span className={styles.required}> *</span>}
            </label>
            <div className={styles.selectWrapper}>
                <select
                    value={value}
                    onChange={handleChange}
                    className={`${styles.select} ${error ? styles.error : ''}`}
                    disabled={isLoading}
                >
                    <option value="">Selecciona tu nacionalidad</option>
                    
                    {priorityNats.map(nat => (
                        <option key={nat.code} value={nat.nameEs} className={styles.optionPriority}>
                            {nat.nameEs}
                        </option>
                    ))}
                    
                    {otherNats.length > 0 && (
                        <>
                            <option disabled className={styles.divider}>──────────</option>
                            {otherNats.map(nat => (
                                <option key={nat.code} value={nat.nameEs}>
                                    {nat.nameEs}
                                </option>
                            ))}
                        </>
                    )}
                </select>
                <span className={styles.arrow}>▼</span>
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
}
