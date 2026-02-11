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
import Toggle from '@/components/FormFields/Toggle';
import { checkCurpAvailability, registerUserInSupabase, updateUserCrmContactId } from '@/app/actions/user.actions';
import { createMemberstackUser, completeMemberProfile } from '@/services/memberstack.service';
import { uploadMultipleFiles, uploadFile } from '@/services/supabase.service';
import { validateCURP, formatCURP } from '@/utils/curp-validator';
import { validateBirthDate, getMaxBirthDateForAdult } from '@/utils/age-validator';
import Toast from '@/components/UI/Toast';
import type { RegistrationFormData } from '@/types/form.types';
import styles from './RegistrationForm.module.css';

interface RegistrationFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function RegistrationForm({ onSuccess, onCancel }: RegistrationFormProps = {}) {
    const [member, setMember] = useState<any>(null); // Store current member

    // Check auth on mount
    React.useEffect(() => {
        const checkAuth = async () => {
            // Pequeño delay para asegurar carga script
            await new Promise(r => setTimeout(r, 1000));

            if (window.$memberstackDom) {
                const { data: member } = await window.$memberstackDom.getCurrentMember();
                if (!member) {
                    // Si no hay usuario, mandar al login
                    window.location.href = '/';
                } else {
                    setMember(member);
                    setFormData(prev => ({
                        ...prev,
                        email: member.auth.email,
                        // Pre-fill name if available (e.g. from Google)
                        firstName: member.customFields?.['first-name'] || prev.firstName || '',
                        paternalLastName: member.customFields?.['paternal-last-name'] || prev.paternalLastName || ''
                    }));
                }
            }
        };
        checkAuth();
    }, []);

