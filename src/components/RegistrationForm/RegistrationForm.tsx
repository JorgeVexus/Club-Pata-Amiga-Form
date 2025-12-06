/**
 * Componente Principal del Formulario de Registro
 * Layout de 2 columnas con integración a Memberstack y Supabase
 */

'use client';

import React, { useState } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import RadioGroup from '@/components/FormFields/RadioGroup';
import DatePicker from '@/components/FormFields/DatePicker';
import FileUpload from '@/components/FormFields/FileUpload';
import PostalCodeInput from '@/components/FormFields/PostalCodeInput';
import PhoneInput from '@/components/FormFields/PhoneInput';
import { createMemberstackUser } from '@/services/memberstack.service';
import { uploadMultipleFiles, uploadFile } from '@/services/supabase.service';
import { validateCURP, formatCURP } from '@/utils/curp-validator';
import { validateBirthDate, getMaxBirthDateForAdult } from '@/utils/age-validator';
import Toast from '@/components/UI/Toast';
import type { RegistrationFormData } from '@/types/form.types';
import styles from './RegistrationForm.module.css';

export default function RegistrationForm() {
    const [formData, setFormData] = useState<Partial<RegistrationFormData>>({
        firstName: '',
        paternalLastName: '',
        maternalLastName: '',
        gender: undefined,
        birthDate: '',
        curp: '',
        ineFiles: [], // Mantenemos para compatibilidad
        ineFrontFile: null, // Nuevo: INE frontal
        ineBackFile: null,  // Nuevo: INE trasera
        proofOfAddressFile: null,
        postalCode: '',
        state: '',
        city: '',
        colony: '',
        address: '',
        email: '',
        phone: '',
        password: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({
        message: '',
        type: 'error',
        isVisible: false
    });

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const validateForm = (): { isValid: boolean, newErrors: Record<string, string> } => {
        const newErrors: Record<string, string> = {};

        // Validar campos requeridos
        if (!formData.firstName?.trim()) newErrors.firstName = 'El nombre es requerido';
        if (!formData.paternalLastName?.trim()) newErrors.paternalLastName = 'El apellido paterno es requerido';
        if (!formData.maternalLastName?.trim()) newErrors.maternalLastName = 'El apellido materno es requerido';
        if (!formData.gender) newErrors.gender = 'Selecciona una opción';
        if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
        if (!formData.curp?.trim()) newErrors.curp = 'El CURP es requerido';
        if (!formData.ineFrontFile) newErrors.ineFrontFile = 'Debes subir el frente de tu INE';
        if (!formData.ineBackFile) newErrors.ineBackFile = 'Debes subir el reverso de tu INE';
        if (!formData.proofOfAddressFile) newErrors.proofOfAddressFile = 'Debes subir tu comprobante de domicilio';
        if (!formData.postalCode?.trim()) newErrors.postalCode = 'El código postal es requerido';
        if (!formData.state?.trim()) newErrors.state = 'El estado es requerido';
        if (!formData.city?.trim()) newErrors.city = 'La ciudad es requerida';
        if (!formData.colony?.trim()) newErrors.colony = 'La colonia es requerida';
        if (!formData.email?.trim()) newErrors.email = 'El correo electrónico es requerido';
        if (!formData.phone?.trim()) newErrors.phone = 'El número de teléfono es requerido';
        if (!formData.password?.trim()) newErrors.password = 'La contraseña es requerida';

        // Validar formato de email
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El correo electrónico no es válido';
        }

        // Validar CURP con validador completo
        if (formData.curp) {
            const curpValidation = validateCURP(formData.curp);
            if (!curpValidation.isValid) {
                newErrors.curp = curpValidation.error || 'CURP inválida';
            }
        }

        // Validar edad (debe ser mayor de 18 años)
        if (formData.birthDate) {
            const ageValidation = validateBirthDate(formData.birthDate);
            if (!ageValidation.isValid) {
                newErrors.birthDate = ageValidation.error || 'Fecha de nacimiento inválida';
            }
        }

        // Validar teléfono (10 dígitos)
        const phoneDigits = formData.phone?.replace(/\D/g, '');
        if (phoneDigits && phoneDigits.length !== 10) {
            newErrors.phone = 'El teléfono debe tener 10 dígitos';
        }

        // Validar contraseña (mínimo 8 caracteres)
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        setErrors(newErrors);
        return { isValid: Object.keys(newErrors).length === 0, newErrors };
    };

    const scrollToError = (errorFields: string[], currentErrors: Record<string, string>) => {
        if (errorFields.length > 0) {
            const firstError = errorFields[0];
            const element = document.getElementById(firstError) || document.getElementsByName(firstError)[0];

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
                    element.focus();
                    try {
                        element.setCustomValidity(currentErrors[firstError]);
                        element.reportValidity();
                        element.oninput = () => { element.setCustomValidity(''); };
                    } catch (e) {
                        console.warn('Custom validty not supported', e);
                    }
                }
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { isValid, newErrors } = validateForm();

        if (!isValid) {
            scrollToError(Object.keys(newErrors), newErrors);

            if (newErrors.birthDate?.includes('18 años')) {
                showToast('⚠️ Lo sentimos, debes ser mayor de 18 años para registrarte.', 'warning');
            } else if (newErrors.curp) {
                showToast('⚠️ Por favor verifica que tu CURP sea correcta.', 'warning');
            } else {
                showToast('Por favor revisa los campos marcados en rojo.', 'error');
            }
            return;
        }

        setIsSubmitting(true);

        try {
            // Generar un ID temporal para el usuario (se reemplazará con el ID de Memberstack)
            const tempUserId = `temp_${Date.now()}`;

            // 1. Subir archivos a Supabase
            const ineFiles = [formData.ineFrontFile!, formData.ineBackFile!];
            const ineUploads = await uploadMultipleFiles(
                ineFiles,
                'INE',
                tempUserId
            );

            const proofOfAddressUpload = await uploadFile(
                formData.proofOfAddressFile!,
                'PROOF_OF_ADDRESS',
                tempUserId
            );

            // Verificar que las subidas fueron exitosas
            if (ineUploads.some(u => !u.success) || !proofOfAddressUpload.success) {
                throw new Error('Error al subir los archivos');
            }

            // 2. Crear usuario en Memberstack con URLs de archivos
            const memberstackResponse = await createMemberstackUser(
                formData as RegistrationFormData,
                {
                    ineUrls: ineUploads.map(u => u.publicUrl || ''),
                    proofOfAddressUrl: proofOfAddressUpload.publicUrl || '',
                }
            );

            if (!memberstackResponse.success) {
                throw new Error(memberstackResponse.error || 'Error al crear el usuario');
            }

            // 3. Éxito - Redirigir a registro de mascotas
            setSubmitSuccess(true);

            // Redirigir después de un breve delay para que el usuario vea el mensaje
            setTimeout(() => {
                window.location.href = '/registro-mascotas';
            }, 1500);
        } catch (error: any) {
            console.error('Error en el registro:', error);
            alert(error.message || 'Hubo un error al procesar tu registro. Por favor intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className={styles.successMessage}>
                <h2>🎉 ¡Cuenta Creada Exitosamente!</h2>
                <p>Bienvenido a la manada. Ahora vamos a conocer a tus peludos...</p>
                <p className={styles.redirecting}>Redirigiendo al registro de mascotas...</p>
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Cuéntanos sobre ti</h1>
                <p className={styles.subtitle}>
                    Para formar parte de esta manada, necesitamos conocerte un poquito
                </p>
                <p className={styles.privacyNote}>
                    Toda tu información es privada y se usa solo para fines de verificación.
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.columnsWrapper}>
                    {/* Columna Izquierda */}
                    <div className={styles.column}>
                        <h3 className={styles.columnTitle}>👤 Nombre Completo</h3>

                        <TextInput
                            label="Nombre(s)"
                            name="firstName"
                            value={formData.firstName || ''}
                            onChange={(value) => setFormData({ ...formData, firstName: value })}
                            placeholder="Juan"
                            error={errors.firstName}
                            required
                            memberstackField="first-name"
                        />

                        <TextInput
                            label="Apellido paterno"
                            name="paternalLastName"
                            value={formData.paternalLastName || ''}
                            onChange={(value) => setFormData({ ...formData, paternalLastName: value })}
                            placeholder="Pérez"
                            error={errors.paternalLastName}
                            required
                            memberstackField="paternal-last-name"
                        />

                        <TextInput
                            label="Apellido materno"
                            name="maternalLastName"
                            value={formData.maternalLastName || ''}
                            onChange={(value) => setFormData({ ...formData, maternalLastName: value })}
                            placeholder="García"
                            error={errors.maternalLastName}
                            required
                            memberstackField="maternal-last-name"
                        />

                        <RadioGroup
                            label="🧑‍🦰 ¿Cómo te identificas?"
                            name="gender"
                            options={[
                                { value: 'hombre', label: 'Hombre' },
                                { value: 'mujer', label: 'Mujer' },
                                { value: 'no-especificar', label: 'Prefiero no especificar' },
                            ]}
                            value={formData.gender || ''}
                            onChange={(value) => setFormData({ ...formData, gender: value as any })}
                            error={errors.gender}
                            required
                            memberstackField="gender"
                        />

                        <DatePicker
                            label="🎂 Fecha de nacimiento"
                            name="birthDate"
                            value={formData.birthDate || ''}
                            onChange={(value) => setFormData({ ...formData, birthDate: value })}
                            error={errors.birthDate}
                            helpText="Debes ser mayor de 18 años para registrarte"
                            required
                            memberstackField="birth-date"
                            maxDate={getMaxBirthDateForAdult()}
                        />

                        <TextInput
                            label="🆔 CURP"
                            name="curp"
                            value={formData.curp || ''}
                            onChange={(value) => setFormData({ ...formData, curp: value.toUpperCase() })}
                            placeholder="ABCD123456HDFRNN09"
                            error={errors.curp}
                            helpText="Para proteger tu identidad y la de toda la manada"
                            required
                            memberstackField="curp"
                            maxLength={18}
                        />

                        <FileUpload
                            label="🪪 INE - Frente"
                            name="ineFront"
                            accept=".pdf,.jpg,.jpeg,.png"
                            maxSize={5}
                            maxFiles={1}
                            instruction="Sube el frente de tu INE (lado con foto)"
                            onChange={(files) => setFormData({ ...formData, ineFrontFile: files[0] || null })}
                            error={errors.ineFrontFile}
                            required
                        />

                        <FileUpload
                            label="🪪 INE - Reverso"
                            name="ineBack"
                            accept=".pdf,.jpg,.jpeg,.png"
                            maxSize={5}
                            maxFiles={1}
                            instruction="Sube el reverso de tu INE (lado trasero)"
                            onChange={(files) => setFormData({ ...formData, ineBackFile: files[0] || null })}
                            error={errors.ineBackFile}
                            required
                        />
                    </div>

                    {/* Separador */}
                    <div className={styles.separator}></div>

                    {/* Columna Derecha */}
                    <div className={styles.column}>
                        <PostalCodeInput
                            postalCode={formData.postalCode || ''}
                            onPostalCodeChange={(value) => setFormData({ ...formData, postalCode: value })}
                            state={formData.state || ''}
                            onStateChange={(value) => setFormData({ ...formData, state: value })}
                            city={formData.city || ''}
                            onCityChange={(value) => setFormData({ ...formData, city: value })}
                            colony={formData.colony || ''}
                            onColonyChange={(value) => setFormData({ ...formData, colony: value })}
                            address={formData.address || ''}
                            onAddressChange={(value) => setFormData({ ...formData, address: value })}
                            errors={{
                                postalCode: errors.postalCode,
                                state: errors.state,
                                city: errors.city,
                                colony: errors.colony,
                                address: errors.address,
                            }}
                        />

                        <FileUpload
                            label="✅ Confirma tu dirección"
                            name="proofOfAddress"
                            accept=".pdf,.jpg,.jpeg,.png"
                            maxSize={5}
                            maxFiles={1}
                            instruction="Carga un comprobante con una antigüedad no mayor a 3 meses. (Recibo de luz, recibo de agua, recibo de internet, etc)"
                            onChange={(files) => setFormData({ ...formData, proofOfAddressFile: files[0] || null })}
                            error={errors.proofOfAddressFile}
                            required
                        />

                        <TextInput
                            label="📧 Correo electrónico"
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(value) => setFormData({ ...formData, email: value })}
                            placeholder="tu@email.com"
                            error={errors.email}
                            helpText="Aquí te enviaremos noticias de tu peludo y de la comunidad"
                            required
                            memberstackField="email"
                        />

                        <PhoneInput
                            label="📞 Número de teléfono"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={(value) => setFormData({ ...formData, phone: value })}
                            error={errors.phone}
                            helpText="Para comunicarnos cuando sea importante. Sin spam, lo prometemos"
                            required
                            memberstackField="phone"
                        />

                        <TextInput
                            label="🔒 Contraseña"
                            name="password"
                            type="password"
                            value={formData.password || ''}
                            onChange={(value) => setFormData({ ...formData, password: value })}
                            placeholder="Mínimo 8 caracteres"
                            error={errors.password}
                            required
                            memberstackField="password"
                        />
                    </div>
                </div>

                {/* Botón de Submit */}
                <div className={styles.submitWrapper}>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : 'Siguiente'}
                    </button>
                </div>
            </form>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
