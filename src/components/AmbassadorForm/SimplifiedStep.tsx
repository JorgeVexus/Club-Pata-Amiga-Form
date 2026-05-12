'use client';

import React from 'react';
import { AmbassadorTermsAcceptance, Gender } from '@/types/ambassador.types';
import TermsModalEnhanced from '@/components/RegistrationV2/TermsModalEnhanced';
import styles from './SimplifiedStep.module.css';

export interface SimplifiedAmbassadorData {
    full_name: string;
    gender: Gender | '';
    curp: string;
    email: string;
    phone: string;
    facebook: string;
    instagram: string;
    tiktok: string;
    motivation: string;
}

export type TermsAcceptance = AmbassadorTermsAcceptance;

interface Props {
    data: SimplifiedAmbassadorData;
    errors: Record<string, string>;
    isSubmitting: boolean;
    termsAccepted: TermsAcceptance | null;
    onBlur: (field: keyof SimplifiedAmbassadorData) => void;
    onChange: (field: keyof SimplifiedAmbassadorData, value: string) => void;
    onTermsChange: (acceptance: TermsAcceptance | null) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const genderOptions: Array<{ label: string; value: Gender }> = [
    { label: 'Hombre', value: 'male' },
    { label: 'Mujer', value: 'female' },
    { label: 'No especificar', value: 'not_specified' }
];

export default function SimplifiedStep({
    data,
    errors,
    isSubmitting,
    termsAccepted,
    onBlur,
    onChange,
    onTermsChange,
    onSubmit
}: Props) {
    const [showTermsModal, setShowTermsModal] = React.useState(false);

    const acceptAllTerms = () => {
        const acceptance: TermsAcceptance = {
            termsAndConditions: true,
            privacyPolicy: true,
            marketingConsent: true,
            clickwrap: true
        };
        onTermsChange(acceptance);
        localStorage.setItem('ambassador_terms_acceptance', JSON.stringify({
            ...acceptance,
            timestamp: new Date().toISOString()
        }));
    };

    const handleTermsClose = (accepted: boolean, acceptance: TermsAcceptance) => {
        setShowTermsModal(false);
        if (accepted) {
            onTermsChange(acceptance);
            localStorage.setItem('ambassador_terms_acceptance', JSON.stringify({
                ...acceptance,
                timestamp: new Date().toISOString()
            }));
        }
    };

    return (
        <>
        <form className={styles.formShell} onSubmit={onSubmit} noValidate>
            <div className={styles.formIntro}>
                <h2>Tu solicitud de embajador</h2>
                <p>Completa tus datos esenciales para que podamos revisar tu perfil.</p>
            </div>

            <div className={styles.fields}>
                <label className={styles.fieldGroup}>
                    <span>Nombre completo</span>
                    <input
                        className={styles.input}
                        type="text"
                        value={data.full_name}
                        onChange={(event) => onChange('full_name', event.target.value)}
                        placeholder="Nombre y apellidos"
                        autoComplete="name"
                    />
                    {errors.full_name && <small className={styles.error}>{errors.full_name}</small>}
                </label>

                <fieldset className={styles.radioField}>
                    <legend>Sexo</legend>
                    <div className={styles.radioGrid}>
                        {genderOptions.map(option => (
                            <label key={option.value} className={styles.radioOption}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value={option.value}
                                    checked={data.gender === option.value}
                                    onChange={(event) => onChange('gender', event.target.value)}
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                    {errors.gender && <small className={styles.error}>{errors.gender}</small>}
                </fieldset>

                <label className={styles.fieldGroup}>
                    <span>CURP</span>
                    <input
                        className={styles.input}
                        type="text"
                        value={data.curp}
                        onBlur={() => onBlur('curp')}
                        onChange={(event) => onChange('curp', event.target.value)}
                        placeholder="18 caracteres"
                        maxLength={18}
                        autoCapitalize="characters"
                    />
                    {errors.curp && <small className={styles.error}>{errors.curp}</small>}
                </label>

                <label className={styles.fieldGroup}>
                    <span>Correo</span>
                    <input
                        className={styles.input}
                        type="email"
                        value={data.email}
                        onBlur={() => onBlur('email')}
                        onChange={(event) => onChange('email', event.target.value)}
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                    />
                    {errors.email && <small className={styles.error}>{errors.email}</small>}
                </label>

                <label className={styles.fieldGroup}>
                    <span>Celular</span>
                    <div className={styles.phoneInput}>
                        <span>+52</span>
                        <input
                            className={styles.input}
                            type="tel"
                            value={data.phone}
                            onChange={(event) => onChange('phone', event.target.value)}
                            placeholder="10 digitos"
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={10}
                        />
                    </div>
                    {errors.phone && <small className={styles.error}>{errors.phone}</small>}
                </label>

                <div className={styles.socialSection}>
                    <div className={styles.sectionLabel}>
                        <span>Redes sociales</span>
                        <small>Opcional</small>
                    </div>

                    <label className={styles.fieldGroup}>
                        <span>Facebook</span>
                        <input
                            className={styles.input}
                            type="url"
                            value={data.facebook}
                            onChange={(event) => onChange('facebook', event.target.value)}
                            placeholder="https://facebook.com/tu-perfil"
                        />
                    </label>

                    <label className={styles.fieldGroup}>
                        <span>Instagram</span>
                        <input
                            className={styles.input}
                            type="url"
                            value={data.instagram}
                            onChange={(event) => onChange('instagram', event.target.value)}
                            placeholder="https://instagram.com/tu-perfil"
                        />
                    </label>

                    <label className={styles.fieldGroup}>
                        <span>TikTok</span>
                        <input
                            className={styles.input}
                            type="url"
                            value={data.tiktok}
                            onChange={(event) => onChange('tiktok', event.target.value)}
                            placeholder="https://tiktok.com/@tu-perfil"
                        />
                    </label>
                </div>

                <label className={styles.fieldGroup}>
                    <span>Motivacion</span>
                    <textarea
                        className={styles.textarea}
                        value={data.motivation}
                        onChange={(event) => onChange('motivation', event.target.value)}
                        placeholder="Cuentanos por que quieres representar a Pata Amiga"
                        rows={5}
                    />
                    {errors.motivation && <small className={styles.error}>{errors.motivation}</small>}
                </label>

                <div className={styles.termsSection}>
                    <label className={styles.termsCheckboxLabel}>
                        <input
                            type="checkbox"
                            checked={!!termsAccepted}
                            onChange={() => {
                                if (!termsAccepted) {
                                    acceptAllTerms();
                                } else {
                                    onTermsChange(null);
                                    localStorage.removeItem('ambassador_terms_acceptance');
                                }
                            }}
                        />
                        <span className={styles.termsText}>
                            <strong>He leido y acepto todos los terminos</strong>
                            <button
                                type="button"
                                className={styles.viewTermsLink}
                                onClick={(event) => {
                                    event.preventDefault();
                                    setShowTermsModal(true);
                                }}
                            >
                                Ver terminos y condiciones
                            </button>
                        </span>
                    </label>
                    {errors.accept_terms && <small className={styles.error}>{errors.accept_terms}</small>}
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                    <span aria-hidden>{'>'}</span>
                </button>
            </div>
        </form>
        <TermsModalEnhanced
            isOpen={showTermsModal}
            onClose={handleTermsClose}
            initialAcceptance={termsAccepted || undefined}
        />
        </>
    );
}
