'use client';

import React, { useState, useEffect } from 'react';
import {
    AmbassadorStep1Data,
    AmbassadorStep2Data,
    AmbassadorStep3Data,
    AmbassadorFormData,
    Gender
} from '@/types/ambassador.types';
import { checkAmbassadorAvailability } from '@/app/actions/ambassador.actions';
import Step1PersonalInfo from './Step1PersonalInfo';
import Step2AdditionalInfo from './Step2AdditionalInfo';
import Step3BankingInfo from './Step3BankingInfo';
import Step4Success from './Step4Success';
import { trackLead, trackCompleteRegistration, trackSubmitApplication } from '@/components/Analytics/MetaPixel';
import styles from './AmbassadorForm.module.css';

// Initial values
const initialStep1: AmbassadorStep1Data = {
    first_name: '',
    paternal_surname: '',
    maternal_surname: '',
    gender: '' as Gender | '',
    birth_date: '',
    curp: '',
    ine_front: null,
    ine_back: null,
    postal_code: '',
    state: '',
    city: '',
    neighborhood: '',
    address: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
};

const initialStep2: AmbassadorStep2Data = {
    instagram: '',
    facebook: '',
    tiktok: '',
    other_social: '',
    motivation: ''
};

const initialStep3: AmbassadorStep3Data = {
    rfc: '',
    payment_method: '',
    bank_name: '',
    card_number: '',
    clabe: '',
    accept_terms: false,
    accept_communications: false
};

interface PreloadedMemberData {
    firstName?: string;
    paternalLastName?: string;
    maternalLastName?: string;
    email?: string;
    phone?: string;
    customFields?: Record<string, string>;
}

interface Props {
    onSuccess?: () => void;
    linkedMemberstackId?: string;
    preloadedData?: PreloadedMemberData;
    startAtStep?: number;
    hideHeader?: boolean;
    onStepChange?: (step: number) => void;
}

