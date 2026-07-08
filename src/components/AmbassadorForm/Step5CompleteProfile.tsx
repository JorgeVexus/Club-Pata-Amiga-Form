'use client';

import React, { useRef, useState } from 'react';
import { PaymentMethod } from '@/types/ambassador.types';
import { validateRFC } from '@/utils/rfc-validator';
import styles from './Step5CompleteProfile.module.css';

export interface CompleteProfileData {
    rfc: string;
    payment_method: PaymentMethod | '';
    bank_name: string;
    clabe: string;
    facebook: string;
    instagram: string;
    tiktok: string;
    motivation: string;
    profile_photo_url: string;
}

interface Props {
    ambassadorId: string;
    initialData: Partial<CompleteProfileData>;
    onSaved?: () => void;
}

const DEFAULT_PHOTO_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <rect width="160" height="160" rx="80" fill="#E8F8F7"/>
        <circle cx="80" cy="62" r="26" fill="#00BBB4"/>
        <path d="M36 132c8-32 26-48 44-48s36 16 44 48" fill="#00BBB4"/>
    </svg>
`)}`;

export default function Step5CompleteProfile({ ambassadorId, initialData, onSaved }: Props) {
    const [formData, setFormData] = useState<CompleteProfileData>({
        rfc: initialData.rfc || '',
        payment_method: initialData.payment_method || '',
        bank_name: initialData.bank_name || '',
        clabe: initialData.clabe || '',
        facebook: initialData.facebook || '',
        instagram: initialData.instagram || '',
        tiktok: initialData.tiktok || '',
        motivation: initialData.motivation || '',
        profile_photo_url: initialData.profile_photo_url || ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [saved, setSaved] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ text: 'Solo se aceptan imágenes', type: 'error' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ text: 'La imagen no puede superar 5MB', type: 'error' });
            return;
        }

        setIsUploadingPhoto(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('ambassadorId', ambassadorId);

        try {
            const response = await fetch('/api/upload/ambassador-photo', { method: 'POST', body: fd });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, profile_photo_url: result.url }));
                setMessage({ text: '', type: '' });
            } else {
                setMessage({ text: 'Error al subir foto: ' + result.error, type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexión al subir foto', type: 'error' });
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleRfcChange = (value: string) => {
        setFormData(prev => ({ ...prev, rfc: value.toUpperCase().slice(0, 13) }));
        setErrors(prev => {
            const next = { ...prev };
            delete next.rfc;
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        const nextErrors: Record<string, string> = {};

        if (formData.rfc.trim()) {
            const rfcValidation = validateRFC(formData.rfc.trim());
            if (!rfcValidation.isValid) {
                nextErrors.rfc = rfcValidation.error || 'RFC inválido';
            }
        }

        if (formData.payment_method === 'clabe') {
            if (!formData.bank_name.trim()) {
                nextErrors.bank_name = 'Indica tu banco';
            }
            if (formData.clabe.length !== 18) {
                nextErrors.clabe = 'La CLABE debe tener 18 dígitos';
            }
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/ambassadors/${ambassadorId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rfc: formData.rfc.trim() || undefined,
                    payment_method: formData.payment_method || undefined,
                    bank_name: formData.payment_method === 'clabe' ? formData.bank_name.trim() : undefined,
                    clabe: formData.payment_method === 'clabe' ? formData.clabe : undefined,
                    facebook: formData.facebook.trim() || undefined,
                    instagram: formData.instagram.trim() || undefined,
                    tiktok: formData.tiktok.trim() || undefined,
                    motivation: formData.motivation.trim() || undefined,
                    profile_photo_url: formData.profile_photo_url || undefined
                })
            });

            const data = await response.json();
            if (data.success) {
                setSaved(true);
                onSaved?.();
            } else {
                setMessage({ text: data.error || 'Error al guardar', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error de conexión. Intenta de nuevo.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (saved) {
        return (
            <div className={styles.successBox}>
                <div className={styles.successIcon}>🎉</div>
                <h2>¡Listo! Tu información fue guardada</h2>
                <p>Gracias por completar tu perfil. En cuanto tu solicitud sea aprobada, empezaremos a usar estos datos para tus pagos y comunicaciones.</p>
                <a href="https://www.pataamiga.mx/user/inicio-de-sesion" className={styles.loginButton}>
                    Iniciar sesión
                    <span className={styles.btnIconCircleWhite}>→</span>
                </a>
            </div>
        );
    }

    const rfcType = formData.rfc && !errors.rfc ? validateRFC(formData.rfc).type : undefined;

    return (
        <form onSubmit={handleSubmit} className={styles.pageContainer}>
            <div className={styles.profileHeader}>
                <div className={styles.avatarWrapper}>
                    <img
                        src={formData.profile_photo_url || DEFAULT_PHOTO_PLACEHOLDER}
                        alt="Foto de perfil"
                        className={styles.avatarImg}
                    />
                    <button
                        type="button"
                        className={styles.avatarEditButton}
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        aria-label="Cambiar foto de perfil"
                    >
                        {isUploadingPhoto ? '…' : '📷'}
                    </button>
                    <input
                        type="file"
                        ref={photoInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>
                <h2>Completa tu perfil</h2>
                <p>Estos datos son opcionales, pero nos ayudan a agilizar el pago de tus comisiones y tu aprobación.</p>
            </div>

            <div className={styles.orangeFormBox}>
                <div className={styles.formBadge}>
                    <span>💰</span>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        RFC
                        {rfcType && (
                            <span className={styles.rfcTypeBadge}>
                                {rfcType === 'physical' ? '👤 Persona Física' : '🏢 Persona Moral'}
                            </span>
                        )}
                    </h3>
                    <input
                        type="text"
                        value={formData.rfc}
                        onChange={(e) => handleRfcChange(e.target.value)}
                        placeholder="Ej. ABCD123456EFG"
                        maxLength={13}
                        className={`${styles.input} ${errors.rfc ? styles.inputError : ''}`}
                    />
                    {errors.rfc && <small className={styles.error}>{errors.rfc}</small>}
                </div>

                <div className={styles.divider} />

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Datos bancarios</h3>
                    <p className={styles.sectionHelp}>Para depositarte tus comisiones cuando seas aprobado.</p>

                    <div className={styles.paymentCards}>
                        <button
                            type="button"
                            className={`${styles.paymentCard} ${formData.payment_method === 'clabe' ? styles.paymentCardSelected : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, payment_method: 'clabe' }))}
                        >
                            💳 CLABE o tarjeta
                        </button>
                        <button
                            type="button"
                            className={`${styles.paymentCard} ${formData.payment_method === 'pending' ? styles.paymentCardSelected : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, payment_method: 'pending' }))}
                        >
                            ⏰ Agregar después
                        </button>
                    </div>

                    {formData.payment_method === 'clabe' && (
                        <div className={styles.bankFields}>
                            <label className={styles.fieldLabel}>
                                <span>Banco</span>
                                <input
                                    type="text"
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                                    placeholder="Ej. BBVA, Santander, Banorte"
                                    className={`${styles.input} ${errors.bank_name ? styles.inputError : ''}`}
                                />
                                {errors.bank_name && <small className={styles.error}>{errors.bank_name}</small>}
                            </label>
                            <label className={styles.fieldLabel}>
                                <span>CLABE interbancaria</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={18}
                                    value={formData.clabe}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clabe: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
                                    placeholder="18 dígitos"
                                    className={`${styles.input} ${errors.clabe ? styles.inputError : ''}`}
                                />
                                {errors.clabe && <small className={styles.error}>{errors.clabe}</small>}
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.tealFormBox}>
                <div className={styles.formBadge}>
                    <span>💬</span>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Redes sociales <small>(opcional)</small></h3>
                    <div className={styles.socialGrid}>
                        <div className={styles.socialInputWrapper}>
                            <span className={styles.socialIcon} style={{ background: '#1877F2' }}>👤</span>
                            <input
                                type="text"
                                value={formData.facebook}
                                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                                placeholder="Facebook"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.socialInputWrapper}>
                            <span className={styles.socialIcon} style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>📸</span>
                            <input
                                type="text"
                                value={formData.instagram}
                                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                                placeholder="Instagram"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.socialInputWrapper}>
                            <span className={styles.socialIcon} style={{ background: '#000000' }}>🎵</span>
                            <input
                                type="text"
                                value={formData.tiktok}
                                onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                                placeholder="TikTok"
                                className={styles.input}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>¿Por qué quieres ser embajador?</h3>
                    <textarea
                        value={formData.motivation}
                        onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                        placeholder="Cuéntanos tu historia..."
                        rows={4}
                        className={styles.textarea}
                    />
                </div>
            </div>

            {message.text && (
                <div className={`${styles.message} ${message.type === 'error' ? styles.messageError : styles.messageSuccess}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.buttonsRow}>
                <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                    <span className={styles.btnIconCircleWhite}>→</span>
                </button>
            </div>
        </form>
    );
}
