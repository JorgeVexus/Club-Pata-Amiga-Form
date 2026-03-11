/**
 * Paso 1: Crear cuenta
 * Solo email y contraseña
 * Maneja el caso de usuario ya logueado con opción de cerrar sesión
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import { checkEmailAvailability } from '@/app/actions/user.actions';
import styles from './steps.module.css';

interface Step1AccountProps {
    data: any;
    member: any;
    onNext: (data: { email: string; password: string }) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step1Account({ data, member, onNext, showToast }: Step1AccountProps) {
    // Estados
    const [formData, setFormData] = useState({
        email: '',
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

    // Cargar datos al montar
    useEffect(() => {
        if (member) {
            setCurrentMember(member);
            // Si hay usuario logueado, pre-llenar email pero permitir cambio
            if (member.auth?.email) {
                setFormData(prev => ({
                    ...prev,
                    email: member.auth.email
                }));
            }
        }
    }, [member]);

    // Función para cerrar sesión
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (window.$memberstackDom) {
                await window.$memberstackDom.logout();
                showToast('Sesión cerrada correctamente', 'success');
                setCurrentMember(null);
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
                // Recargar la página para limpiar estado
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
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.email;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Error verificando email:', error);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleEmailBlur = () => {
        if (formData.email) {
            verifyEmail(formData.email);
        }
    };

    const validateForm = (): boolean => {
        // Si ya está logueado, no validamos el formulario ya que solo va a "Continuar"
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

        if (formData.password !== formData.confirmPassword) {
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
        setErrors({}); // Limpiar errores previos

        try {
            // Si hay usuario logueado con diferente email, advertir
            if (currentMember?.auth?.email && currentMember.auth.email !== formData.email) {
                const confirmChange = window.confirm(
                    `Ya hay una sesión activa con ${currentMember.auth.email}. ` +
                    `¿Deseas cerrar esa sesión y crear una nueva cuenta con ${formData.email}?`
                );

                if (confirmChange) {
                    await handleLogout();
                    // Esperar un momento para que se limpie la sesión
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // Continuar con el registro después de cerrar sesión
                    await onNext({
                        email: formData.email,
                        password: formData.password
                    });
                } else {
                    setIsSubmitting(false);
                    return;
                }
            } else {
                await onNext({
                    email: formData.email,
                    password: formData.password
                });
            }
        } catch (error: any) {
            console.error('Error:', error);
            // Si el error es que el email ya existe
            if (error?.code === 'email-already-in-use' ||
                error?.message?.includes('already taken') ||
                error?.message?.includes('email-already-in-use') ||
                error?.message?.includes('already exists')) {
                setErrors({ email: 'Este correo ya está registrado. Intenta iniciar sesión.' });
                showToast('Este correo ya está registrado', 'error');
            } else {
                showToast(error.message || 'Error al crear cuenta', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            console.log('🔐 Iniciando registro con Google...');
            if (!window.$memberstackDom) {
                showToast('Error: Memberstack no cargado', 'error');
                return;
            }

            await window.$memberstackDom.signupWithProvider({
                provider: 'google',
                options: {
                    prompt: 'select_account'
                }
            });

            // Nota: Al regresar de Google, la página se recargará y NewRegistrationFlow 
            // detectará la sesión en el useEffect de carga inicial.
        } catch (error: any) {
            console.error('❌ Error en login con Google:', error);
            showToast('Error al iniciar sesión con Google', 'error');
            setIsSubmitting(false);
        }
    };

    const isLoggedIn = !!currentMember?.auth?.email;

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {isLoggedIn ? 'Continuar con tu cuenta' : 'Crea tu cuenta'}
                </h2>
                <p className={styles.subtitle}>
                    Solo te tomará 2 minutos proteger a tu mascota
                </p>
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

            {!isLoggedIn && (
                <div className={styles.socialLoginContainer}>
                    <button
                        type="button"
                        className={styles.googleButton}
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className={styles.googleIcon}
                        />
                        Regístrate con Google
                    </button>

                    <div className={styles.divider}>
                        <span>o regístrate con tu correo</span>
                    </div>
                </div>
            )}

            <form id="step1-form" onSubmit={handleSubmit} className={styles.form}>
                {!isLoggedIn && (
                    <>
                        <div className={styles.curpRow}>
                            <TextInput
                                label="Correo electrónico"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={(value) => {
                                    setFormData({ ...formData, email: value });
                                    if (emailAvailable !== null) setEmailAvailable(null);
                                }}
                                onBlur={handleEmailBlur}
                                placeholder="tu@email.com"
                                error={errors.email}
                                required
                                disabled={isSubmitting || isCheckingEmail}
                            />
                            {isCheckingEmail && (
                                <span className={styles.inputIndicator}>Verificando...</span>
                            )}
                            {emailAvailable && formData.email.includes('@') && !isCheckingEmail && !errors.email && (
                                <span className={styles.inputIndicatorSuccess}>✓ Disponible</span>
                            )}
                        </div>

                        <div className={styles.passwordContainer}>
                            <TextInput
                                label="Contraseña"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(value) => setFormData({ ...formData, password: value })}
                                placeholder="Mínimo 8 caracteres"
                                error={errors.password}
                                required
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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

                        <div className={styles.passwordContainer}>
                            <TextInput
                                label="Confirma tu contraseña"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                                placeholder="Repite tu contraseña"
                                error={errors.confirmPassword}
                                required
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                    </>
                )}

                {/* Mostrar mensaje si el email ya existe */}
                {(errors.email?.includes('ya está registrado') ||
                    errors.email?.includes('already')) && (
                        <div className={styles.errorHelp}>
                            <p>¿Ya tienes una cuenta?</p>
                            <a href="/user/inicio-de-sesion" className={styles.loginLinkButton}>
                                Inicia sesión aquí
                            </a>
                        </div>
                    )}

                <div className={styles.securityMessage}>
                    <p>
                        🔒 <strong>Tus datos están protegidos.</strong> Al continuar, aceptas nuestros
                        <a href="/terminos" target="_blank"> Términos y Condiciones</a> y
                        <a href="/privacidad" target="_blank"> Aviso de Privacidad</a>.
                    </p>
                </div>

                {!isLoggedIn && (
                    <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creando cuenta...' : 'Continuar →'}
                    </button>
                )}

                {!isLoggedIn && (
                    <p className={styles.loginLink}>
                        ¿Ya tienes cuenta? <a href="/user/inicio-de-sesion">Inicia sesión</a>
                    </p>
                )}
            </form>
        </div>
    );
}
