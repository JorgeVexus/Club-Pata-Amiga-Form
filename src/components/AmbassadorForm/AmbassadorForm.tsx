'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Gender } from '@/types/ambassador.types';
import { checkAmbassadorAvailability } from '@/app/actions/ambassador.actions';
import { trackLead, trackCompleteRegistration, trackSubmitApplication } from '@/components/Analytics/MetaPixel';
import SimplifiedStep, { SimplifiedAmbassadorData, TermsAcceptance } from './SimplifiedStep';
import Step4Success from './Step4Success';
import styles from './AmbassadorForm.module.css';

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

const initialFormData: SimplifiedAmbassadorData = {
    full_name: '',
    gender: '',
    curp: '',
    email: '',
    password: '',
    phone: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    motivation: ''
};

function buildFullName(preloadedData?: PreloadedMemberData): string {
    if (!preloadedData) return '';

    return [
        preloadedData.firstName,
        preloadedData.paternalLastName,
        preloadedData.maternalLastName
    ]
        .filter(Boolean)
        .join(' ')
        .trim();
}

function splitFullName(fullName: string) {
    const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');

    if (parts.length === 2) {
        return {
            first_name: parts[0],
            paternal_surname: parts[1],
            maternal_surname: ''
        };
    }

    return {
        first_name: parts.slice(0, -2).join(' '),
        paternal_surname: parts[parts.length - 2],
        maternal_surname: parts[parts.length - 1]
    };
}

function normalizePhone(value: string): string {
    return value.replace(/\D/g, '').slice(0, 10);
}

function normalizeCurp(value: string): string {
    return value.replace(/\s/g, '').toUpperCase().slice(0, 18);
}

function scrollToTop() {
    requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function scrollToField(field?: string) {
    if (!field || field === 'submit') {
        scrollToTop();
        return;
    }

    requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(`[data-field="${field}"]`);

        if (!target) {
            scrollToTop();
            return;
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const control = target.querySelector<HTMLElement>('input, textarea, button');
        control?.focus({ preventScroll: true });
    });
}

