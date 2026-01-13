'use client';

import React, { useState } from 'react';
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

interface Props {
    onSuccess?: () => void;
    linkedMemberstackId?: string; // Si viene de un usuario existente
}

export default function AmbassadorForm({ onSuccess, linkedMemberstackId }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [step1Data, setStep1Data] = useState<AmbassadorStep1Data>(initialStep1);
    const [step2Data, setStep2Data] = useState<AmbassadorStep2Data>(initialStep2);
    const [step3Data, setStep3Data] = useState<AmbassadorStep3Data>(initialStep3);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

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
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Enviar formulario
    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
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

                    // Opcional
                    linked_memberstack_id: linkedMemberstackId
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

    // Pantalla de éxito
    if (showSuccess) {
        return (
            <div className={styles['ambassador-form-container']}>
                <div className={styles['ambassador-form-card']}>
                    <div className={styles['ambassador-success']}>
                        <div className={styles['ambassador-success-icon']}>🎉</div>
                        <h2>¡Solicitud enviada!</h2>
                        <p>
                            Gracias por querer ser parte de la manada. Tu solicitud está siendo
                            revisada por nuestro equipo. Te notificaremos por correo cuando sea aprobada.
                        </p>
                        <div className={styles['ambassador-success-info']}>
                            <h4>¿Qué sigue?</h4>
                            <p>Revisaremos tu información en las próximas 24-48 horas. Una vez aprobado,
                                recibirás acceso a tu dashboard de embajador con tu código de referido único.</p>
                        </div>
                        <button
                            className={`${styles['ambassador-btn']} ${styles['ambassador-btn-primary']}`}
                            onClick={() => window.location.href = '/'}
                        >
                            Volver al inicio
                        </button>
                    </div>
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
                <div className={`${styles['ambassador-step']} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
                    <div className={styles['ambassador-step-icon']}>
                        {currentStep > 1 ? '✓' : '👤'}
                    </div>
                    <span className={styles['ambassador-step-label']}>Completa tu perfil</span>
                </div>

                <div className={`${styles['ambassador-step-line']} ${currentStep > 1 ? styles.completed : ''}`}></div>

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
                        {currentStep > 1 && (
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
