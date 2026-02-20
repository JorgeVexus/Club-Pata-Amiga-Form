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
import { checkCurpAvailability, registerUserInSupabase, updateUserCrmContactId, getUserDataByMemberstackId } from '@/app/actions/user.actions';
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

    // Check auth on mount and load existing data from Supabase
    React.useEffect(() => {
        const checkAuth = async () => {
            // Pequeño delay para asegurar carga script
            await new Promise(r => setTimeout(r, 1000));

            if (window.$memberstackDom) {
                const { data: member } = await window.$memberstackDom.getCurrentMember();
                if (!member) {
                    // Si no hay usuario, mandar al login (solo en producción o si no es localhost)
                    if (window.location.hostname !== 'localhost') {
                        window.location.href = '/';
                    } else {
                        console.log('🚧 Localhost detectado: Bypass de redirección de sesión para desarrollo.');
                    }
                } else {
                    setMember(member);
                    
                    // Cargar datos existentes desde Supabase
                    try {
                        console.log('📥 Cargando datos existentes desde Supabase...');
                        const result = await getUserDataByMemberstackId(member.id);
                        
                        if (result.success && result.userData) {
                            const userData = result.userData;
                            console.log('✅ Datos cargados de Supabase:', userData);
                            
                            // Pre-llenar formulario con datos existentes
                            setFormData(prev => ({
                                ...prev,
                                email: member.auth.email,
                                firstName: userData.first_name || member.customFields?.['first-name'] || prev.firstName || '',
                                paternalLastName: userData.last_name || member.customFields?.['paternal-last-name'] || prev.paternalLastName || '',
                                maternalLastName: userData.mother_last_name || prev.maternalLastName || '',
                                gender: userData.gender || prev.gender || undefined,
                                birthDate: userData.birth_date || prev.birthDate || '',
                                curp: userData.curp || prev.curp || '',
                                // Note: isForeigner no está en Supabase, se mantiene en Memberstack
                                postalCode: userData.postal_code || prev.postalCode || '',
                                state: userData.state || prev.state || '',
                                city: userData.city || prev.city || '',
                                colony: userData.colony || prev.colony || '',
                                address: userData.address || prev.address || '',
                                phone: userData.phone || prev.phone || '',
                            }));
                            
                            showToast('Hemos recuperado tus datos guardados.', 'success');
                        } else {
                            // No hay datos en Supabase, usar solo Memberstack
                            setFormData(prev => ({
                                ...prev,
                                email: member.auth.email,
                                firstName: member.customFields?.['first-name'] || prev.firstName || '',
                                paternalLastName: member.customFields?.['paternal-last-name'] || prev.paternalLastName || ''
                            }));
                        }
                    } catch (error) {
                        console.error('Error cargando datos de Supabase:', error);
                        // Fallback a datos de Memberstack
                        setFormData(prev => ({
                            ...prev,
                            email: member.auth.email,
                            firstName: member.customFields?.['first-name'] || prev.firstName || '',
                            paternalLastName: member.customFields?.['paternal-last-name'] || prev.paternalLastName || ''
                        }));
                    }
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
            setErrors(prev => ({ ...prev, curp: curpValidation.error || 'CURP inválida' }));
            return;
        }

        // Verificar disponibilidad en servidor (pasando member.id para permitir reclamar CURP propio)
        try {
            const { available, error } = await checkCurpAvailability(formData.curp, member?.id);

            if (error) {
                console.error('Error verificando CURP:', error);
                return;
            }

            if (!available) {
                const msg = 'Este CURP ya está registrado por otro usuario.';
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

        // Validar unicidad de CURP antes de enviar (pasando member.id para permitir reclamar CURP propio)
        if (formData.curp) {
            const { available, error } = await checkCurpAvailability(formData.curp, member?.id);
            if (!available && !error) { // Solo bloqueamos si confirmado no disponible
                const msg = 'Este CURP ya está registrado por otro usuario.';
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
                    finalMemberId,
                    {
                        ineFront: ineUploads[0].publicUrl,
                        ineBack: ineUploads[1].publicUrl
                    }
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E91E63"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E91E63"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
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
                {/* Ícono decorativo esquina superior derecha - Figma */}
                <div className={styles.formBadge}>
                    <svg width="85" height="85" viewBox="0 0 85.0071 85.0071" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M42.5035 85.0071C65.9776 85.0071 85.0071 65.9776 85.0071 42.5035C85.0071 19.0295 65.9776 0 42.5035 0C19.0295 0 0 19.0295 0 42.5035C0 65.9776 19.0295 85.0071 42.5035 85.0071Z" fill="#FF8300" />
                        <path d="M16.6075 30.9406C15.5022 30.9406 14.6095 30.0479 14.6095 28.9427C14.6095 25.2442 17.6207 22.2331 21.3191 22.2331C22.4244 22.2331 23.3171 23.1258 23.3171 24.2311C23.3171 25.3363 22.4244 26.2291 21.3191 26.2291C19.8241 26.2291 18.6126 27.4406 18.6126 28.9356C18.6126 30.0408 17.7198 30.9336 16.6146 30.9336L16.6075 30.9406Z" fill="white" />
                        <path d="M68.3925 30.9407C67.2872 30.9407 66.3945 30.0479 66.3945 28.9427C66.3945 27.4477 65.183 26.2361 63.688 26.2361C62.5827 26.2361 61.69 25.3434 61.69 24.2381C61.69 23.1329 62.5827 22.2401 63.688 22.2401C67.3864 22.2401 70.3976 25.2513 70.3976 28.9497C70.3976 30.055 69.5049 30.9477 68.3996 30.9477L68.3925 30.9407Z" fill="white" />
                        <path d="M63.688 63.9006C62.5827 63.9006 61.69 63.0078 61.69 61.9026C61.69 60.7973 62.5827 59.9046 63.688 59.9046C65.183 59.9046 66.3945 58.693 66.3945 57.198C66.3945 56.0928 67.2872 55.2001 68.3925 55.2001C69.4978 55.2001 70.3905 56.0928 70.3905 57.198C70.3905 60.8965 67.3793 63.9076 63.6809 63.9076L63.688 63.9006Z" fill="white" />
                        <path d="M21.3191 63.9006C17.6207 63.9006 14.6095 60.8894 14.6095 57.191C14.6095 56.0857 15.5022 55.193 16.6075 55.193C17.7128 55.193 18.6055 56.0857 18.6055 57.191C18.6055 58.6859 19.817 59.8975 21.312 59.8975C22.4173 59.8975 23.31 60.7902 23.31 61.8955C23.31 63.0008 22.4173 63.8935 21.312 63.8935L21.3191 63.9006Z" fill="white" />
                        <path d="M16.6075 59.189C15.5022 59.189 14.6095 58.2962 14.6095 57.191V28.9427C14.6095 27.8374 15.5022 26.9447 16.6075 26.9447C17.7128 26.9447 18.6055 27.8374 18.6055 28.9427V57.191C18.6055 58.2962 17.7128 59.189 16.6075 59.189Z" fill="white" />
                        <path d="M68.3925 59.189C67.2872 59.189 66.3945 58.2962 66.3945 57.191V28.9427C66.3945 27.8374 67.2872 26.9447 68.3925 26.9447C69.4978 26.9447 70.3905 27.8374 70.3905 28.9427V57.191C70.3905 58.2962 69.4978 59.189 68.3925 59.189Z" fill="white" />
                        <path d="M63.688 63.9006H21.3191C20.2138 63.9006 19.3211 63.0078 19.3211 61.9026C19.3211 60.7973 20.2138 59.9046 21.3191 59.9046H63.688C64.7933 59.9046 65.686 60.7973 65.686 61.9026C65.686 63.0078 64.7933 63.9006 63.688 63.9006Z" fill="white" />
                        <path d="M63.688 26.2361H21.3191C20.2138 26.2361 19.3211 25.3434 19.3211 24.2381C19.3211 23.1329 20.2138 22.2401 21.3191 22.2401H63.688C64.7933 22.2401 65.686 23.1329 65.686 24.2381C65.686 25.3434 64.7933 26.2361 63.688 26.2361Z" fill="white" />
                        <path d="M58.9764 35.6522H47.208C46.1028 35.6522 45.2101 34.7595 45.2101 33.6542C45.2101 32.549 46.1028 31.6562 47.208 31.6562H58.9764C60.0817 31.6562 60.9744 32.549 60.9744 33.6542C60.9744 34.7595 60.0817 35.6522 58.9764 35.6522Z" fill="white" />
                        <path d="M54.2719 45.0683H47.208C46.1028 45.0683 45.2101 44.1756 45.2101 43.0703C45.2101 41.9651 46.1028 41.0723 47.208 41.0723H54.2719C55.3772 41.0723 56.2699 41.9651 56.2699 43.0703C56.2699 44.1756 55.3772 45.0683 54.2719 45.0683Z" fill="white" />
                        <path d="M33.0874 45.0684C29.389 45.0684 26.3778 42.0572 26.3778 38.3588C26.3778 34.6603 29.389 31.6492 33.0874 31.6492C36.7859 31.6492 39.797 34.6603 39.797 38.3588C39.797 42.0572 36.7859 45.0684 33.0874 45.0684ZM33.0874 35.6522C31.5925 35.6522 30.3809 36.8638 30.3809 38.3588C30.3809 39.8537 31.5925 41.0653 33.0874 41.0653C34.5824 41.0653 35.7939 39.8537 35.7939 38.3588C35.7939 36.8638 34.5824 35.6522 33.0874 35.6522Z" fill="white" />
                        <path d="M40.1442 52.1322C39.0389 52.1322 38.1462 51.2395 38.1462 50.1342C38.1462 47.3427 35.879 45.0754 33.0874 45.0754C31.9822 45.0754 31.0894 44.1827 31.0894 43.0774C31.0894 41.9722 31.9822 41.0794 33.0874 41.0794C38.0824 41.0794 42.1493 45.1463 42.1493 50.1413C42.1493 51.2466 41.2566 52.1393 40.1513 52.1393L40.1442 52.1322Z" fill="white" />
                        <path d="M26.0236 52.1322C24.9183 52.1322 24.0256 51.2395 24.0256 50.1342C24.0256 45.1392 28.0924 41.0723 33.0874 41.0723C34.1927 41.0723 35.0854 41.9651 35.0854 43.0703C35.0854 44.1756 34.1927 45.0683 33.0874 45.0683C30.2959 45.0683 28.0287 47.3356 28.0287 50.1271C28.0287 51.2324 27.136 52.1251 26.0307 52.1251L26.0236 52.1322Z" fill="white" />
                        <path d="M26.0236 54.4845C24.9183 54.4845 24.0256 53.5917 24.0256 52.4865V50.1342C24.0256 49.0289 24.9183 48.1362 26.0236 48.1362C27.1289 48.1362 28.0216 49.0289 28.0216 50.1342V52.4865C28.0216 53.5917 27.1289 54.4845 26.0236 54.4845Z" fill="white" />
                        <path d="M40.1442 54.4845C39.0389 54.4845 38.1462 53.5917 38.1462 52.4865V50.1342C38.1462 49.0289 39.0389 48.1362 40.1442 48.1362C41.2495 48.1362 42.1422 49.0289 42.1422 50.1342V52.4865C42.1422 53.5917 41.2495 54.4845 40.1442 54.4845Z" fill="white" />
                        <path d="M40.1442 54.4845H26.0236C24.9183 54.4845 24.0256 53.5917 24.0256 52.4865C24.0256 51.3812 24.9183 50.4885 26.0236 50.4885H40.1442C41.2495 50.4885 42.1422 51.3812 42.1422 52.4865C42.1422 53.5917 41.2495 54.4845 40.1442 54.4845Z" fill="white" />
                    </svg>
                </div>

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
                            suppressHydrationWarning
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
