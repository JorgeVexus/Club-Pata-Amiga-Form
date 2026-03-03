/**
 * Paso 1: Crear cuenta
 * Solo email y contraseña
 * Maneja el caso de usuario ya logueado con opción de cerrar sesión
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
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

    const validateForm = (): boolean => {
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
                        <span className={styles.userIcon}>👤</span>
                        <div>
                            <p className={styles.userLabel}>Sesión activa</p>
                            <p className={styles.userEmail}>{currentMember.auth.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.logoutButton}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? 'Cerrando...' : 'No eres tú? Cerrar sesión'}
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <TextInput
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(value) => setFormData({ ...formData, email: value })}
                    placeholder="tu@email.com"
                    error={errors.email}
                    required
                />

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

                <TextInput
                    label="Contraseña"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(value) => setFormData({ ...formData, password: value })}
                    placeholder="Mínimo 8 caracteres"
                    error={errors.password}
                    required
                />

                <TextInput
                    label="Confirma tu contraseña"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                    placeholder="Repite tu contraseña"
                    error={errors.confirmPassword}
                    required
                />

                <div className={styles.securityMessage}>
                    <p>
                        🔒 <strong>Tus datos están protegidos.</strong> Al continuar, aceptas nuestros
                        <a href="/terminos" target="_blank"> Términos y Condiciones</a> y
                        <a href="/privacidad" target="_blank"> Aviso de Privacidad</a>.
                    </p>
                </div>

                <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creando cuenta...' : 'Continuar →'}
                </button>

                <p className={styles.loginLink}>
                    ¿Ya tienes cuenta? <a href="/user/inicio-de-sesion">Inicia sesión</a>
                </p>
            </form>
        </div>
    );
}