    const [formData, setFormData] = useState<Partial<RegistrationFormData>>({
        firstName: '',
        paternalLastName: '',
        maternalLastName: '',
        gender: undefined,
        birthDate: '',
        curp: '',
        isForeigner: false,
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

        if (!formData.isForeigner && !formData.maternalLastName?.trim()) {
            newErrors.maternalLastName = 'El apellido materno es requerido';
        }
        if (!formData.gender) newErrors.gender = 'Selecciona una opción';
        if (!formData.birthDate) {
            newErrors.birthDate = 'La fecha de nacimiento es requerida';
        } else {
            // Validar mayoría de edad (18 años)
            const birth = new Date(formData.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birth.getFullYear(); // Diferencia de años
            const monthDiff = today.getMonth() - birth.getMonth(); // Diferencia de meses 

            // Si aún no cumple años este año (mes actual < mes nacimiento, o mismo mes pero día actual < día nacimiento)
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                // Se resta un año a la edad calculada
                if (age - 1 < 18) {
                    newErrors.birthDate = 'Debes ser mayor de 18 años para registrarte';
                }
            } else if (age < 18) {
                newErrors.birthDate = 'Debes ser mayor de 18 años para registrarte';
            }
        }

        if (!formData.isForeigner && !formData.curp?.trim()) {
            newErrors.curp = 'El CURP es requerido';
        }
        // Validar CURP con validador completo - Solo si no es extranjero
        if (!formData.isForeigner && formData.curp) {
            const curpValidation = validateCURP(formData.curp);
            if (!curpValidation.isValid) {
                newErrors.curp = curpValidation.error || 'CURP inválida';
            }
        }

        if (!formData.ineFrontFile) newErrors.ineFrontFile = formData.isForeigner ? 'Debes subir tu pasaporte' : 'Debes subir el frente de tu INE';
        if (!formData.ineBackFile) newErrors.ineBackFile = formData.isForeigner ? 'Debes subir tu visa/sello' : 'Debes subir el reverso de tu INE';

        // Validar edad (debe ser mayor de 18 años)
        if (formData.birthDate) {
            const ageValidation = validateBirthDate(formData.birthDate);
            if (!ageValidation.isValid) {
                newErrors.birthDate = ageValidation.error || 'Fecha de nacimiento inválida';
            }
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

    const handleCurpBlur = async () => {
        if (!formData.curp) return;

        // Primero validamos formato localmente
        const curpValidation = validateCURP(formData.curp);
        if (!curpValidation.isValid) {
            // El error ya lo maneja validateForm, pero aquí forcejeamos update
            // O mejor dejamos que validateForm lo maneje en submit, 
            // pero para UX en blur es bueno mostrar formato invalido.
            setErrors(prev => ({ ...prev, curp: curpValidation.error || 'CURP inválida' }));
            return;
        }

        // Verificar disponibilidad en servidor
        try {
            const { available, error } = await checkCurpAvailability(formData.curp);

            if (error) {
                // Si hay error de sistema, no bloqueamos pero logueamos
                console.error('Error verificando CURP:', error);
                return;
            }

            if (!available) {
                const msg = 'Este CURP ya está registrado en nuestra manada.';
                setErrors(prev => ({ ...prev, curp: msg }));
                showToast('⚠️ ' + msg, 'warning');
            } else {
                // Si es válido y disponible, limpiamos error de CURP si existía
                setErrors(prev => {
                    const newErrs = { ...prev };
                    delete newErrs.curp;
                    return newErrs;
                });
            }
        } catch (err) {
            console.error(err);
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

        // Validar unicidad de CURP antes de enviar
        if (formData.curp) {
            const { available, error } = await checkCurpAvailability(formData.curp);
            if (!available && !error) { // Solo bloqueamos si confirmado no disponible
                const msg = 'Este CURP ya está registrado.';
                setErrors(prev => ({ ...prev, curp: msg }));
                showToast('⚠️ ' + msg, 'warning');
                scrollToError(['curp'], { curp: msg });
                setIsSubmitting(false);
                return;
            }
        }

        try {
            // Generar un ID temporal para el usuario (se reemplazará con el ID de Memberstack)
            const tempUserId = `temp_${Date.now()}`;

            // 1. Subir archivos a Supabase (solo INE, comprobante de domicilio ya no es requerido)
            const ineFiles = [formData.ineFrontFile!, formData.ineBackFile!];
            const ineUploads = await uploadMultipleFiles(
                ineFiles,
                'INE',
                tempUserId
            );

            // Verificar que las subidas fueron exitosas
            if (ineUploads.some(u => !u.success)) {
                throw new Error('Error al subir los archivos');
            }

            // 2. ACTUALIZAR usuario en Memberstack (Completar perfil)
            const memberstackResponse = await completeMemberProfile(
                formData as RegistrationFormData,
                {
                    ineUrls: ineUploads.map(u => u.publicUrl || ''),
                    proofOfAddressUrl: '', // Ya no se requiere
                }
            );

            if (!memberstackResponse.success) {
                throw new Error(memberstackResponse.error || 'Error al actualizar el perfil');
            }

            // 3. Guardar respaldo en Supabase (Base de datos real)
            try {
                const finalMemberId = memberstackResponse.member?.id || member?.id || tempUserId;
                console.log('📤 Enviando respaldo a Supabase. ID:', finalMemberId);

                // LIMPIEZA DE DATOS: Removemos los archivos del objeto para no exceder el límite de 1MB del Server Action
                // Solo necesitamos los datos de texto para la base de datos
                const {
                    ineFrontFile,
                    ineBackFile,
                    proofOfAddressFile,
                    ineFiles,
                    ...cleanData
                } = formData;

                const supabaseResult = await registerUserInSupabase(
                    cleanData,
                    finalMemberId
                );

                if (!supabaseResult.success) {
                    console.error('❌ ERROR CRÍTICO SUPABASE:', supabaseResult.error);
                    alert(`Error guardando en base de datos: ${supabaseResult.error}`);
                } else {
                    console.log('✅ Respaldo en Supabase completado.');

                    // 3.5 Sincronizar con CRM Lynsales
                    try {
                        console.log('🔄 Sincronizando con CRM Lynsales...');
                        const crmResponse = await fetch('/api/crm/upsert', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                firstName: formData.firstName,
                                lastName: `${formData.paternalLastName} ${formData.maternalLastName || ''}`.trim(),
                                email: formData.email,
                                phone: formData.phone,
                                gender: formData.gender === 'hombre' ? 'male' : formData.gender === 'mujer' ? 'female' : undefined,
                                address1: formData.address,
                                city: formData.city,
                                state: formData.state,
                                postalCode: formData.postalCode,
                                country: 'MX',
                                dateOfBirth: formData.birthDate
                            })
                        });

                        const crmData = await crmResponse.json();

                        if (crmData.success && crmData.contactId) {
                            console.log('✅ CRM sincronizado. Contact ID:', crmData.contactId);
                            // Guardar el ID del CRM en Supabase
                            await updateUserCrmContactId(finalMemberId, crmData.contactId);
                        } else {
                            console.warn('⚠️ CRM sync no exitoso:', crmData.error);
                        }
                    } catch (crmError) {
                        // No bloqueamos el registro si CRM falla
                        console.error('⚠️ Error no crítico sincronizando CRM:', crmError);
                    }
                }
            } catch (sbError: any) {
                console.error('❌ Error no crítico guardando en Supabase:', sbError);
                alert(`Error inesperado en respaldo: ${sbError.message}`);
            }

            // 4. Éxito - Redirigir a registro de mascotas
            setSubmitSuccess(true);

            // Llamar callback si existe, sino redirigir a la ruta anterior
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setTimeout(() => {
                    window.location.href = '/registro-mascotas';
                }, 1500);
            }
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
            {/* Header - Diseño Figma */}
            <div className={styles.header}>
                <h2 className={styles.title}>
                    Cuéntanos sobre ti
                    <span className={styles.titleHearts} aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E91E63"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E91E63"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </span>
                </h2>
                <p className={styles.subtitle}>
                    Para formar parte de esta manada, necesitamos conocerte un poquito
                </p>
                <p className={styles.privacyNote}>
                    Toda tu información es privada y se usa solo para fines de verificación.
                </p>
                {/* Logout Link for Testing/UX */}
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    ¿No eres tú?{' '}
                    <button
                        onClick={async () => {
                            await window.$memberstackDom.logout();
                            window.location.href = '/';
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-color)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                        }}
                        type="button"
                    >
                        Cerrar Sesión
                    </button>
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.columnsWrapper}>
                    {/* Columna Izquierda */}
                    <div className={styles.column}>
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