export default function AmbassadorForm({
    onSuccess,
    linkedMemberstackId,
    preloadedData,
    hideHeader,
    onStepChange
}: Props) {
    const [formData, setFormData] = useState<SimplifiedAmbassadorData>(() => ({
        ...initialFormData,
        full_name: buildFullName(preloadedData),
        gender: (preloadedData?.customFields?.gender as Gender) || '',
        curp: normalizeCurp(preloadedData?.customFields?.curp || ''),
        email: preloadedData?.email || '',
        phone: normalizePhone(preloadedData?.phone || preloadedData?.customFields?.phone || '')
    }));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoadingMember, setIsLoadingMember] = useState(!preloadedData);
    const [memberstackId, setMemberstackId] = useState<string | null>(linkedMemberstackId || null);
    const [termsAccepted, setTermsAccepted] = useState<TermsAcceptance | null>(null);

    const hasPreloadedMember = useMemo(() => Boolean(preloadedData || linkedMemberstackId), [linkedMemberstackId, preloadedData]);

    useEffect(() => {
        onStepChange?.(showSuccess ? 4 : 1);
    }, [onStepChange, showSuccess]);

    useEffect(() => {
        const saved = localStorage.getItem('ambassador_terms_acceptance');
        if (!saved) return;

        try {
            const parsed = JSON.parse(saved) as TermsAcceptance & { timestamp?: string };
            if (!parsed.timestamp) return;

            const timestamp = new Date(parsed.timestamp);
            const hoursDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                setTermsAccepted({
                    termsAndConditions: parsed.termsAndConditions,
                    privacyPolicy: parsed.privacyPolicy,
                    marketingConsent: parsed.marketingConsent,
                    clickwrap: parsed.clickwrap
                });
            }
        } catch (error) {
            localStorage.removeItem('ambassador_terms_acceptance');
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const catImage = document.getElementById('embajador-img-gato') as HTMLImageElement | null;
        const girlImage = document.getElementById('embajador-img-nina') as HTMLImageElement | null;
        const manImage = document.getElementById('embajador-img-hombre') as HTMLImageElement | null;
        const successImage = document.getElementById('embajador-img-exito') as HTMLImageElement | null;

        if (catImage) catImage.style.display = showSuccess ? 'none' : '';
        if (girlImage) girlImage.style.display = 'none';
        if (manImage) manImage.style.display = 'none';
        if (successImage) successImage.style.display = showSuccess ? '' : 'none';
    }, [showSuccess]);

    useEffect(() => {
        const loadMemberData = async () => {
            if (preloadedData) {
                setIsLoadingMember(false);
                return;
            }

            setIsLoadingMember(true);

            if (typeof window !== 'undefined' && window.$memberstackDom) {
                try {
                    const memberResult = await window.$memberstackDom.getCurrentMember();
                    const member = memberResult?.data;

                    if (member) {
                        const cf = member.customFields || {};
                        setMemberstackId(member.id);
                        setFormData(prev => ({
                            ...prev,
                            full_name: [
                                cf['first-name'],
                                cf['paternal-last-name'],
                                cf['maternal-last-name']
                            ].filter(Boolean).join(' ').trim() || prev.full_name,
                            gender: (cf.gender as Gender) || prev.gender,
                            curp: normalizeCurp(cf.curp || prev.curp),
                            email: member.auth?.email || prev.email,
                            phone: normalizePhone(cf.phone || cf['phone-number'] || prev.phone)
                        }));
                    }
                } catch (error) {
                    console.log('No hay sesion de Memberstack activa:', error);
                }
            }

            setIsLoadingMember(false);
        };

        const timer = setTimeout(loadMemberData, 500);
        return () => clearTimeout(timer);
    }, [preloadedData]);

    const handleChange = (field: keyof SimplifiedAmbassadorData, value: string) => {
        const normalizedValue =
            field === 'phone' ? normalizePhone(value) :
                field === 'curp' ? normalizeCurp(value) :
                    value;

        setFormData(prev => ({ ...prev, [field]: normalizedValue }));

        if (errors[field] || errors.submit) {
            setErrors(prev => {
                const nextErrors = { ...prev };
                delete nextErrors[field];
                delete nextErrors.submit;
                return nextErrors;
            });
        }
    };

    const handleTermsChange = (acceptance: TermsAcceptance | null) => {
        setTermsAccepted(acceptance);

        if (errors.accept_terms || errors.submit) {
            setErrors(prev => {
                const nextErrors = { ...prev };
                delete nextErrors.accept_terms;
                delete nextErrors.submit;
                return nextErrors;
            });
        }
    };

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};
        const nameParts = formData.full_name.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);

        if (nameParts.length < 2) {
            nextErrors.full_name = 'Escribe tu nombre completo con al menos un apellido';
        }

        if (!formData.gender) {
            nextErrors.gender = 'Selecciona una opcion';
        }

        if (!formData.curp.trim()) {
            nextErrors.curp = 'El CURP es requerido';
        } else if (formData.curp.length !== 18) {
            nextErrors.curp = 'El CURP debe tener 18 caracteres';
        }

        if (!formData.email.trim()) {
            nextErrors.email = 'El correo es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            nextErrors.email = 'Correo invalido';
        }

        if (!formData.password) {
            nextErrors.password = 'La contrasena es requerida';
        } else if (formData.password.length < 8) {
            nextErrors.password = 'Usa al menos 8 caracteres';
        }

        if (!formData.phone.trim()) {
            nextErrors.phone = 'El celular es requerido';
        } else if (formData.phone.length !== 10) {
            nextErrors.phone = 'El celular debe tener 10 digitos';
        }

        if (!formData.motivation.trim()) {
            nextErrors.motivation = 'Cuentanos por que quieres ser embajador';
        } else if (formData.motivation.trim().length < 30) {
            nextErrors.motivation = 'Escribe al menos 30 caracteres';
        }

        if (!termsAccepted) {
            nextErrors.accept_terms = 'Debes aceptar los terminos y condiciones';
        }

        return nextErrors;
    };

    const handleBlur = async (field: keyof SimplifiedAmbassadorData) => {
        if (field !== 'curp' && field !== 'email') return;

        const value = formData[field].trim();
        if (!value) return;

        if (field === 'curp' && value.length !== 18) return;
        if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;

        try {
            const check = await checkAmbassadorAvailability(field, value);
            if (!check.available) {
                setErrors(prev => ({
                    ...prev,
                    [field]: field === 'curp' ? 'Este CURP ya esta registrado' : 'Este correo ya esta registrado'
                }));
            }
        } catch (error) {
            console.error(`Error verificando ${field}:`, error);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationErrors = validateForm();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            scrollToField(Object.keys(validationErrors)[0]);
            return;
        }

        setIsSubmitting(true);

        try {
            const acceptedAt = new Date().toISOString();
            const termsAcceptance = termsAccepted ? {
                ...termsAccepted,
                timestamp: acceptedAt,
                source: 'ambassador_registration'
            } : undefined;

            const [curpCheck, emailCheck] = await Promise.all([
                checkAmbassadorAvailability('curp', formData.curp),
                checkAmbassadorAvailability('email', formData.email)
            ]);

            if (!curpCheck.available || !emailCheck.available) {
                const availabilityErrors = {
                    ...(curpCheck.available ? {} : { curp: 'Este CURP ya esta registrado' }),
                    ...(emailCheck.available ? {} : { email: 'Este correo ya esta registrado' })
                };
                setErrors(availabilityErrors);
                setIsSubmitting(false);
                scrollToField(Object.keys(availabilityErrors)[0]);
                return;
            }

            const nameParts = splitFullName(formData.full_name);
            const response = await fetch('/api/ambassadors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: nameParts.first_name,
                    paternal_surname: nameParts.paternal_surname,
                    maternal_surname: nameParts.maternal_surname || undefined,
                    gender: formData.gender || undefined,
                    birth_date: '',
                    curp: formData.curp,
                    email: formData.email.trim(),
                    phone: formData.phone,
                    password: formData.password,
                    facebook: formData.facebook.trim() || undefined,
                    instagram: formData.instagram.trim() || undefined,
                    tiktok: formData.tiktok.trim() || undefined,
                    motivation: formData.motivation.trim(),
                    payment_method: 'pending',
                    linked_memberstack_id: memberstackId || linkedMemberstackId || undefined,
                    terms_accepted_at: acceptedAt,
                    terms_version: '1.0',
                    terms_acceptance: termsAcceptance
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowSuccess(true);
                onSuccess?.();
                scrollToTop();

                try {
                    trackLead({
                        content_name: 'Ambassador Registration',
                        content_category: 'ambassador_signup',
                        email: formData.email,
                        phone: formData.phone
                    });
                    trackCompleteRegistration({
                        content_name: 'Ambassador Registration',
                        content_category: 'ambassador_signup',
                        email: formData.email
                    });
                    trackSubmitApplication({
                        content_name: 'Ambassador Application',
                        content_category: 'ambassador_signup',
                        email: formData.email
                    });
                } catch (trackingError) {
                    console.warn('Meta Pixel tracking failed after ambassador success:', trackingError);
                }
            } else {
                setErrors({ submit: data.error || 'Error al enviar la solicitud' });
                scrollToField('submit');
            }
        } catch (error) {
            console.error('Error submitting ambassador form:', error);
            setErrors({ submit: 'Error de conexion. Intenta de nuevo.' });
            scrollToField('submit');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return <Step4Success />;
    }

    if (isLoadingMember) {
        return (
            <div className={styles.loadingCard}>
                <div className={styles.spinner} />
                <p>Cargando tu informacion...</p>
            </div>
        );
    }

    return (
        <>
            {!hideHeader && (
                <h1 className={styles.mainTitle}>se embajador pata amiga</h1>
            )}

            {errors.submit && (
                <div className={styles.submitError}>
                    {errors.submit}
                </div>
            )}

            {hasPreloadedMember && (
                <div className={styles.memberNotice}>
                    <strong>Hola, {formData.full_name || formData.email}</strong>
                    <span>Usaremos los datos de tu cuenta para vincular tu solicitud.</span>
                </div>
            )}

            <SimplifiedStep
                data={formData}
                errors={errors}
                isSubmitting={isSubmitting}
                onBlur={handleBlur}
                onChange={handleChange}
                onTermsChange={handleTermsChange}
                onSubmit={handleSubmit}
                termsAccepted={termsAccepted}
            />
        </>
    );
}
