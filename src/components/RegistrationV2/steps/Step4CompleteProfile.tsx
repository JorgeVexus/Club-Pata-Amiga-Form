/**
 * Paso 4: Completar perfil del contratante
 * Post-pago: Datos personales completos
 * Carga datos si ya existen en Supabase
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import DatePicker from '@/components/FormFields/DatePicker';
import PhoneInput from '@/components/FormFields/PhoneInput';
import NationalitySelect from '../NationalitySelect';
import ColonyAutocomplete from '@/components/FormFields/ColonyAutocomplete';
import { checkCurpAvailability } from '@/app/actions/user.actions';
import styles from './steps.module.css';

interface Step4CompleteProfileProps {
    data: any;
    member: any;
    onNext: (data: any) => void;
    onBack?: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step4CompleteProfile({ data, member, onNext, showToast }: Step4CompleteProfileProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        paternalLastName: '',
        maternalLastName: '',
        birthDate: '',
        nationality: '',
        nationalityCode: '',
        phone: '',
        email: member?.auth?.email || data?.account?.email || '',
        curp: '',
        postalCode: '',
        state: '',
        city: '',
        colony: '',
        address: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCP, setIsLoadingCP] = useState(false);
    const [isCheckingCurp, setIsCheckingCurp] = useState(false);
    const [curpAvailable, setCurpAvailable] = useState<boolean | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [colonySuggestions, setColonySuggestions] = useState<string[]>([]);

    const verifyCurp = async (curp: string) => {
        if (curp.length !== 18) {
            setCurpAvailable(null);
            return;
        }

        setIsCheckingCurp(true);
        try {
            // El ID de memberstack actual para permitir que su propio CURP sea válido
            const currentMsId = member?.id || member?.memberId;
            const result = await checkCurpAvailability(curp, currentMsId);

            if (result.error) {
                console.error('Error verificando CURP:', result.error);
                return;
            }

            setCurpAvailable(result.available);

            if (!result.available) {
                setErrors(prev => ({ ...prev, curp: 'Este CURP ya está registrado con otra cuenta' }));
                showToast('El CURP ya está en uso', 'error');
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.curp;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Catch verifyCurp:', error);
        } finally {
            setIsCheckingCurp(false);
        }
    };

    const handleCurpBlur = () => {
        if (formData.curp.length === 18) {
            verifyCurp(formData.curp);
        }
    };

    const fetchFromGoogle = async (cp: string) => {
        if (!window.google || !window.google.maps) return null;

        const geocoder = new window.google.maps.Geocoder();
        try {
            const response = await geocoder.geocode({
                address: cp,
                componentRestrictions: { country: 'MX', postalCode: cp }
            });

            if (response.results && response.results.length > 0) {
                const result = response.results[0];
                let state = '';
                let city = '';
                let colony = '';

                result.address_components.forEach((component: any) => {
                    const types = component.types;
                    if (types.includes('administrative_area_level_1')) {
                        state = component.long_name;
                    }
                    if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                        city = component.long_name;
                    }
                    if (types.includes('sublocality') || types.includes('neighborhood')) {
                        colony = component.long_name;
                    }
                });

                return { state, city, colony };
            }
        } catch (error) {
            console.error('Google Geocoding error:', error);
        }
        return null;
    };

    const fetchColoniesFromSepomex = async (cp: string) => {
        if (!cp || cp.length !== 5) return null;
        setIsLoadingCP(true);
        try {
            const response = await fetch(`/api/sepomex?cp=${cp}`);
            const result = await response.json();
            if (result.success) {
                setColonySuggestions(result.data.colonies || []);
                if (result.data.colonies?.length === 1) {
                    setFormData(prev => ({ ...prev, colony: result.data.colonies[0] }));
                }
                return result.data;
            }
        } catch (error) {
            console.error('Error SEPOMEX:', error);
        } finally {
            setIsLoadingCP(false);
        }
        return null;
    };

    // Inicializar Google Autocomplete para el campo de dirección
    useEffect(() => {
        const initGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                const input = document.getElementById('address-autocomplete') as HTMLInputElement;
                if (!input) return;

                const autocomplete = new window.google.maps.places.Autocomplete(input, {
                    componentRestrictions: { country: 'MX' },
                    fields: ['address_components', 'formatted_address'],
                    types: ['address']
                });

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.address_components) return;

                    let cp = '';
                    let state = '';
                    let city = '';
                    let colony = '';
                    let street = '';
                    let number = '';

                    place.address_components.forEach((component: any) => {
                        const types = component.types;
                        if (types.includes('postal_code')) cp = component.long_name;
                        if (types.includes('administrative_area_level_1')) state = component.long_name;
                        if (types.includes('locality')) city = component.long_name;
                        if (types.includes('sublocality') || types.includes('neighborhood')) colony = component.long_name;
                        if (types.includes('route')) street = component.long_name;
                        if (types.includes('street_number')) number = component.long_name;
                    });

                    const fullAddress = `${street} ${number}`.trim();

                    setFormData(prev => ({
                        ...prev,
                        postalCode: cp || prev.postalCode,
                        state: state || prev.state,
                        city: city || prev.city,
                        colony: colony || prev.colony,
                        address: fullAddress || place.formatted_address || prev.address
                    }));

                    if (cp) {
                        fetchColoniesFromSepomex(cp);
                    }
                });
            }
        };

        const timer = setTimeout(initGoogle, 1000);
        return () => clearTimeout(timer);
    }, [isLoaded]);

    // Cargar datos guardados al montar
    useEffect(() => {
        if (data?.profile && !isLoaded) {
            const profile = data.profile;
            setFormData(prev => ({
                ...prev,
                firstName: profile.firstName || '',
                paternalLastName: profile.paternalLastName || '',
                maternalLastName: profile.maternalLastName || '',
                birthDate: profile.birthDate || '',
                nationality: profile.nationality || '',
                nationalityCode: profile.nationalityCode || '',
                phone: profile.phone || '',
                email: profile.email || prev.email,
                curp: profile.curp || '',
                postalCode: profile.postalCode || '',
                state: profile.state || '',
                city: profile.city || '',
                colony: profile.colony || '',
                address: profile.address || '',
            }));
            setIsLoaded(true);

            // Si ya hay CURP cargada de 18 caracteres, verificarla
            if (profile.curp && profile.curp.length === 18) {
                verifyCurp(profile.curp);
            }
        }
    }, [data, isLoaded]);


    const handlePostalCodeBlur = async () => {
        if (formData.postalCode.length !== 5) return;

        setIsLoadingCP(true);
        try {
            const googleData = await fetchFromGoogle(formData.postalCode);
            const sepomexData = await fetchColoniesFromSepomex(formData.postalCode);

            if (googleData || sepomexData) {
                setFormData(prev => ({
                    ...prev,
                    state: googleData?.state || sepomexData?.state || prev.state,
                    city: googleData?.city || sepomexData?.municipality || prev.city,
                }));
                showToast('Dirección encontrada', 'success');
            } else {
                showToast('No se encontró información para este CP', 'warning');
            }
        } catch (error) {
            console.error('Error consultando CP:', error);
            showToast('Error al consultar dirección', 'error');
        } finally {
            setIsLoadingCP(false);
        }
    };

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'Requerido';
        if (!formData.paternalLastName.trim()) newErrors.paternalLastName = 'Requerido';
        if (!formData.maternalLastName.trim()) newErrors.maternalLastName = 'Requerido';

        if (!formData.birthDate) {
            newErrors.birthDate = 'Requerido';
        } else {
            const age = calculateAge(formData.birthDate);
            if (age < 18) {
                newErrors.birthDate = 'Debes ser mayor de 18 años';
            }
        }

        if (!formData.nationality) newErrors.nationality = 'Requerido';
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Teléfono inválido';
        if (!formData.curp || formData.curp.length !== 18) newErrors.curp = 'CURP inválida';
        if (!formData.postalCode || formData.postalCode.length !== 5) newErrors.postalCode = 'CP inválido';
        if (!formData.city.trim()) newErrors.city = 'Requerido';
        if (!formData.colony.trim()) newErrors.colony = 'Requerido';
        if (!formData.address.trim()) newErrors.address = 'Requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Completa todos los campos requeridos', 'error');
            return;
        }

        setIsLoading(true);
        await onNext(formData);
        setIsLoading(false);
    };

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <span className={styles.stepBadge}>Paso 1 de 2 post-pago</span>
                <h2 className={styles.title}>Completa tu perfil</h2>
                <p className={styles.subtitle}>
                    Necesitamos estos datos para activar tu membresía
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Datos personales</h3>

                    <TextInput
                        label="Nombre"
                        name="firstName"
                        value={formData.firstName}
                        onChange={(value) => setFormData({ ...formData, firstName: value })}
                        error={errors.firstName}
                        required
                    />

                    <TextInput
                        label="Apellido paterno"
                        name="paternalLastName"
                        value={formData.paternalLastName}
                        onChange={(value) => setFormData({ ...formData, paternalLastName: value })}
                        error={errors.paternalLastName}
                        required
                    />

                    <TextInput
                        label="Apellido materno"
                        name="maternalLastName"
                        value={formData.maternalLastName}
                        onChange={(value) => setFormData({ ...formData, maternalLastName: value })}
                        error={errors.maternalLastName}
                        required
                    />

                    <DatePicker
                        label="Fecha de nacimiento"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={(value) => {
                            setFormData({ ...formData, birthDate: value });
                            if (value) {
                                const age = calculateAge(value);
                                if (age < 18) {
                                    setErrors(prev => ({ ...prev, birthDate: 'Debes ser mayor de 18 años' }));
                                    showToast('Debes ser mayor de 18 años para registrarte', 'error');
                                } else {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.birthDate;
                                        return newErrors;
                                    });
                                }
                            }
                        }}
                        error={errors.birthDate}
                        required
                    />

                    <NationalitySelect
                        value={formData.nationality}
                        onChange={(value, code) => setFormData({
                            ...formData,
                            nationality: value,
                            nationalityCode: code
                        })}
                        error={errors.nationality}
                        required
                    />

                    <div className={styles.curpRow}>
                        <TextInput
                            label="CURP"
                            name="curp"
                            value={formData.curp}
                            onChange={(value) => setFormData({ ...formData, curp: value.toUpperCase() })}
                            onBlur={handleCurpBlur}
                            placeholder="ABCD123456HDFRNN09"
                            error={errors.curp}
                            required
                            maxLength={18}
                            disabled={isCheckingCurp}
                        />
                        {isCheckingCurp && (
                            <span className={styles.inputIndicator}>Verificando...</span>
                        )}
                        {curpAvailable && formData.curp.length === 18 && !isCheckingCurp && (
                            <span className={styles.inputIndicatorSuccess}>✓ Disponible</span>
                        )}
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Contacto</h3>

                    <PhoneInput
                        label="Teléfono"
                        name="phone"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        error={errors.phone}
                        required
                    />

                    <TextInput
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(value) => setFormData({ ...formData, email: value })}
                        error={errors.email}
                        required
                        readOnly
                    />
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Dirección</h3>

                    <div className={styles.postalCodeRow}>
                        <TextInput
                            label="Código Postal"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={(value) => setFormData({ ...formData, postalCode: value.replace(/\D/g, '').slice(0, 5) })}
                            onBlur={handlePostalCodeBlur}
                            error={errors.postalCode}
                            required
                            maxLength={5}
                            disabled={isLoadingCP}
                        />
                        {isLoadingCP && (
                            <span className={styles.cpLoadingIndicator}>Consultando...</span>
                        )}
                    </div>

                    <TextInput
                        label="Estado"
                        name="state"
                        value={formData.state}
                        readOnly
                    />

                    <TextInput
                        label="Municipio/Alcaldía"
                        name="city"
                        value={formData.city}
                        onChange={(value) => setFormData({ ...formData, city: value })}
                        error={errors.city}
                        required
                    />

                    <ColonyAutocomplete
                        label="Colonia"
                        name="colony"
                        value={formData.colony}
                        suggestions={colonySuggestions}
                        onChange={(value) => setFormData({ ...formData, colony: value })}
                        error={errors.colony}
                        required
                        isLoading={isLoadingCP}
                    />

                    <div className={styles.fieldWrapper}>
                        <label className={styles.label}>
                            Calle y número <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="address-autocomplete"
                            type="text"
                            placeholder="Busca tu calle y número..."
                            className={styles.input}
                            autoComplete="off"
                        />
                        <p className={styles.helpText}>Comienza a escribir y selecciona tu dirección</p>
                    </div>

                    <TextInput
                        label="Dirección (Confirmada)"
                        name="address"
                        value={formData.address}
                        onChange={(value) => setFormData({ ...formData, address: value })}
                        error={errors.address}
                        placeholder="Ej: Av. Juárez 123 Int 4"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={isLoading}
                >
                    {isLoading ? 'Guardando...' : 'Continuar →'}
                </button>
            </form>
        </div>
    );
}