export default function AmbassadorForm({ onSuccess, linkedMemberstackId, preloadedData, startAtStep, hideHeader, onStepChange }: Props) {
    // Si viene preloadedData o startAtStep, empezar en ese paso
    const [currentStep, setCurrentStep] = useState(startAtStep || (preloadedData ? 2 : 1));
    const [isExistingMember, setIsExistingMember] = useState(!!preloadedData);

    // Inicializar step1Data con los datos precargados si existen
    const getInitialStep1 = (): AmbassadorStep1Data => {
        if (!preloadedData) return initialStep1;

        const cf = preloadedData.customFields || {};
        return {
            ...initialStep1,
            first_name: preloadedData.firstName || cf['first-name'] || '',
            paternal_surname: preloadedData.paternalLastName || cf['paternal-last-name'] || '',
            maternal_surname: preloadedData.maternalLastName || cf['maternal-last-name'] || '',
            email: preloadedData.email || '',
            phone: preloadedData.phone || cf['phone'] || '',
            gender: (cf['gender'] as Gender) || '',
            birth_date: cf['birth-date'] || '',
            curp: cf['curp'] || '',
            postal_code: cf['postal-code'] || '',
            state: cf['state'] || '',
            city: cf['city'] || '',
            neighborhood: cf['neighborhood'] || cf['colony'] || '',
            address: cf['address'] || '',
            password: 'MEMBER_LINKED',
            confirm_password: 'MEMBER_LINKED'
        };
    };

    const [step1Data, setStep1Data] = useState<AmbassadorStep1Data>(getInitialStep1);
    const [step2Data, setStep2Data] = useState<AmbassadorStep2Data>(initialStep2);
    const [step3Data, setStep3Data] = useState<AmbassadorStep3Data>(initialStep3);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoadingMember, setIsLoadingMember] = useState(!preloadedData);
    const [memberstackId, setMemberstackId] = useState<string | null>(linkedMemberstackId || null);

    // Controlar visibilidad de las imágenes según el paso actual
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const catImage = document.getElementById('embajador-img-gato') as HTMLImageElement;
            const girlImage = document.getElementById('embajador-img-nina') as HTMLImageElement;
            const manImage = document.getElementById('embajador-img-hombre') as HTMLImageElement;
            const exitoImage = document.getElementById('embajador-img-exito') as HTMLImageElement;
            
            // Ocultar todas primero
            if (catImage) catImage.style.display = 'none';
            if (girlImage) girlImage.style.display = 'none';
            if (manImage) manImage.style.display = 'none';
            if (exitoImage) exitoImage.style.display = 'none';
            
            // Si es éxito, mostrar imagen de éxito
            if (showSuccess && exitoImage) {
                exitoImage.style.display = '';
                return;
            }
            
            // Mostrar la correspondiente al paso actual
            if (currentStep === 2 && girlImage) {
                girlImage.style.display = '';
            } else if (currentStep === 3 && manImage) {
                manImage.style.display = '';
            } else if (catImage) {
                catImage.style.display = '';
            }
        }
    }, [currentStep, showSuccess]);

    // Notificar al padre cuando cambia el paso
    useEffect(() => {
        // Si es éxito, notificar como paso 4
        if (showSuccess) {
            onStepChange?.(4);
        } else {
            onStepChange?.(currentStep);
        }
    }, [currentStep, showSuccess, onStepChange]);

    // Cargar datos del miembro de Memberstack si está logueado
    useEffect(() => {
        const loadMemberData = async () => {
            setIsLoadingMember(true);

            // Esperar a que Memberstack esté disponible
            if (typeof window !== 'undefined' && window.$memberstackDom) {
                try {
                    const memberResult = await window.$memberstackDom.getCurrentMember();
                    const member = memberResult?.data;

                    if (member) {
                        // Guardar ID de Memberstack
                        setMemberstackId(member.id);

                        // Obtener campos personalizados
                        const cf = member.customFields || {};
                        const email = member.auth?.email || '';

                        // Campos críticos para saltar al paso 2 (mínimos de Memberstack)
                        const hasRequiredBasicInfo =
                            cf['first-name'] &&
                            email;

                        if (hasRequiredBasicInfo) {
                            // Marcar como miembro existente y saltar al paso 2
                            setIsExistingMember(true);
                            setCurrentStep(2);
                            console.log('✅ Miembro existente detectado, saltando al paso 2.');
                        } else {
                            console.log('⚠️ No se detectó información básica de miembro, permaneciendo en paso 1.');
                        }

                        // Mapear campos de Memberstack a nuestro formulario
                        setStep1Data(prev => ({
                            ...prev,
                            first_name: cf['first-name'] || '',
                            paternal_surname: cf['paternal-last-name'] || '',
                            maternal_surname: cf['maternal-last-name'] || '',
                            gender: (cf['gender'] as Gender) || '',
                            birth_date: cf['birth-date'] || '',
                            curp: cf['curp'] || '',
                            postal_code: cf['postal-code'] || '',
                            state: cf['state'] || '',
                            city: cf['city'] || '',
                            neighborhood: cf['neighborhood'] || cf['colony'] || '',
                            address: cf['address'] || cf['street-address'] || '',
                            email: email,
                            phone: cf['phone'] || cf['phone-number'] || '',
                            // Contraseña por defecto si es usuario existente
                            password: prev.password || 'MEMBERSTACK_USER',
                            confirm_password: prev.confirm_password || 'MEMBERSTACK_USER'
                        }));
                    }
                } catch (error) {
                    console.log('ℹ️ Usuario no logueado en Memberstack:', error);
                }
            }

            setIsLoadingMember(false);
        };

        // Pequeño delay para asegurar que Memberstack esté listo
        const timer = setTimeout(loadMemberData, 500);
        return () => clearTimeout(timer);
    }, []);


    // Handlers para cada paso
    const handleStep1Change = (field: keyof AmbassadorStep1Data, value: string | File | null) => {
        setStep1Data(prev => ({ ...prev, [field]: value }));

        // Validación inmediata para fecha de nacimiento
        if (field === 'birth_date' && typeof value === 'string') {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                setErrors(prev => ({ ...prev, birth_date: 'Debes ser mayor de 18 años' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.birth_date;
                    return newErrors;
                });
            }
            return;
        }

        // Limpiar error del campo
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleStep2Change = (field: keyof AmbassadorStep2Data, value: string) => {
        setStep2Data(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleStep3Change = (field: keyof AmbassadorStep3Data, value: string | boolean) => {
        setStep3Data(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Import (esto va arriba del todo, pero aquí lo simulo para el contexto del replace)
    // import { checkAmbassadorAvailability } from '@/app/actions/ambassador.actions';

    const handleFileUpload = (field: 'ine_front' | 'ine_back', file: File) => {
        setStep1Data(prev => ({ ...prev, [field]: file }));
        // Limpiar error al subir archivo
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Validaciones en tiempo real (onBlur)
    const handleBlur = async (field: keyof AmbassadorStep1Data | keyof AmbassadorStep3Data) => {
        // 1. Validación de Contraseñas
        if (field === 'confirm_password' || field === 'password') {
            if (step1Data.password && step1Data.confirm_password) {
                if (step1Data.password !== step1Data.confirm_password) {
                    setErrors(prev => ({ ...prev, confirm_password: 'Las contraseñas no coinciden' }));
                } else {
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors['confirm_password'];
                        return newErrors;
                    });
                }
            }
            return;
        }

        // 2. Validación de CURP
        if (field === 'curp' && step1Data.curp) {
            const curp = step1Data.curp.toUpperCase();

            // Regex CURP
            const curpRegex = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/;

            if (!curpRegex.test(curp)) {
                setErrors(prev => ({ ...prev, curp: 'Formato de CURP inválido' }));
                return;
            }

            // Verificar disponibilidad en servidor
            const check = await checkAmbassadorAvailability('curp', curp);
            if (!check.available) {
                setErrors(prev => ({ ...prev, curp: 'Este CURP ya está registrado' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors['curp'];
                    return newErrors;
                });
            }
        }

        // 3. Validación de RFC
        if (field === 'rfc' && step3Data.rfc) {
            const rfc = step3Data.rfc.toUpperCase();

            // Regex RFC (Personas Físicas)
            const rfcRegex = /^([A-ZÑ&]{4})\d{6}([A-Z\d]{3})$/;

            if (!rfcRegex.test(rfc)) {
                setErrors(prev => ({ ...prev, rfc: 'RFC inválido (Formato persona física)' }));
                return;
            }

            // Verificar disponibilidad en servidor
            const check = await checkAmbassadorAvailability('rfc', rfc);
            if (!check.available) {
                setErrors(prev => ({ ...prev, rfc: 'Este RFC ya está registrado' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors['rfc'];
                    return newErrors;
                });
            }
        }

        // 4. Validación de Email
        if (field === 'email' && step1Data.email) {
            const email = step1Data.email.trim();
            // Regex simple para email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                setErrors(prev => ({ ...prev, email: 'Correo inválido' }));
                return;
            }

            // Verificar disponibilidad en servidor
            const check = await checkAmbassadorAvailability('email', email);
            if (!check.available) {
                setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors['email'];
                    return newErrors;
                });
            }
        }
    };

    // Validaciones
    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!step1Data.first_name.trim()) newErrors.first_name = 'El nombre es requerido';
        if (!step1Data.paternal_surname.trim()) newErrors.paternal_surname = 'El apellido paterno es requerido';
        if (!step1Data.birth_date) newErrors.birth_date = 'La fecha de nacimiento es requerida';
        if (!step1Data.curp.trim()) newErrors.curp = 'El CURP es requerido';
        else if (step1Data.curp.length !== 18) newErrors.curp = 'El CURP debe tener 18 caracteres';

        if (!step1Data.email.trim()) newErrors.email = 'El correo es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Data.email)) newErrors.email = 'Correo inválido';

        if (!step1Data.phone.trim()) newErrors.phone = 'El teléfono es requerido';
        else if (step1Data.phone.length !== 10) newErrors.phone = 'El teléfono debe tener 10 dígitos';

        if (!step1Data.postal_code.trim()) newErrors.postal_code = 'El código postal es requerido';
        if (!step1Data.state) newErrors.state = 'El estado es requerido';
        if (!step1Data.city.trim()) newErrors.city = 'La ciudad es requerida';
        if (!step1Data.neighborhood.trim()) newErrors.neighborhood = 'La colonia es requerida';

        if (!step1Data.password) newErrors.password = 'La contraseña es requerida';
        else if (step1Data.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';

        if (step1Data.password !== step1Data.confirm_password) {
            newErrors.confirm_password = 'Las contraseñas no coinciden';
        }

        // Validar archivos INE
        if (!step1Data.ine_front) {
            newErrors.ine_front = 'Debes subir el frente de tu INE';
        }
        if (!step1Data.ine_back) {
            newErrors.ine_back = 'Debes subir el reverso de tu INE';
        }

        // Verificar edad mínima (18 años)
        if (step1Data.birth_date) {
            const birthDate = new Date(step1Data.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                newErrors.birth_date = 'Debes ser mayor de 18 años para continuar';
                // Asegurarse de que esto bloquee
            }
        }

        setErrors(newErrors);
        // Si hay errores, retornar false
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!step2Data.motivation.trim()) {
            newErrors.motivation = 'Cuéntanos por qué quieres ser embajador';
        } else if (step2Data.motivation.length < 50) {
            newErrors.motivation = 'Escribe al menos 50 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!step3Data.rfc.trim()) {
            newErrors.rfc = 'El RFC es requerido';
        } else if (step3Data.rfc.length < 12 || step3Data.rfc.length > 13) {
            newErrors.rfc = 'RFC inválido (12 o 13 caracteres)';
        }

        if (!step3Data.payment_method) {
            newErrors.payment_method = 'Selecciona un método de pago';
        }

        if (step3Data.payment_method === 'clabe' && step3Data.clabe.length !== 18) {
            newErrors.clabe = 'La CLABE debe tener 18 dígitos';
        }

        if (!step3Data.accept_terms) {
            newErrors.accept_terms = 'Debes aceptar los términos y condiciones';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navegación
    const handleNext = async () => {
        let isValid = false;

        try {
            switch (currentStep) {
                case 1:
                    isValid = validateStep1();
                    if (isValid) {
                        try {
                            // Verificar disponibilidad antes de avanzar
                            const [curpCheck, emailCheck] = await Promise.all([
                                checkAmbassadorAvailability('curp', step1Data.curp),
                                checkAmbassadorAvailability('email', step1Data.email)
                            ]);

                            if (!curpCheck.available) {
                                setErrors(prev => ({ ...prev, curp: 'Este CURP ya está registrado' }));
                                isValid = false;
                            }
                            if (!emailCheck.available) {
                                setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
                                isValid = false;
                            }
                        } catch (err) {
                            console.error('Error verificando disponibilidad:', err);
                            // Si falla la verificación, permitir continuar igual
                        }
                    }
                    break;
                case 2:
                    isValid = validateStep2();
                    break;
                case 3:
                    isValid = validateStep3();
                    if (isValid) {
                        try {
                            // Verificar RFC antes de enviar
                            const rfcCheck = await checkAmbassadorAvailability('rfc', step3Data.rfc);
                            if (!rfcCheck.available) {
                                setErrors(prev => ({ ...prev, rfc: 'Este RFC ya está registrado' }));
                                return; // Detener envío
                            }
                        } catch (err) {
                            console.error('Error verificando RFC:', err);
                        }

                        handleSubmit();
                        return;
                    }
                    break;
            }

            if (isValid && currentStep < 3) {
                setCurrentStep(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error en handleNext:', error);
            setErrors(prev => ({ ...prev, submit: 'Ocurrió un error. Intenta de nuevo.' }));
        }
    };

    const handleBack = () => {
        // Si es miembro existente, no puede volver al paso 1
        const minStep = isExistingMember ? 2 : 1;
        if (currentStep > minStep) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Enviar formulario
    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // 0. Si no hay ID de Memberstack, intentar crear cuenta primero
            let finalMemberstackId = memberstackId || linkedMemberstackId;

            if (!finalMemberstackId && step1Data.email && step1Data.password) {
                console.log("Creating Memberstack user...");
                try {
                    // @ts-ignore
                    const msResult = await window.$memberstackDom.signupMemberEmailPassword({
                        email: step1Data.email,
                        password: step1Data.password
                    });

                    if (msResult.data && msResult.data.member) {
                        finalMemberstackId = msResult.data.member.id;
                        console.log("Memberstack user created:", finalMemberstackId);
                    } else {
                        throw new Error("No se pudo crear la cuenta en Memberstack");
                    }
                } catch (msError: any) {
                    console.error("Memberstack creation error:", msError);
                    setErrors({ submit: msError.message || "Error al crear la cuenta de usuario" });
                    setIsSubmitting(false);
                    return;
                }
            }

            // Primero subir archivos INE si existen
            let ineFrontUrl = '';
            let ineBackUrl = '';

            if (step1Data.ine_front) {
                const formData = new FormData();
                formData.append('file', step1Data.ine_front);
                formData.append('type', 'ambassador_ine_front');

                const uploadRes = await fetch('/api/upload/ambassador-doc', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    ineFrontUrl = uploadData.url;
                }
            }

            if (step1Data.ine_back) {
                const formData = new FormData();
                formData.append('file', step1Data.ine_back);
                formData.append('type', 'ambassador_ine_back');

                const uploadRes = await fetch('/api/upload/ambassador-doc', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    ineBackUrl = uploadData.url;
                }
            }

            // Enviar datos del embajador
            const response = await fetch('/api/ambassadors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Step 1
                    first_name: step1Data.first_name,
                    paternal_surname: step1Data.paternal_surname,
                    maternal_surname: step1Data.maternal_surname || undefined,
                    gender: step1Data.gender || undefined,
                    birth_date: step1Data.birth_date,
                    curp: step1Data.curp,
                    ine_front_url: ineFrontUrl || undefined,
                    ine_back_url: ineBackUrl || undefined,
                    postal_code: step1Data.postal_code,
                    state: step1Data.state,
                    city: step1Data.city,
                    neighborhood: step1Data.neighborhood,
                    address: step1Data.address || undefined,
                    email: step1Data.email,
                    phone: step1Data.phone,
                    password: step1Data.password,

                    // Step 2
                    instagram: step2Data.instagram || undefined,
                    facebook: step2Data.facebook || undefined,
                    tiktok: step2Data.tiktok || undefined,
                    other_social: step2Data.other_social || undefined,
                    motivation: step2Data.motivation,

                    // Step 3
                    rfc: step3Data.rfc,
                    payment_method: step3Data.payment_method,
                    bank_name: step3Data.bank_name || undefined,
                    card_last_digits: step3Data.card_number || undefined,
                    clabe: step3Data.clabe || undefined,

                    // Vinculación con Memberstack (si está logueado o recién creado)
                    linked_memberstack_id: finalMemberstackId || undefined
                })
            });

            const data = await response.json();

            if (data.success) {
                // Track Meta Pixel Conversion
                trackLead({
                    content_name: 'Ambassador Registration',
                    content_category: 'ambassador_signup',
                    email: step1Data.email,
                    phone: step1Data.phone
                });
                trackCompleteRegistration({
                    content_name: 'Ambassador Registration',
                    content_category: 'ambassador_signup',
                    email: step1Data.email,
                    city: step1Data.city,
                    state: step1Data.state
                });
                trackSubmitApplication({
                    content_name: 'Ambassador Application',
                    content_category: 'ambassador_signup',
                    email: step1Data.email
                });
                setShowSuccess(true);
                onSuccess?.();
            } else {
                setErrors({ submit: data.error || 'Error al enviar la solicitud' });
            }
        } catch (error) {
            console.error('Error submitting ambassador form:', error);
            setErrors({ submit: 'Error de conexión. Intenta de nuevo.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Pantalla de éxito - Step 4
    if (showSuccess) {
        return <Step4Success />;
    }

    // Estado de carga mientras se obtienen datos del miembro
    if (isLoadingMember) {
        return (
            <div className={styles['ambassador-form-container']}>
                <div className={styles['ambassador-form-card']} style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <div className={styles['ambassador-spinner']} style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #eee',
                        borderTopColor: '#00BBB4',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <p style={{ color: '#666' }}>Cargando tu información...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header - oculto cuando hideHeader es true */}
            {!hideHeader && (
                <>
                    {/* Título principal */}
                    <h1 className={styles.mainTitle}>sé embajador pata amiga</h1>

                    {/* Stepper */}
                    <div className={styles.stepper}>
                        <div className={styles.stepperItem}>
                            <div className={`${styles.stepIcon} ${currentStep === 1 ? styles.stepIconActive : currentStep > 1 ? styles.stepIconCompleted : styles.stepIconInactive}`}>
                                {currentStep > 1 ? '✓' : '👤'}
                            </div>
                            <span className={`${styles.stepLabel} ${currentStep === 1 ? styles.stepLabelActive : currentStep > 1 ? styles.stepLabelCompleted : styles.stepLabelInactive}`}>
                                Completa tu perfil
                            </span>
                        </div>
                        <span className={styles.stepArrow}>→</span>
                        <div className={styles.stepperItem}>
                            <div className={`${styles.stepIcon} ${currentStep === 2 ? styles.stepIconActive : currentStep > 2 ? styles.stepIconCompleted : styles.stepIconInactive}`}>
                                {currentStep > 2 ? '✓' : '📋'}
                            </div>
                            <span className={`${styles.stepLabel} ${currentStep === 2 ? styles.stepLabelActive : currentStep > 2 ? styles.stepLabelCompleted : styles.stepLabelInactive}`}>
                                información adicional
                            </span>
                        </div>
                        <span className={styles.stepArrow}>→</span>
                        <div className={styles.stepperItem}>
                            <div className={`${styles.stepIcon} ${currentStep === 3 ? styles.stepIconActive : styles.stepIconInactive}`}>
                                💰
                            </div>
                            <span className={`${styles.stepLabel} ${currentStep === 3 ? styles.stepLabelActive : styles.stepLabelInactive}`}>
                                datos bancario y rfc
                            </span>
                        </div>
                    </div>
                </>
            )}
                {/* Mostrar error general */}
                {errors.submit && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '20px',
                        color: '#ef4444'
                    }}>
                        {errors.submit}
                    </div>
                )}

                {/* Mensaje de bienvenida para miembros existentes */}
                {isExistingMember && currentStep === 2 && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 187, 180, 0.1), rgba(0, 187, 180, 0.05))',
                        border: '1px solid #00BBB4',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '25px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👋</div>
                        <h3 style={{ color: '#00BBB4', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                            ¡Hola, {step1Data.first_name}!
                        </h3>
                        <p style={{ color: '#555', margin: 0, fontSize: '0.95rem' }}>
                            Tus datos personales ya están registrados en tu cuenta.
                            Solo necesitas completar la información adicional para ser embajador.
                        </p>
                    </div>
                )}

                {/* Steps Content */}
                {currentStep === 1 && (
                    <Step1PersonalInfo
                        data={step1Data}
                        onChange={handleStep1Change}
                        errors={errors}
                        onFileUpload={handleFileUpload}
                        // @ts-ignore
                        onBlur={handleBlur}
                        onNext={handleNext}
                        onBack={() => window.location.href = '/'}
                    />
                )}

                {currentStep === 2 && (
                    <Step2AdditionalInfo
                        data={step2Data}
                        onChange={handleStep2Change}
                        errors={errors}
                        onBack={handleBack}
                        onNext={handleNext}
                    />
                )}

                {currentStep === 3 && (
                    <Step3BankingInfo
                        data={step3Data}
                        onChange={handleStep3Change}
                        errors={errors}
                        // @ts-ignore
                        onBlur={handleBlur}
                        onBack={handleBack}
                        onNext={handleNext}
                        isSubmitting={isSubmitting}
                    />
                )}

        </>
    );
}
