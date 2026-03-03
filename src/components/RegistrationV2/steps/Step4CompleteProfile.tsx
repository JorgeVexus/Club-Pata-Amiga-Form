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
import styles from './steps.module.css';

interface Step4CompleteProfileProps {
    data: any;
    member: any;
    onNext: (data: any) => void;
    onBack: () => void;
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
    const [isLoaded, setIsLoaded] = useState(false);

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
        }
    }, [data, isLoaded]);

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

                    <TextInput
                        label="CURP"
                        name="curp"
                        value={formData.curp}
                        onChange={(value) => setFormData({ ...formData, curp: value.toUpperCase() })}
                        placeholder="ABCD123456HDFRNN09"
                        error={errors.curp}
                        required
                        maxLength={18}
                    />
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
                        readOnly
                    />

                    <TextInput
                        label="Colonia"
                        name="colony"
                        value={formData.colony}
                        onChange={(value) => setFormData({ ...formData, colony: value })}
                        error={errors.colony}
                        required
                    />

                    <TextInput
                        label="Calle y número"
                        name="address"
                        value={formData.address}
                        onChange={(value) => setFormData({ ...formData, address: value })}
                        placeholder="Ej: Av. Insurgentes Sur 1234"
                        error={errors.address}
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