                        {!formData.isForeigner && (
                            <TextInput
                                label="Apellido materno"
                                name="maternalLastName"
                                value={formData.maternalLastName || ''}
                                onChange={(value) => setFormData({ ...formData, maternalLastName: value })}
                                placeholder="García"
                                error={errors.maternalLastName}
                                helpText="Como aparece en tu identificación oficial"
                                required
                                memberstackField="maternal-last-name"
                            />
                        )}

                        <RadioGroup
                            label="¿Cómo te identificas?"
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
                            label="Fecha de nacimiento"
                            name="birthDate"
                            value={formData.birthDate || ''}
                            onChange={(value) => setFormData({ ...formData, birthDate: value })}
                            error={errors.birthDate}
                            helpText="Para celebrar contigo cuando sea tu día"
                            required
                            memberstackField="birth-date"
                            maxDate={getMaxBirthDateForAdult()}
                        />

                        {!formData.isForeigner && (
                            <TextInput
                                label="CURP"
                                name="curp"
                                value={formData.curp || ''}
                                onChange={(value) => setFormData({ ...formData, curp: value.toUpperCase() })}
                                onBlur={handleCurpBlur}
                                placeholder="ABCD123456HDFRNN09"
                                error={errors.curp}
                                helpText="Para proteger tu identidad y la de toda la manada"
                                required
                                memberstackField="curp"
                                maxLength={18}
                            />
                        )}

                        <Toggle
                            label="¿Eres extranjero?"
                            checked={formData.isForeigner ?? false}
                            onChange={(checked) => setFormData({ ...formData, isForeigner: checked })}
                            helpText="Si activas esta opción, podrás subir tu pasaporte en lugar del INE."
                        />

                        <FileUpload
                            label={formData.isForeigner ? "Sube tu pasaporte (portada y sello/visa)" : "Sube tu INE por ambos lados"}
                            name="ineDocuments"
                            accept=".pdf,.jpg,.jpeg,.png"
                            maxSize={5}
                            maxFiles={2}
                            instruction={formData.isForeigner ? "Sube la portada y la página con sello o visa" : "Asegúrate de que se vea clara y completa"}
                            onChange={(files) => setFormData({
                                ...formData,
                                ineFrontFile: files[0] || null,
                                ineBackFile: files[1] || null
                            })}
                            error={errors.ineFrontFile || errors.ineBackFile}
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

                        {/* Comprobante de domicilio eliminado - ya no es necesario */}

                        <TextInput
                            label="Correo electrónico"
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(value) => setFormData({ ...formData, email: value })}
                            placeholder="tu@email.com"
                            error={errors.email}
                            helpText="Aquí te enviaremos noticias de tu peludo y de la comunidad"
                            required
                            memberstackField="email"
                            readOnly
                        />

                        <PhoneInput
                            label="Número de teléfono"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={(value) => setFormData({ ...formData, phone: value })}
                            error={errors.phone}
                            helpText="Para comunicarnos cuando sea importante. Sin spam, lo prometemos"
                            required
                            memberstackField="phone"
                        />


                    </div>
                </div>

                {/* Botones - Diseño Figma */}
                <div className={styles.submitWrapper}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => onCancel ? onCancel() : window.history.back()}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Procesando...' : 'Siguiente'}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
