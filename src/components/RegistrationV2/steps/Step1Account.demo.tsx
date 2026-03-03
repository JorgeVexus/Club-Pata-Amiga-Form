/**
 * Paso 1: Crear cuenta - MODO DEMO
 * Funciona completamente en local sin Memberstack
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
    onLogout?: () => void;
}

export default function Step1AccountDemo({ data, member, onNext, showToast, onLogout }: Step1AccountProps) {
    const [formData, setFormData] = useState({
        email: data?.account?.email || member?.auth?.email || '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        try {
            await onNext({
                email: formData.email,
                password: formData.password
            });
        } catch (error: any) {
            console.error('Error:', error);
            if (error?.code === 'email-already-in-use') {
                setErrors({ email: 'Este correo ya está registrado. Intenta iniciar sesión.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoggedIn = !!member?.auth?.email;

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

            {/* Banner de sesión activa en modo demo */}
            {isLoggedIn && (
                <div className={styles.loggedInBanner}>
                    <div className={styles.userInfo}>
                        <span className={styles.userIcon}>👤</span>
                        <div>
                            <p className={styles.userLabel}>Sesión activa (Demo)</p>
                            <p className={styles.userEmail}>{member.auth.email}</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        className={styles.logoutButton}
                        onClick={onLogout}
                    >
                        No eres tú? Cerrar sesión
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

                {/* Nota de modo demo */}
                <p style={{ 
                    textAlign: 'center', 
                    fontSize: '0.8rem', 
                    color: '#718096',
                    marginTop: '1rem',
                    fontStyle: 'italic'
                }}>
                    💡 Modo Demo: Los datos se guardan solo en tu navegador
                </p>
            </form>
        </div>
    );
}
