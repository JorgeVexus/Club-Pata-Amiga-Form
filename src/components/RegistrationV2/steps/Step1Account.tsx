/**
 * Paso 1: Crear cuenta o Iniciar Sesión
 * - Modo registro: email + contraseña + confirmar
 * - Modo login: email + contraseña (para usuarios que regresan)
 * - autoLoginMode: se activa cuando viene reason=complete_payment (iOS Safari)
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import { checkEmailAvailability } from '@/app/actions/user.actions';
import { trackLead, trackCompleteRegistration } from '@/components/Analytics/MetaPixel';
import TermsModalEnhanced from '../TermsModalEnhanced';
import styles from './steps.module.css';

interface Step1AccountProps {
    data: any;
    member: any;
    onNext: (data: { email: string; password: string }) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
    /** Email pre-llenado (viene del widget via URL ?email=) */
    defaultEmail?: string;
    /** Si es true, inicia en modo login en lugar de registro */
    autoLoginMode?: boolean;
}

export default function Step1Account({
    data, member, onNext, showToast, defaultEmail, autoLoginMode
}: Step1AccountProps) {
    // Modo: 'register' | 'login'
    const [mode, setMode] = useState<'register' | 'login'>(autoLoginMode ? 'login' : 'register');

    const [formData, setFormData] = useState({
        email: defaultEmail || '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [currentMember, setCurrentMember] = useState<any>(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Modal de términos
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleTermsClose = (accepted: boolean, acceptance: any) => {
        setShowTermsModal(false);
        if (accepted && acceptance) {
            localStorage.setItem('registration_terms_acceptance', JSON.stringify({
                ...acceptance,
                timestamp: new Date().toISOString()
            }));
        }
    };

    const handleViewTerms = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowTermsModal(true);
    };

    // Cargar datos al montar
    useEffect(() => {
        if (member) {
            setCurrentMember(member);
            if (member.auth?.email) {
                setFormData(prev => ({ ...prev, email: member.auth.email }));
            }
        }
        // Si viene defaultEmail, pre-llenar
        if (defaultEmail && !member?.auth?.email) {
            setFormData(prev => ({ ...prev, email: defaultEmail }));
        }
    }, [member, defaultEmail]);

    // Sync mode si el prop cambia
    useEffect(() => {
        if (autoLoginMode) setMode('login');
    }, [autoLoginMode]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (window.$memberstackDom) {
                await window.$memberstackDom.logout();
                showToast('Sesión cerrada correctamente', 'success');
                setCurrentMember(null);
                setFormData({ email: '', password: '', confirmPassword: '' });
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Error cerrando sesión:', error);
            showToast('Error al cerrar sesión', 'error');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const verifyEmail = async (email: string) => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailAvailable(null);
            return;
        }
        setIsCheckingEmail(true);
        try {
            const result = await checkEmailAvailability(email);
            setEmailAvailable(result.available);
            if (!result.available) {
                setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
            } else {
                setErrors(prev => { const e = { ...prev }; delete e.email; return e; });
            }
        } catch (error) {
            console.error('Error verificando email:', error);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleEmailBlur = () => {
        if (formData.email && mode === 'register') {
            verifyEmail(formData.email);
        }
    };

    const validateForm = (): boolean => {
        if (isLoggedIn) return true;

        const newErrors: Record<string, string> = {};
        if (!formData.email.trim()) {
            newErrors.email = 'El correo es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Ingresa un correo válido';
        }
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Mínimo 8 caracteres';
        }
        if (mode === 'register' && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast('Revisa los campos marcados', 'error');
            return;
        }
        setIsSubmitting(true);
        setErrors({});
        try {
            if (currentMember?.auth?.email && currentMember.auth.email !== formData.email) {
                const confirmChange = window.confirm(
                    `Ya hay una sesión activa con ${currentMember.auth.email}. ` +
                    `¿Deseas cerrar esa sesión y continuar con ${formData.email}?`
                );
                if (confirmChange) {
                    await handleLogout();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await onNext({ email: formData.email, password: formData.password });
                } else {
                    setIsSubmitting(false);
                    return;
                }
            } else {
                await onNext({ email: formData.email, password: formData.password });
            }
        } catch (error: any) {
            console.error('Error:', error);
            if (error?.code === 'email-already-in-use' ||
                error?.message?.includes('already taken') ||
                error?.message?.includes('email-already-in-use') ||
                error?.message?.includes('already exists')) {
                // En modo registro, sugerir cambiar a login
                setErrors({ email: 'Este correo ya está registrado. Inicia sesión abajo.' });
                showToast('Este correo ya está registrado', 'error');
                setMode('login');
            } else if (error?.message?.includes('Invalid credentials') ||
                error?.message?.includes('invalid_credentials') ||
                error?.message?.includes('Invalid email or password') ||
                error?.code === 'invalid_credentials') {
                setErrors({ password: 'Contraseña incorrecta. Intenta de nuevo.' });
                showToast('Contraseña incorrecta', 'error');
            } else {
                showToast(error.message || 'Error al iniciar sesión', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const [isSocialLoading, setIsSocialLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsSocialLoading(true);
        try {
            if (!window.$memberstackDom) {
                showToast('Error: Memberstack no cargado', 'error');
                setIsSocialLoading(false);
                return;
            }
            await window.$memberstackDom.signupWithProvider({
                provider: 'google',
                options: { prompt: 'select_account' }
            });
            trackLead({ content_name: 'User Registration - Google', content_category: 'signup' });
            trackCompleteRegistration({ content_name: 'User Registration - Google', content_category: 'signup' });
            window.location.reload();
        } catch (error: any) {
            console.error('❌ Error en login con Google:', error);
            showToast('Error al iniciar sesión con Google', 'error');
            setIsSocialLoading(false);
        }
    };

    const isLoggedIn = !!currentMember?.auth?.email;
    const isLoginMode = mode === 'login';

    // Título dinámico
    const title = isLoggedIn
        ? 'Continuar con tu cuenta'
        : isLoginMode
            ? '¡Hola de nuevo! 👋'
            : 'Crea tu cuenta';

    const subtitle = isLoggedIn
        ? ''
        : isLoginMode
            ? 'Inicia sesión para continuar donde lo dejaste'
            : 'Solo te tomará 2 minutos proteger a tu mascota';

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            {/* Banner de sesión activa */}
            {isLoggedIn && (
                <div className={styles.loggedInBanner}>
                    <div className={styles.userInfo}>
                        <div className={styles.userIcon}>👤</div>
                        <div>
                            <p className={styles.userLabel}>Sesión activa</p>
                            <p className={styles.userEmail}>{currentMember.auth.email}</p>
                        </div>
                    </div>
                    <div className={styles.bannerActions}>
                        <button
                            type="submit"
                            form="step1-form"
                            className={styles.primaryButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Cargando...' : 'Continuar registro →'}
                        </button>
                        <button
                            type="button"
                            className={styles.logoutButtonSecondary}
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                        </button>
                    </div>
                </div>
            )}

            {/* Botones sociales (solo en modo registro y sin sesión activa) */}
            {!isLoggedIn && !isLoginMode && (
                <div className={styles.socialLoginContainer}>
                    <div className={styles.socialButtonsRow}>
                        <button
                            type="button"
                            className={styles.googleButton}
                            onClick={handleGoogleLogin}
                            disabled={isSubmitting || isSocialLoading}
                        >
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google"
                                className={styles.socialIcon}
                            />
                            {isSocialLoading ? 'Conectando...' : 'Google'}
                        </button>
                    </div>
                    <div className={styles.divider}>
                        <span>o regístrate con tu correo</span>
                    </div>
                </div>
            )}

            <form id="step1-form" onSubmit={handleSubmit} className={styles.form}>
                {!isLoggedIn && (
                    <>
                        {/* Email */}
                        <div className={styles.curpRow}>
                            <TextInput
                                label="Correo electrónico"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={(value) => {
                                    setFormData({ ...formData, email: value });
                                    if (emailAvailable !== null) setEmailAvailable(null);
                                    if (errors.email) setErrors(prev => { const e = { ...prev }; delete e.email; return e; });
                                }}
                                onBlur={handleEmailBlur}
                                placeholder="tu@email.com"
                                error={errors.email}
                                required
                                disabled={isSubmitting || isCheckingEmail || isSocialLoading}
                            />
                            {isCheckingEmail && (
                                <span className={styles.inputIndicator}>Verificando...</span>
                            )}
                            {emailAvailable && formData.email.includes('@') && !isCheckingEmail && !errors.email && mode === 'register' && (
                                <span className={styles.inputIndicatorSuccess}>✓ Disponible</span>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className={styles.passwordContainer}>
                            <TextInput
                                label="Contraseña"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(value) => {
                                    setFormData({ ...formData, password: value });
                                    if (errors.password) setErrors(prev => { const e = { ...prev }; delete e.password; return e; });
                                }}
                                placeholder={isLoginMode ? 'Tu contraseña' : 'Mínimo 8 caracteres'}
                                error={errors.password}
                                required
                                disabled={isSubmitting || isSocialLoading}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Confirmar contraseña (solo en registro) */}
                        {!isLoginMode && (
                            <div className={styles.passwordContainer}>
                                <TextInput
                                    label="Confirma tu contraseña"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                                    placeholder="Repite tu contraseña"
                                    error={errors.confirmPassword}
                                    required
                                    disabled={isSubmitting || isSocialLoading}
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showConfirmPassword ? (
                                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className={styles.securityMessage}>
                    <p>
                        🔒 <strong>Tus datos están protegidos.</strong> Al continuar, aceptas nuestros{' '}
                        <button type="button" onClick={handleViewTerms} className={styles.viewTermsLink}>
                            Términos y Condiciones
                        </button>{' '}y{' '}
                        <button type="button" onClick={handleViewTerms} className={styles.viewTermsLink}>
                            Aviso de Privacidad
                        </button>.
                    </p>
                </div>

                {!isLoggedIn && (
                    <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={isSubmitting || isSocialLoading}
                    >
                        {isSubmitting
                            ? (isLoginMode ? 'Iniciando sesión...' : 'Creando cuenta...')
                            : (isLoginMode ? 'Iniciar sesión →' : 'Continuar →')}
                    </button>
                )}

                {/* Toggle entre login y registro */}
                {!isLoggedIn && (
                    <p className={styles.loginLink}>
                        {isLoginMode ? (
                            <>
                                ¿No tienes cuenta?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setMode('register'); setErrors({}); }}
                                    style={{ background: 'none', border: 'none', color: '#00BBB4', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                                >
                                    Regístrate aquí
                                </button>
                            </>
                        ) : (
                            <>
                                ¿Ya tienes cuenta?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setErrors({}); setFormData(prev => ({ ...prev, confirmPassword: '' })); }}
                                    style={{ background: 'none', border: 'none', color: '#00BBB4', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                                >
                                    Inicia sesión
                                </button>
                            </>
                        )}
                    </p>
                )}
            </form>

            {/* Modal de términos */}
            <TermsModalEnhanced
                isOpen={showTermsModal}
                onClose={handleTermsClose}
                documentsOnly={true}
            />
        </div>
    );
}
