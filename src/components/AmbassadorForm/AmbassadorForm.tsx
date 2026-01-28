'use client';

import React, { useState, useEffect } from 'react';
import {
    AmbassadorStep1Data,
    AmbassadorStep2Data,
    AmbassadorStep3Data,
    AmbassadorFormData,
    Gender
} from '@/types/ambassador.types';
import Step1PersonalInfo from './Step1PersonalInfo';
import Step2AdditionalInfo from './Step2AdditionalInfo';
import Step3BankingInfo from './Step3BankingInfo';
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
    accept_terms: false
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
}

export default function AmbassadorForm({ onSuccess, linkedMemberstackId, preloadedData }: Props) {
    // Si viene preloadedData, empezar en paso 2 y marcar como miembro existente
    const [currentStep, setCurrentStep] = useState(preloadedData ? 2 : 1);
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

    const handleFileUpload = (field: 'ine_front' | 'ine_back', file: File) => {
        setStep1Data(prev => ({ ...prev, [field]: file }));
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
                newErrors.birth_date = 'Debes ser mayor de 18 años';
            }
        }

        setErrors(newErrors);
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
    const handleNext = () => {
        let isValid = false;

        switch (currentStep) {
            case 1:
                isValid = validateStep1();
                break;
            case 2:
                isValid = validateStep2();
                break;
            case 3:
                isValid = validateStep3();
                if (isValid) {
                    handleSubmit();
                    return;
                }
                break;
        }

        if (isValid && currentStep < 3) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Pantalla de éxito - Modal
    if (showSuccess) {
        return (
            <div className={styles['ambassador-success-overlay']}>
                <div className={styles['ambassador-success-modal']}>
                    {/* Close button */}
                    <button
                        className={styles['ambassador-success-close']}
                        onClick={() => window.location.href = '/'}
                    >
                        ✕
                    </button>

                    {/* Icon */}
                    <div className={styles['ambassador-success-check']}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 className={styles['ambassador-success-title']}>Tu solicitud fue enviada</h2>
                    <p className={styles['ambassador-success-subtitle']}>
                        Queremos que todo sea claro, justo y con amor por la comunidad.
                    </p>

                    {/* Main message */}
                    <div className={styles['ambassador-success-message']}>
                        <p>
                            Gracias por querer sumar tu voz a la manada. Tu registro como Embajador está
                            en revisión y recibirá respuesta en las próximas <strong>24-48 horas</strong>.
                        </p>
                        <p>
                            Mientras tanto, siéntete con la tranquilidad de que ya diste el primer paso
                            para ayudar a que más familias y sus compañeros estén protegidos.
                        </p>
                    </div>

                    {/* What's next */}
                    <div className={styles['ambassador-success-steps']}>
                        <h4>¿Qué sigue?</h4>
                        <ol>
                            <li>
                                <strong>Revisaremos tu solicitud en 24-48 horas</strong><br />
                                Nuestro equipo verificará que todo esté en orden
                            </li>
                            <li>
                                <strong>Te enviaremos tu código personal</strong><br />
                                Si eres aprobado, recibirás un correo con tu código único y materiales para empezar
                            </li>
                            <li>
                                <strong>¡Empieza a compartir!</strong><br />
                                Usa tu código, comparte en redes, habla con amigos y empieza a generar comisiones
                            </li>
                            <li>
                                <strong>Recibe tus pagos mensuales</strong><br />
                                Cada mes depositaremos tus comisiones en la cuenta que registraste
                            </li>
                        </ol>
                    </div>

                    {/* Contact */}
                    <div className={styles['ambassador-success-contact']}>
                        <h4>¿Tienes dudas? Comunícate con nosotros</h4>
                        <div className={styles['ambassador-success-contact-items']}>
                            <a href="mailto:embajadores@clubpataamiga.com">
                                <span>✉️</span> embajadores@clubpataamiga.com
                            </a>
                            <a href="https://wa.me/526448995874" target="_blank" rel="noopener noreferrer">
                                <span>💬</span> WhatsApp: +52 644 899 5874
                            </a>
                        </div>
                        <p className={styles['ambassador-success-contact-note']}>
                            Respondemos en menos de 24 horas.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className={styles['ambassador-success-footer']}>
                        <p>
                            Te avisaremos por correo y dentro de tu panel cuando tengamos noticias.
                            <strong> ¡Qué alegría tenerte por aquí!</strong>
                        </p>
                        <button
                            className={styles['ambassador-success-btn']}
                            onClick={() => window.location.href = '/'}
                        >
                            Ir al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
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
        <div className={styles['ambassador-form-container']}>
            {/* Header */}
            <div className={styles['ambassador-header']}>
                <img
                    src="/images/logo-pata-amiga.png"
                    alt="Pata Amiga"
                    className={styles['ambassador-logo']}
                />
                <h1 className={styles['ambassador-title']}>Sé embajador pata amiga</h1>
            </div>

            {/* Stepper */}
            <div className={styles['ambassador-stepper']}>
                <div className={`${styles['ambassador-step']} ${currentStep >= 1 || isExistingMember ? styles.active : ''} ${currentStep > 1 || isExistingMember ? styles.completed : ''}`}>
                    <div className={styles['ambassador-step-icon']}>
                        {currentStep > 1 || isExistingMember ? '✓' : '👤'}
                    </div>
                    <span className={styles['ambassador-step-label']}>
                        {isExistingMember ? 'Perfil verificado' : 'Completa tu perfil'}
                    </span>
                </div>

                <div className={`${styles['ambassador-step-line']} ${currentStep > 1 || isExistingMember ? styles.completed : ''}`}></div>

                <div className={`${styles['ambassador-step']} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
                    <div className={styles['ambassador-step-icon']}>
                        {currentStep > 2 ? '✓' : '📋'}
                    </div>
                    <span className={styles['ambassador-step-label']}>Información adicional</span>
                </div>

                <div className={`${styles['ambassador-step-line']} ${currentStep > 2 ? styles.completed : ''}`}></div>

                <div className={`${styles['ambassador-step']} ${currentStep >= 3 ? styles.active : ''}`}>
                    <div className={styles['ambassador-step-icon']}>
                        💰
                    </div>
                    <span className={styles['ambassador-step-label']}>Datos bancarios y RFC</span>
                </div>
            </div>

            {/* Form Card */}
            <div className={styles['ambassador-form-card']}>
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
                    />
                )}

                {currentStep === 2 && (
                    <Step2AdditionalInfo
                        data={step2Data}
                        onChange={handleStep2Change}
                        errors={errors}
                    />
                )}

                {currentStep === 3 && (
                    <Step3BankingInfo
                        data={step3Data}
                        onChange={handleStep3Change}
                        errors={errors}
                    />
                )}

                {/* Navigation */}
                <div className={styles['ambassador-form-actions']}>
                    <button
                        type="button"
                        className={styles['ambassador-btn-cancel']}
                        onClick={() => window.history.back()}
                    >
                        Cancelar
                    </button>

                    <div className={styles['ambassador-nav-buttons']}>
                        {/* Mostrar botón Anterior solo si puede retroceder */}
                        {currentStep > 1 && !(isExistingMember && currentStep === 2) && (
                            <button
                                type="button"
                                className={`${styles['ambassador-btn']} ${styles['ambassador-btn-secondary']}`}
                                onClick={handleBack}
                            >
                                Anterior
                            </button>
                        )}

                        <button
                            type="button"
                            className={`${styles['ambassador-btn']} ${styles['ambassador-btn-primary']}`}
                            onClick={handleNext}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className={styles['ambassador-loading']}>
                                    <span className={styles['ambassador-spinner']}></span>
                                    Enviando...
                                </span>
                            ) : (
                                currentStep === 3 ? 'Enviar solicitud' : 'Siguiente'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Help floating */}
            <div className={styles['ambassador-help']}>
                <div className={styles['ambassador-help-icon']}>❓</div>
                <div className={styles['ambassador-help-text']}>
                    <p>¿Necesitas ayuda?</p>
                    <p><strong>Contáctanos</strong></p>
                    <a href="mailto:pata_amiga@gmail.com">📧 pata_amiga@gmail.com</a>
                    <a href="tel:+526448995874">📞 +52 644 899 5874</a>
                </div>
            </div>
        </div>
    );
}
