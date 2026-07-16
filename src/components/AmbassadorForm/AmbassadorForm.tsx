'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Gender } from '@/types/ambassador.types';
import { checkAmbassadorAvailability } from '@/app/actions/ambassador.actions';
import { trackLead, trackCompleteRegistration, trackSubmitApplication } from '@/components/Analytics/MetaPixel';
import { validateCURP, validateCurpMatchesData } from '@/utils/curp-validator';
import { calculateAge } from '@/utils/age-validator';
import SimplifiedStep, { SimplifiedAmbassadorData, TermsAcceptance } from './SimplifiedStep';
import Step4Success from './Step4Success';
import Step5CompleteProfile from './Step5CompleteProfile';
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
    first_name: '',
    paternal_surname: '',
    maternal_surname: '',
    birth_date: '',
    birth_city: '',
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
        first_name: preloadedData?.firstName || '',
        paternal_surname: preloadedData?.paternalLastName || '',
        maternal_surname: preloadedData?.maternalLastName || '',
        birth_date: preloadedData?.customFields?.['birth-date'] || '',
        birth_city: preloadedData?.customFields?.['birth-city'] || '',
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
    const [isCheckingCurp, setIsCheckingCurp] = useState(false);
    const [curpAvailable, setCurpAvailable] = useState<boolean | null>(null);
    const [curpCount, setCurpCount] = useState(0);
    const [showCompleteProfile, setShowCompleteProfile] = useState(false);
    const [createdAmbassadorId, setCreatedAmbassadorId] = useState<string | null>(null);

    const hasPreloadedMember = useMemo(() => Boolean(preloadedData || linkedMemberstackId), [linkedMemberstackId, preloadedData]);

    useEffect(() => {
        onStepChange?.(showCompleteProfile ? 3 : showSuccess ? 2 : 1);
    }, [onStepChange, showCompleteProfile, showSuccess]);

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

        if (catImage) catImage.style.display = showSuccess ? 'none' : '';
        if (girlImage) girlImage.style.display = 'none';
        if (manImage) manImage.style.display = 'none';
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
                            first_name: cf['first-name'] || prev.first_name,
                            paternal_surname: cf['paternal-last-name'] || prev.paternal_surname,
                            maternal_surname: cf['maternal-last-name'] || prev.maternal_surname,
                            birth_date: cf['birth-date'] || prev.birth_date,
                            birth_city: cf['birth-city'] || prev.birth_city,
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

        if (field === 'curp') {
            setCurpAvailable(null);
            setCurpCount(0);
        }

        if (errors[field] || errors.submit) {
            setErrors(prev => {
                const nextErrors = { ...prev };
                delete nextErrors[field];
                delete nextErrors.submit;
                return nextErrors;
            });
        }
    };

    const verifyCurp = async (curp: string) => {
        const formatValidation = validateCURP(curp);
        if (!formatValidation.isValid) {
            setErrors(prev => ({ ...prev, curp: formatValidation.error || 'CURP inválida' }));
            setCurpAvailable(null);
            return;
        }

        const consistencyValidation = validateCurpMatchesData(curp, {
            firstName: formData.first_name,
            paternalLastName: formData.paternal_surname,
            maternalLastName: formData.maternal_surname,
            birthDate: formData.birth_date
        });

        if (!consistencyValidation.isConsistent) {
            setErrors(prev => ({ ...prev, curp: consistencyValidation.message || 'La CURP no coincide con tus datos' }));
            setCurpAvailable(null);
            return;
        }

        setIsCheckingCurp(true);
        try {
            const result = await checkAmbassadorAvailability('curp', curp);
            setCurpAvailable(result.available);
            setCurpCount(result.count || 0);

            setErrors(prev => {
                const nextErrors = { ...prev };
                delete nextErrors.curp;
                return nextErrors;
            });
        } catch (error) {
            console.error('Error verificando CURP:', error);
        } finally {
            setIsCheckingCurp(false);
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

        if (!formData.first_name.trim()) {
            nextErrors.first_name = 'Tu nombre es requerido';
        }

        if (!formData.paternal_surname.trim()) {
            nextErrors.paternal_surname = 'Tu apellido paterno es requerido';
        }

        if (!formData.birth_date) {
            nextErrors.birth_date = 'La fecha de nacimiento es requerida';
        } else {
            const age = calculateAge(formData.birth_date);
            if (age < 18) {
                nextErrors.birth_date = `Debes ser mayor de edad para registrarte. Actualmente tienes ${age} años.`;
            }
        }

        if (!formData.birth_city?.trim()) {
            nextErrors.birth_city = 'La ciudad de nacimiento es requerida';
        }

        if (!formData.gender) {
            nextErrors.gender = 'Selecciona una opcion';
        }

        if (!formData.curp.trim()) {
            nextErrors.curp = 'El CURP es requerido';
        } else {
            const curpValidation = validateCURP(formData.curp);
            if (!curpValidation.isValid) {
                nextErrors.curp = curpValidation.error || 'CURP invalida';
            }
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
        if (field === 'curp') {
            if (formData.curp.length === 18) {
                verifyCurp(formData.curp);
            }
            return;
        }

        if (field !== 'email') return;

        const value = formData.email.trim();
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;

        try {
            const check = await checkAmbassadorAvailability('email', value);
            if (!check.available) {
                setErrors(prev => ({ ...prev, email: 'Este correo ya esta registrado' }));
            }
        } catch (error) {
            console.error('Error verificando email:', error);
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

            // El CURP ya no bloquea el envio si esta duplicado, solo el email
            const emailCheck = await checkAmbassadorAvailability('email', formData.email);

            if (!emailCheck.available) {
                setErrors({ email: 'Este correo ya esta registrado' });
                setIsSubmitting(false);
                scrollToField('email');
                return;
            }

            const response = await fetch('/api/ambassadors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: formData.first_name.trim(),
                    paternal_surname: formData.paternal_surname.trim(),
                    maternal_surname: formData.maternal_surname.trim() || undefined,
                    gender: formData.gender || undefined,
                    birth_date: formData.birth_date,
                    birth_city: formData.birth_city.trim() || undefined,
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
                setCreatedAmbassadorId(data.data?.id || null);
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

    if (showSuccess && showCompleteProfile && createdAmbassadorId) {
        return (
            <Step5CompleteProfile
                ambassadorId={createdAmbassadorId}
                initialData={{
                    facebook: formData.facebook,
                    instagram: formData.instagram,
                    tiktok: formData.tiktok,
                    motivation: formData.motivation
                }}
            />
        );
    }

    if (showSuccess) {
        return (
            <Step4Success
                onCompleteProfile={createdAmbassadorId ? () => setShowCompleteProfile(true) : undefined}
            />
        );
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
                <h1 className={styles.mainTitle}>Sé embajador Pata Amiga</h1>
            )}

            {errors.submit && (
                <div className={styles.submitError}>
                    {errors.submit}
                </div>
            )}

            {hasPreloadedMember && (
                <div className={styles.memberNotice}>
                    <strong>Hola, {formData.first_name || formData.email}</strong>
                    <span>Usaremos los datos de tu cuenta para vincular tu solicitud.</span>
                </div>
            )}

            <SimplifiedStep
                data={formData}
                errors={errors}
                isSubmitting={isSubmitting}
                isCheckingCurp={isCheckingCurp}
                curpAvailable={curpAvailable}
                curpCount={curpCount}
                onBlur={handleBlur}
                onChange={handleChange}
                onTermsChange={handleTermsChange}
                onSubmit={handleSubmit}
                termsAccepted={termsAccepted}
            />
        </>
    );
}
