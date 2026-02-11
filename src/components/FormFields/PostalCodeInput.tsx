/**
 * Componente de Input de Dirección con Google Places Autocomplete
 * Usa Google Places API para auto-completar direcciones en México
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './PostalCodeInput.module.css';

// Declaración de tipos para Google Places
declare global {
    interface Window {
        google?: any;
    }
}

interface PostalCodeInputProps {
    postalCode: string;
    onPostalCodeChange: (value: string) => void;
    state: string;
    onStateChange: (value: string) => void;
    city: string;
    onCityChange: (value: string) => void;
    colony: string;
    onColonyChange: (value: string) => void;
    address: string;
    onAddressChange: (value: string) => void;
    errors?: {
        postalCode?: string;
        state?: string;
        city?: string;
        colony?: string;
        address?: string;
    };
}

export default function PostalCodeInput({
    postalCode,
    onPostalCodeChange,
    state,
    onStateChange,
    city,
    onCityChange,
    colony,
    onColonyChange,
    address,
    onAddressChange,
    errors = {},
}: PostalCodeInputProps) {
    const addressInputRef = useRef<HTMLInputElement>(null);
    const [autocomplete, setAutocomplete] = useState<any>(null);

    useEffect(() => {
        // Esperar a que Google Places API se cargue completamente
        const initAutocomplete = () => {
            if (
                window.google &&
                window.google.maps &&
                window.google.maps.places &&
                window.google.maps.places.Autocomplete &&
                addressInputRef.current
            ) {
                try {
                    const autocompleteInstance = new window.google.maps.places.Autocomplete(
                        addressInputRef.current,
                        {
                            types: ['address'],
                            componentRestrictions: { country: 'mx' }, // Solo México
                        }
                    );

                    autocompleteInstance.addListener('place_changed', () => {
                        const place = autocompleteInstance.getPlace();

                        if (!place.address_components) {
                            return;
                        }

                        // Extraer componentes de la dirección
                        let extractedPostalCode = '';
                        let extractedState = '';
                        let extractedCity = '';
                        let extractedColony = '';
                        let extractedStreet = '';
                        let extractedNumber = '';

                        place.address_components.forEach((component: any) => {
                            const types = component.types;

                            if (types.includes('postal_code')) {
                                extractedPostalCode = component.long_name;
                            }
                            if (types.includes('administrative_area_level_1')) {
                                extractedState = component.long_name;
                            }
                            if (types.includes('locality')) {
                                extractedCity = component.long_name;
                            }
                            if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                                extractedColony = component.long_name;
                            }
                            if (types.includes('route')) {
                                extractedStreet = component.long_name;
                            }
                            if (types.includes('street_number')) {
                                extractedNumber = component.long_name;
                            }
                        });

                        // Actualizar los campos
                        if (extractedPostalCode) onPostalCodeChange(extractedPostalCode);
                        if (extractedState) onStateChange(extractedState);
                        if (extractedCity) onCityChange(extractedCity);
                        if (extractedColony) onColonyChange(extractedColony);

                        // Construir dirección completa
                        const fullAddress = [extractedStreet, extractedNumber].filter(Boolean).join(' ');
                        if (fullAddress) onAddressChange(fullAddress);
                    });

                    setAutocomplete(autocompleteInstance);
                    return true;
                } catch (error) {
                    console.error('Error initializing Google Places:', error);
                    return false;
                }
            }
            return false;
        };

        // Intentar inicializar inmediatamente
        if (initAutocomplete()) {
            return;
        }

        // Si no está listo, esperar con polling
        let attempts = 0;
        const maxAttempts = 50; // 10 segundos

        const checkGoogle = setInterval(() => {
            attempts++;

            if (initAutocomplete()) {
                clearInterval(checkGoogle);
            } else if (attempts >= maxAttempts) {
                console.warn('Google Places API no se cargó después de 10 segundos');
                clearInterval(checkGoogle);
            }
        }, 200);

        return () => clearInterval(checkGoogle);
    }, []);

    return (
        <div className={styles.addressSection}>
            <h3 className={styles.sectionTitle}>📍 Dirección</h3>

            {/* Campo de búsqueda de dirección con Google Places */}
            <div className={styles.fieldWrapper}>
                <label htmlFor="addressSearch" className={styles.label}>
                    Busca tu dirección <span className={styles.required}>*</span>
                </label>
                <input
                    ref={addressInputRef}
                    id="addressSearch"
                    name="addressSearch"
                    type="text"
                    placeholder="Escribe tu dirección completa..."
                    className={styles.input}
                    data-ms-member="address-search"
                />
                <p className="help-text">Comienza a escribir y selecciona tu dirección de la lista</p>
            </div>

            {/* Código Postal */}
            <div className={styles.fieldWrapper}>
                <label htmlFor="postalCode" className={styles.label}>
                    Código postal <span className={styles.required}>*</span>
                </label>
                <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="12345"
                    className={`${styles.input} ${errors.postalCode ? 'input-error' : ''}`}
                    maxLength={5}
                    required
                    data-ms-member="postal-code"
                />
                {errors.postalCode && <p className="error-text">{errors.postalCode}</p>}
            </div>

            {/* Estado */}
            <div className={styles.fieldWrapper}>
                <label htmlFor="state" className={styles.label}>
                    Estado <span className={styles.required}>*</span>
                </label>
                <input
                    id="state"
                    name="state"
                    type="text"
                    value={state}
                    onChange={(e) => onStateChange(e.target.value)}
                    placeholder="Ej: Ciudad de México"
                    className={`${styles.input} ${errors.state ? 'input-error' : ''}`}
                    required
                    data-ms-member="state"
                />
                {errors.state && <p className="error-text">{errors.state}</p>}
            </div>

            {/* Alcaldía/Municipio */}
            <div className={styles.fieldWrapper}>
                <label htmlFor="city" className={styles.label}>
                    Alcaldía/municipio <span className={styles.required}>*</span>
                </label>
                <input
                    id="city"
                    name="city"
                    type="text"
                    value={city}
                    onChange={(e) => onCityChange(e.target.value)}
                    placeholder="Ej: Benito Juárez"
                    className={`${styles.input} ${errors.city ? 'input-error' : ''}`}
                    required
                    data-ms-member="city"
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
            </div>

            {/* Colonia */}
            <div className={styles.fieldWrapper}>
                <label htmlFor="colony" className={styles.label}>
                    Colonia <span className={styles.required}>*</span>
                </label>
                <input
                    id="colony"
                    name="colony"
                    type="text"
                    value={colony}
                    onChange={(e) => onColonyChange(e.target.value)}
                    placeholder="Ej: Del Valle"
                    className={`${styles.input} ${errors.colony ? 'input-error' : ''}`}
                    required
                    data-ms-member="colony"
                />
                {errors.colony && <p className="error-text">{errors.colony}</p>}
            </div>

            {/* Dirección (calle y número) */}
            <div className={styles.fieldWrapper}>
                <label htmlFor="address" className={styles.label}>
                    Cambiar a calle y número (int y ext)
                </label>
                <input
                    id="address"
                    name="address"
                    type="text"
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    placeholder="Ej: Av. Insurgentes Sur 1234"
                    className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                    data-ms-member="address"
                />
                <p className="help-text">Orgullosos de ser mexicanos de corazón 🇲🇽</p>
                {errors.address && <p className="error-text">{errors.address}</p>}
            </div>
        </div>
    );
}
