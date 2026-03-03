'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TextInput from '@/components/FormFields/TextInput';
import DatePicker from '@/components/FormFields/DatePicker';
import PhoneInput from '@/components/FormFields/PhoneInput';
import NationalitySelect from '@/components/RegistrationV2/NationalitySelect';
import Toast from '@/components/UI/Toast';
import styles from './page.module.css';

// Componente simplificado de dirección SEPOMEX
function SepomexAddressForm({
    data,
    onChange,
    errors
}: {
    data: any,
    onChange: (field: string, value: string) => void,
    errors: any
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePostalCodeBlur = async () => {
        if (data.postalCode.length === 5) {
            setIsLoading(true);
            // Simular consulta SEPOMEX
            setTimeout(() => {
                // Datos de ejemplo
                if (data.postalCode === '01000') {
                    onChange('state', 'Ciudad de México');
                    onChange('city', 'Cuauhtémoc');
                }
                setIsLoading(false);
            }, 500);
        }
    };

    return (
        <div className={styles.addressSection}>
            <h3 className={styles.sectionTitle}>Dirección</h3>

            <div className={styles.postalCodeRow}>
                <TextInput
                    label="Código Postal"
                    name="postalCode"
                    value={data.postalCode}
                    onChange={(value) => onChange('postalCode', value.replace(/\D/g, '').slice(0, 5))}
                    onBlur={handlePostalCodeBlur}
                    placeholder="12345"
                    error={errors.postalCode}
                    required
                    maxLength={5}
                />
                {isLoading && <span className={styles.loadingText}>Consultando...</span>}
            </div>

            <div className={styles.row}>
                <TextInput
                    label="Estado"
                    name="state"
                    value={data.state}
                    onChange={() => { }}
                    placeholder="Autocompletado"
                    error={errors.state}
                    required
                    readOnly
                />
                <TextInput
                    label="Municipio/Alcaldía"
                    name="city"
                    value={data.city}
                    onChange={() => { }}
                    placeholder="Autocompletado"
                    error={errors.city}
                    required
                    readOnly
                />
            </div>

            <TextInput
                label="Colonia"
                name="colony"
                value={data.colony}
                onChange={(value) => onChange('colony', value)}
                placeholder="Selecciona tu colonia"
                error={errors.colony}
                required
            />

            <TextInput
                label="Calle y número"
                name="address"
                value={data.address}
                onChange={(value) => onChange('address', value)}
                placeholder="Ej: Av. Insurgentes Sur 1234, Depto 502"
                error={errors.address}
                required
            />
        </div>
    );
}

export default function CompletarPerfil() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentSuccess = searchParams.get('payment') === 'success';

    const [formData, setFormData] = useState({
        firstName: '',
        paternalLastName: '',
        maternalLastName: '',
        birthDate: '',
        nationality: '',
        nationalityCode: '',
        phone: '',
        email: '',
        curp: '',
        postalCode: '',
        state: '',
        city: '',
        colony: '',
        address: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    useEffect(() => {
        // Verificar que vino del flujo de registro
        const step1Data = localStorage.getItem('registration_step1');
        if (!step1Data) {
            router.replace('/registro/paso-1-cuenta');
            return;
        }

        // Cargar email del paso 1
        const { email } = JSON.parse(step1Data);
        setFormData(prev => ({ ...prev, email }));
    }, [router]);

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
        if (!formData.paternalLastName.trim()) newErrors.paternalLastName = 'El apellido paterno es requerido';
        if (!formData.maternalLastName.trim()) newErrors.maternalLastName = 'El apellido materno es requerido';

        if (!formData.birthDate) {
            newErrors.birthDate = 'La fecha de nacimiento es requerida';
        } else {
            // Validar mayoría de edad
            const birth = new Date(formData.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birth.getFullYear();
            if (age < 18) newErrors.birthDate = 'Debes ser mayor de edad';
        }

        if (!formData.nationality) newErrors.nationality = 'Selecciona tu nacionalidad';
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Teléfono inválido';
        if (!formData.curp || formData.curp.length !== 18) newErrors.curp = 'CURP debe tener 18 caracteres';
        if (!formData.postalCode || formData.postalCode.length !== 5) newErrors.postalCode = 'CP inválido';
        if (!formData.colony.trim()) newErrors.colony = 'La colonia es requerida';
        if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Guardar en localStorage
            localStorage.setItem('registration_contractor', JSON.stringify({
                ...formData,
                timestamp: new Date().toISOString()
            }));

            console.log('✅ Datos del contratante guardados:', formData);

            // Redirigir a completar datos de mascota
            router.push('/registro/completar-mascota');
        } catch (error: any) {
            console.error('Error:', error);
            showToast(error.message || 'Error al guardar', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '50%' }} />
                </div>

                {paymentSuccess && (
                    <div className={styles.successBanner}>
                        <span className={styles.successIcon}>🎉</span>
                        <div>
                            <strong>¡Pago exitoso!</strong>
                            <p>Ahora completa tu perfil para activar tu membresía</p>
                        </div>
                    </div>
                )}

                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <span className={styles.stepBadge}>Paso 1 de 2</span>
                        <h1 className={styles.title}>Completa tu perfil</h1>
                        <p className={styles.subtitle}>
                            Necesitamos estos datos para activar tu membresía
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Datos personales */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Datos personales</h3>

                            <div className={styles.row}>
                                <TextInput
                                    label="Nombre"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={(value) => handleChange('firstName', value)}
                                    placeholder="Juan"
                                    error={errors.firstName}
                                    required
                                />
                                <TextInput
                                    label="Apellido paterno"
                                    name="paternalLastName"
                                    value={formData.paternalLastName}
                                    onChange={(value) => handleChange('paternalLastName', value)}
                                    placeholder="Pérez"
                                    error={errors.paternalLastName}
                                    required
                                />
                            </div>

                            <TextInput
                                label="Apellido materno"
                                name="maternalLastName"
                                value={formData.maternalLastName}
                                onChange={(value) => handleChange('maternalLastName', value)}
                                placeholder="García"
                                error={errors.maternalLastName}
                                required
                            />

                            <div className={styles.row}>
                                <DatePicker
                                    label="Fecha de nacimiento"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={(value) => handleChange('birthDate', value)}
                                    error={errors.birthDate}
                                    required
                                />
                                <NationalitySelect
                                    value={formData.nationality}
                                    onChange={(value, code) => {
                                        handleChange('nationality', value);
                                        handleChange('nationalityCode', code);
                                    }}
                                    error={errors.nationality}
                                />
                            </div>

                            <TextInput
                                label="CURP"
                                name="curp"
                                value={formData.curp}
                                onChange={(value) => handleChange('curp', value.toUpperCase())}
                                placeholder="ABCD123456HDFRNN09"
                                error={errors.curp}
                                required
                                maxLength={18}
                                helpText="Clave Única de Registro de Población"
                            />
                        </div>

                        {/* Contacto */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Contacto</h3>

                            <PhoneInput
                                label="Teléfono"
                                name="phone"
                                value={formData.phone}
                                onChange={(value) => handleChange('phone', value)}
                                error={errors.phone}
                                required
                            />

                            <TextInput
                                label="Correo electrónico"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={(value) => handleChange('email', value)}
                                error={errors.email}
                                required
                                readOnly
                            />
                        </div>

                        {/* Dirección */}
                        <SepomexAddressForm
                            data={formData}
                            onChange={handleChange}
                            errors={errors}
                        />

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Continuar'}
                            {!isSubmitting && <span>→</span>}
                        </button>
                    </form>
                </div>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
