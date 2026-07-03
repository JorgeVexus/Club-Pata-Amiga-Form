'use client';

import React, { useState } from 'react';
import styles from './WellnessForm.module.css';
import { WellnessCenterRegistrationData } from '@/types/wellness.types';
import TermsModalEnhanced from '@/components/RegistrationV2/TermsModalEnhanced';
import { checkWellnessEmailAvailability } from '@/app/actions/wellness.actions';

interface Props {
    onSuccess?: () => void;
}

const servicesOptions = [
    'Tienda',
    'Clínica veterinaria',
    'Hospital Veterinario',
    'Hotel',
    'Paseador de perros',
    'Funeraria'
];

export default function WellnessForm({ onSuccess }: Props) {
    const [formData, setFormData] = useState<WellnessCenterRegistrationData>({
        establishment_name: '',
        services: [],
        email: '',
        password: '',
        confirm_password: '',
        accept_terms: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    
    // Mejoras solicitadas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

    const toggleService = (service: string) => {
        setFormData(prev => {
            const services = prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service];
            return { ...prev, services };
        });
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.establishment_name.trim()) newErrors.name = 'El nombre es requerido';
        if (formData.services.length === 0) newErrors.services = 'Selecciona al menos un servicio';
        if (!formData.email.trim()) newErrors.email = 'El correo es requerido';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Correo inválido';
        
        if (!formData.password) newErrors.password = 'La contraseña es requerida';
        else if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
        
        if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Las contraseñas no coinciden';
        }
        
        if (!formData.accept_terms) newErrors.accept_terms = 'Debes aceptar los términos y condiciones';
        
        if (emailAvailable === false) newErrors.email = 'Este correo ya está registrado';
        
        return newErrors;
    };

    const handleEmailBlur = async () => {
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            setEmailAvailable(null);
            return;
        }

        setIsCheckingEmail(true);
        try {
            const { available, message } = await checkWellnessEmailAvailability(formData.email);
            setEmailAvailable(available);
            if (!available) {
                setErrors(prev => ({ ...prev, email: message || 'Este correo ya está registrado' }));
            } else {
                setErrors(prev => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                });
            }
        } catch (error) {
            console.error('Error checking email:', error);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const emailCheck = await checkWellnessEmailAvailability(formData.email);
            setEmailAvailable(emailCheck.available);
            if (!emailCheck.available) {
                setErrors({ email: emailCheck.message || 'Este correo ya está registrado' });
                return;
            }

            const response = await fetch('/api/wellness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                setShowSuccess(true);
                onSuccess?.();
            } else {
                setErrors({ submit: data.error || 'Ocurrió un error al registrar' });
            }
        } catch {
            setErrors({ submit: 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className={styles.successContainer}>
                <h2>¡Solicitud Enviada!</h2>
                <p>Tu solicitud como Centro de Bienestar está en revisión.</p>
                <p>Te enviaremos un correo una vez que hayamos validado tu información.</p>
                <button 
                    onClick={() => window.location.href = '/'}
                    className={styles.primaryButton}
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
                <label>Nombre del establecimiento</label>
                <input 
                    type="text" 
                    value={formData.establishment_name}
                    onChange={e => setFormData({...formData, establishment_name: e.target.value})}
                    placeholder="Ej. Veterinaria Paws"
                    className={errors.name ? styles.inputError : ''}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.field}>
                <label>Servicios ofrecidos</label>
                <div className={styles.servicesGrid}>
                    {servicesOptions.map(service => (
                        <button
                            key={service}
                            type="button"
                            onClick={() => toggleService(service)}
                            className={`${styles.serviceBadge} ${formData.services.includes(service) ? styles.active : ''}`}
                        >
                            {service}
                        </button>
                    ))}
                </div>
                {errors.services && <span className={styles.errorText}>{errors.services}</span>}
            </div>

            <div className={styles.field}>
                <label>Correo electrónico</label>
                <div className={styles.inputWrapper}>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => {
                            setFormData({...formData, email: e.target.value});
                            setEmailAvailable(null);
                            setErrors(prev => {
                                const next = { ...prev };
                                delete next.email;
                                return next;
                            });
                        }}
                        onBlur={handleEmailBlur}
                        placeholder="contacto@centro.com"
                        className={errors.email ? styles.inputError : ''}
                    />
                    {isCheckingEmail && <span className={styles.inputIndicator}>...</span>}
                    {emailAvailable === true && <span className={styles.inputIndicatorSuccess}>✓</span>}
                </div>
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label>Contraseña</label>
                    <div className={styles.inputWrapper}>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className={errors.password ? styles.inputError : ''}
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showPassword ? '👁️‍🗨️' : '👁️'}
                        </button>
                    </div>
                    {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                </div>
                <div className={styles.field}>
                    <label>Confirmar contraseña</label>
                    <div className={styles.inputWrapper}>
                        <input 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            value={formData.confirm_password}
                            onChange={e => setFormData({...formData, confirm_password: e.target.value})}
                            className={errors.confirm_password ? styles.inputError : ''}
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                        </button>
                    </div>
                    {errors.confirm_password && <span className={styles.errorText}>{errors.confirm_password}</span>}
                </div>
            </div>

            <div className={styles.checkboxField}>
                <input 
                    type="checkbox" 
                    id="terms"
                    checked={formData.accept_terms}
                    onChange={e => setFormData({...formData, accept_terms: e.target.checked})}
                />
                <label htmlFor="terms">
                    Acepto los 
                    <button 
                        type="button" 
                        className={styles.viewTermsLink}
                        onClick={() => setShowTermsModal(true)}
                    >
                        Términos y Condiciones
                    </button>
                </label>
            </div>
            {errors.accept_terms && <span className={styles.errorText}>{errors.accept_terms}</span>}

            {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}

            <button 
                type="submit" 
                disabled={isSubmitting}
                className={styles.submitButton}
            >
                {isSubmitting ? 'Enviando...' : 'Registrar Centro'}
            </button>

            <TermsModalEnhanced 
                isOpen={showTermsModal}
                onClose={(accepted) => {
                    setShowTermsModal(false);
                    if (accepted) {
                        setFormData(prev => ({...prev, accept_terms: true}));
                    }
                }}
            />
        </form>
    );
}
