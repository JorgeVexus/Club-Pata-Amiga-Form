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

    const handlePostalCodeBlur = async () => {
        if (formData.postalCode.length !== 5) return;

        setIsLoadingCP(true);
        try {
            const response = await fetch(`/api/sepomex?cp=${formData.postalCode}`);
            const result = await response.json();

            if (result.success) {
                setFormData(prev => ({
                    ...prev,
                    state: result.data.state,
                    city: result.data.municipality
                }));
                // Guardar sugerencias de colonias
                if (result.data.colonies) {
                    setColonySuggestions(result.data.colonies);
                }
                if (showToast) {
                    showToast('Dirección encontrada', 'success');
                }
            } else {
                if (showToast) {
                    showToast('No se encontró información para este CP', 'warning');
                }
            }
        } catch (error) {
            console.error('Error consultando CP:', error);
            if (showToast) {
                showToast('Error al consultar dirección', 'error');
            }
        } finally {
            setIsLoadingCP(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'Requerido';
        if (!formData.paternalLastName.trim()) newErrors.paternalLastName = 'Requerido';
        if (!formData.maternalLastName.trim()) newErrors.maternalLastName = 'Requerido';
        if (!formData.birthDate) newErrors.birthDate = 'Requerido';
        if (!formData.nationality) newErrors.nationality = 'Requerido';
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Teléfono inválido';
        if (!formData.curp || formData.curp.length !== 18) newErrors.curp = 'CURP inválida';
        if (!formData.postalCode || formData.postalCode.length !== 5) newErrors.postalCode = 'CP inválido';
        if (!formData.city.trim()) newErrors.city = 'Requerido';
        if (!formData.colony.trim()) newErrors.colony = 'Requerido';

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
                        onChange={(value) => setFormData({ ...formData, birthDate: value })}
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
