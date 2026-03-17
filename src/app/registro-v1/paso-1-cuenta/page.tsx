'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TextInput from '@/components/FormFields/TextInput';
import StepIndicator from '@/components/RegistrationV2/StepIndicator';
import BenefitsBanner from '@/components/RegistrationV2/BenefitsBanner';
import Toast from '@/components/UI/Toast';
import styles from './page.module.css';

export default function Paso1Cuenta() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validar email
        if (!formData.email.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Ingresa un correo válido';
        }

        // Validar contraseña
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        // Validar confirmación
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Por favor revisa los campos marcados', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Guardar en localStorage para persistencia temporal
            localStorage.setItem('registration_step1', JSON.stringify({
                email: formData.email,
                timestamp: new Date().toISOString()
            }));

            // Crear usuario en Memberstack (modo silencioso)
            // En producción esto llamaría a la API
            console.log('✅ Paso 1 completado:', formData.email);

            // Redirigir al paso 2
            router.push('/registro/paso-2-mascota');
        } catch (error: any) {
            console.error('Error:', error);
            showToast(error.message || 'Error al crear cuenta', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <BenefitsBanner />

            <div className={styles.container}>
                <StepIndicator
                    currentStep={1}
                    totalSteps={3}
                    stepLabels={['Cuenta', 'Mascota', 'Plan']}
                />

                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Crea tu cuenta</h1>
                        <p className={styles.subtitle}>
                            Solo te tomará 2 minutos proteger a tu mascota
                        </p>
                    </div>

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

                        <TextInput
                            label="Contraseña"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={(value) => setFormData({ ...formData, password: value })}
                            placeholder="Mínimo 8 caracteres"
                            error={errors.password}
                            helpText="Usa letras, números y símbolos para mayor seguridad"
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

                        <div className={styles.terms}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" required />
                                <span>
                                    Acepto los <a href="#" target="_blank">Términos y Condiciones</a> y el
                                    <a href="#" target="_blank">Aviso de Privacidad</a>
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creando cuenta...' : 'Continuar'}
                            {!isSubmitting && <span>→</span>}
                        </button>

                        <p className={styles.loginLink}>
                            ¿Ya tienes cuenta? <a href="/user/inicio-de-sesion">Inicia sesión</a>
                        </p>
                    </form>
                </div>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
