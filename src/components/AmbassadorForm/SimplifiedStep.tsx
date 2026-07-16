'use client';

import React from 'react';
import { AmbassadorTermsAcceptance, Gender } from '@/types/ambassador.types';
import TermsModalEnhanced from '@/components/RegistrationV2/TermsModalEnhanced';
import styles from './SimplifiedStep.module.css';

export interface SimplifiedAmbassadorData {
    first_name: string;
    paternal_surname: string;
    maternal_surname: string;
    birth_date: string;
    birth_city: string;
    gender: Gender | '';
    curp: string;
    email: string;
    password: string;
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
    isCheckingCurp: boolean;
    curpAvailable: boolean | null;
    curpCount: number;
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
    isCheckingCurp,
    curpAvailable,
    curpCount,
    onBlur,
    onChange,
    onTermsChange,
    onSubmit
}: Props) {
    const [showTermsModal, setShowTermsModal] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const fieldClassName = (field: string) => (
        errors[field] ? `${styles.fieldGroup} ${styles.fieldGroupError}` : styles.fieldGroup
    );
    const radioFieldClassName = errors.gender ? `${styles.radioField} ${styles.radioFieldError}` : styles.radioField;
    const termsSectionClassName = errors.accept_terms ? `${styles.termsSection} ${styles.termsSectionError}` : styles.termsSection;

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
                <label className={fieldClassName('first_name')} data-field="first_name">
                    <span>Nombre(s)</span>
                    <input
                        className={styles.input}
                        type="text"
                        value={data.first_name}
                        onChange={(event) => onChange('first_name', event.target.value)}
                        placeholder="Nombre(s)"
                        autoComplete="given-name"
                        aria-invalid={!!errors.first_name}
                        aria-describedby={errors.first_name ? 'ambassador-first-name-error' : undefined}
                    />
                    {errors.first_name && <small id="ambassador-first-name-error" className={styles.error}>{errors.first_name}</small>}
                </label>

                <label className={fieldClassName('paternal_surname')} data-field="paternal_surname">
                    <span>Apellido paterno</span>
                    <input
                        className={styles.input}
                        type="text"
                        value={data.paternal_surname}
                        onChange={(event) => onChange('paternal_surname', event.target.value)}
                        placeholder="Apellido paterno"
                        autoComplete="family-name"
                        aria-invalid={!!errors.paternal_surname}
                        aria-describedby={errors.paternal_surname ? 'ambassador-paternal-surname-error' : undefined}
                    />
                    {errors.paternal_surname && <small id="ambassador-paternal-surname-error" className={styles.error}>{errors.paternal_surname}</small>}
                </label>

                <label className={fieldClassName('maternal_surname')} data-field="maternal_surname">
                    <span>Apellido materno <small>(opcional)</small></span>
                    <input
                        className={styles.input}
                        type="text"
                        value={data.maternal_surname}
                        onChange={(event) => onChange('maternal_surname', event.target.value)}
                        placeholder="Apellido materno"
                        autoComplete="additional-name"
                        aria-invalid={!!errors.maternal_surname}
                    />
                </label>

                <label className={fieldClassName('birth_date')} data-field="birth_date">
                    <span>Fecha de nacimiento</span>
                    <input
                        className={styles.input}
                        type="date"
                        value={data.birth_date}
                        onChange={(event) => onChange('birth_date', event.target.value)}
                        aria-invalid={!!errors.birth_date}
                        aria-describedby={errors.birth_date ? 'ambassador-birth-date-error' : undefined}
                    />
                    {errors.birth_date && <small id="ambassador-birth-date-error" className={styles.error}>{errors.birth_date}</small>}
                    <small className={styles.ageHint}>Recuerda que para ser embajador de Pata Amiga deberás ser mayor de 18 años</small>
                </label>

                <label className={fieldClassName('birth_city')} data-field="birth_city">
                    <span>Ciudad de nacimiento</span>
                    <input
                        className={styles.input}
                        type="text"
                        value={data.birth_city}
                        onChange={(event) => onChange('birth_city', event.target.value)}
                        placeholder="Ej. Ciudad de México"
                        aria-invalid={!!errors.birth_city}
                        aria-describedby={errors.birth_city ? 'ambassador-birth-city-error' : undefined}
                    />
                    {errors.birth_city && <small id="ambassador-birth-city-error" className={styles.error}>{errors.birth_city}</small>}
                </label>

                <fieldset className={radioFieldClassName} data-field="gender" aria-invalid={!!errors.gender}>
                    <legend>Sexo</legend>
                    <div className={styles.radioGrid}>
                        {genderOptions.map(option => (
                            <label
                                key={option.value}
                                className={data.gender === option.value ? `${styles.radioOption} ${styles.radioOptionSelected}` : styles.radioOption}
                            >
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

                <label className={fieldClassName('curp')} data-field="curp">
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
                        aria-invalid={!!errors.curp}
                        aria-describedby={errors.curp ? 'ambassador-curp-error' : undefined}
                    />
                    {errors.curp && <small id="ambassador-curp-error" className={styles.error}>{errors.curp}</small>}
                    {isCheckingCurp && <small className={styles.curpChecking}>Verificando...</small>}
                    {!isCheckingCurp && curpAvailable === true && data.curp.length === 18 && (
                        <small className={styles.curpAvailable}>✓ Disponible</small>
                    )}
                    {!isCheckingCurp && curpAvailable === false && curpCount > 0 && data.curp.length === 18 && (
                        <small className={styles.curpWarning}>
                            ⚠️ CURP ya registrada en {curpCount} {curpCount === 1 ? 'cuenta' : 'cuentas'}. Si es tuya, puedes continuar sin problemas.
                        </small>
                    )}
                </label>

                <label className={fieldClassName('email')} data-field="email">
                    <span>Correo</span>
                    <input
                        className={styles.input}
                        type="email"
                        value={data.email}
                        onBlur={() => onBlur('email')}
                        onChange={(event) => onChange('email', event.target.value)}
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'ambassador-email-error' : undefined}
                    />
                    {errors.email && <small id="ambassador-email-error" className={styles.error}>{errors.email}</small>}
                </label>

                <label className={fieldClassName('password')} data-field="password">
                    <span>Contraseña</span>
                    <div className={styles.passwordInput}>
                        <input
                            className={styles.input}
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(event) => onChange('password', event.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'ambassador-password-error' : undefined}
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setShowPassword(prev => !prev)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            aria-pressed={showPassword}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                                {showPassword ? (
                                    <>
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                        <path d="M9.9 4.3A10.7 10.7 0 0112 4c5.5 0 9 5.2 9 8a8.2 8.2 0 01-1.6 3.9" />
                                        <path d="M6.6 6.6C4.3 8.1 3 10.4 3 12c0 2.8 3.5 8 9 8a10.3 10.3 0 004.2-.9" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19 2.5 12 2.5 12z" />
                                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                    {errors.password && <small id="ambassador-password-error" className={styles.error}>{errors.password}</small>}
                </label>

                <label className={fieldClassName('phone')} data-field="phone">
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
                            aria-invalid={!!errors.phone}
                            aria-describedby={errors.phone ? 'ambassador-phone-error' : undefined}
                        />
                    </div>
                    {errors.phone && <small id="ambassador-phone-error" className={styles.error}>{errors.phone}</small>}
                </label>

                <div className={styles.socialSection} data-field="social_media">
                    <div className={styles.sectionLabel}>
                        <span>Redes sociales</span>
                        <small>Al menos una es obligatoria</small>
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
                    {errors.social_media && <small id="ambassador-social-media-error" className={styles.error}>{errors.social_media}</small>}
                </div>

                <label className={fieldClassName('motivation')} data-field="motivation">
                    <span>Motivacion</span>
                    <textarea
                        className={styles.textarea}
                        value={data.motivation}
                        onChange={(event) => onChange('motivation', event.target.value)}
                        placeholder="Cuentanos por que quieres representar a Pata Amiga"
                        rows={5}
                        aria-invalid={!!errors.motivation}
                        aria-describedby={errors.motivation ? 'ambassador-motivation-error' : undefined}
                    />
                    {errors.motivation && <small id="ambassador-motivation-error" className={styles.error}>{errors.motivation}</small>}
                </label>

                <div className={termsSectionClassName} data-field="accept_terms">
                    <label className={styles.termsCheckboxLabel}>
                        <input
                            type="checkbox"
                            checked={!!termsAccepted}
                            aria-invalid={!!errors.accept_terms}
                            aria-describedby={errors.accept_terms ? 'ambassador-terms-error' : undefined}
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
                    {errors.accept_terms && <small id="ambassador-terms-error" className={styles.error}>{errors.accept_terms}</small>}
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
