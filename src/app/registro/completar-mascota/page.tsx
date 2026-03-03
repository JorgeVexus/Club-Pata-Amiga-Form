'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TextInput from '@/components/FormFields/TextInput';
import SelectWithInfo from '@/components/FormFields/SelectWithInfo';
import Toast from '@/components/UI/Toast';
import styles from './page.module.css';

// Opciones para selects
const genderOptions = [
    { value: 'macho', label: 'Macho' },
    { value: 'hembra', label: 'Hembra' }
];

const breedOptions = [
    { value: 'labrador', label: 'Labrador Retriever' },
    { value: 'pitbull', label: 'Pitbull' },
    { value: 'chihuahua', label: 'Chihuahua' },
    { value: 'mestizo', label: 'Mestizo (Sin raza definida)' },
    { value: 'siames', label: 'Siamés' },
    { value: 'persa', label: 'Persa' },
    { value: 'otro', label: 'Otra raza' }
];

const coatColorOptions = [
    { value: 'negro', label: 'Negro' },
    { value: 'blanco', label: 'Blanco' },
    { value: 'cafe', label: 'Café/Marrón' },
    { value: 'gris', label: 'Gris' },
    { value: 'naranja', label: 'Naranja/Rojo' },
    { value: 'tricolor', label: 'Tricolor' },
    { value: 'otro', label: 'Otro' }
];

const noseColorOptions = [
    { value: 'negra', label: 'Negra' },
    { value: 'rosa', label: 'Rosa' },
    { value: 'marron', label: 'Marrón' },
    { value: 'multicolor', label: 'Multicolor' }
];

const eyeColorOptions = [
    { value: 'marron', label: 'Marrón' },
    { value: 'azul', label: 'Azul' },
    { value: 'verde', label: 'Verde' },
    { value: 'avellana', label: 'Avellana' },
    { value: 'heterocromia', label: 'Heterocromía' }
];

export default function CompletarMascota() {
    const router = useRouter();
    const [petData, setPetData] = useState<any>(null);
    const [petMeta, setPetMeta] = useState<any>(null);

    const [formData, setFormData] = useState({
        gender: '',
        breed: '',
        isMixedBreed: false,
        coatColor: '',
        noseColor: '',
        eyeColor: '',
        isAdopted: false,
        adoptionStory: '',
        primaryPhoto: null as File | null
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    useEffect(() => {
        // Verificar flujo
        const step1Data = localStorage.getItem('registration_step1');
        const contractorData = localStorage.getItem('registration_contractor');
        const step2Data = localStorage.getItem('registration_step2');
        const step2Meta = localStorage.getItem('registration_pet_meta');

        if (!step1Data) {
            router.replace('/registro/paso-1-cuenta');
            return;
        }
        if (!contractorData) {
            router.replace('/registro/completar-perfil');
            return;
        }

        if (step2Data) setPetData(JSON.parse(step2Data));
        if (step2Meta) setPetMeta(JSON.parse(step2Meta));
    }, [router]);

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación básica
        const newErrors: Record<string, string> = {};
        if (!formData.gender) newErrors.gender = 'Selecciona el sexo';
        if (!formData.breed) newErrors.breed = 'Selecciona la raza';
        if (!formData.coatColor) newErrors.coatColor = 'Selecciona el color de pelo';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Completa los campos requeridos', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Guardar datos
            localStorage.setItem('registration_pet_complementary', JSON.stringify({
                ...formData,
                timestamp: new Date().toISOString()
            }));

            // Marcar registro como completo
            localStorage.setItem('registration_completed', 'true');
            localStorage.setItem('registration_completed_at', new Date().toISOString());

            console.log('✅ Registro completado');

            // Redirigir a confirmación
            router.push('/registro/confirmacion');
        } catch (error: any) {
            console.error('Error:', error);
            showToast(error.message || 'Error al guardar', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('La foto no debe superar 5MB', 'error');
                return;
            }
            setFormData(prev => ({ ...prev, primaryPhoto: file }));
        }
    };

    if (!petData) {
        return <div className={styles.loading}>Cargando...</div>;
    }

    const isSenior = petMeta?.isSenior || false;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '100%' }} />
                </div>

                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <span className={styles.stepBadge}>Paso 2 de 2</span>
                        <h1 className={styles.title}>Completa los datos de {petData.petName}</h1>
                        <p className={styles.subtitle}>
                            Estos datos nos ayudan a identificar a tu mascota
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Información básica */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Información general</h3>

                            <SelectWithInfo
                                label="Sexo"
                                name="gender"
                                value={formData.gender}
                                onChange={(value) => setFormData({ ...formData, gender: value })}
                                options={genderOptions}
                                infoText=""
                                error={errors.gender}
                                required
                            />

                            <SelectWithInfo
                                label="Raza"
                                name="breed"
                                value={formData.breed}
                                onChange={(value) => {
                                    setFormData({
                                        ...formData,
                                        breed: value,
                                        isMixedBreed: value === 'mestizo'
                                    });
                                }}
                                options={breedOptions}
                                infoText="Selecciona 'Mestizo' si no tiene raza definida"
                                error={errors.breed}
                                required
                            />
                        </div>

                        {/* Colores */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Características físicas</h3>

                            <div className={styles.row}>
                                <SelectWithInfo
                                    label="Color de pelo"
                                    name="coatColor"
                                    value={formData.coatColor}
                                    onChange={(value) => setFormData({ ...formData, coatColor: value })}
                                    options={coatColorOptions}
                                    infoText=""
                                    error={errors.coatColor}
                                    required
                                />

                                <SelectWithInfo
                                    label="Color de nariz"
                                    name="noseColor"
                                    value={formData.noseColor}
                                    onChange={(value) => setFormData({ ...formData, noseColor: value })}
                                    options={noseColorOptions}
                                    infoText=""
                                    error={errors.noseColor}
                                />
                            </div>

                            <SelectWithInfo
                                label="Color de ojos"
                                name="eyeColor"
                                value={formData.eyeColor}
                                onChange={(value) => setFormData({ ...formData, eyeColor: value })}
                                options={eyeColorOptions}
                                infoText=""
                                error={errors.eyeColor}
                            />
                        </div>

                        {/* Foto */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Fotografía</h3>

                            <div className={styles.photoUpload}>
                                <label className={styles.photoLabel}>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        onChange={handlePhotoChange}
                                        className={styles.photoInput}
                                    />
                                    <div className={styles.photoPlaceholder}>
                                        {formData.primaryPhoto ? (
                                            <>
                                                <span className={styles.photoIcon}>✓</span>
                                                <span>Foto seleccionada</span>
                                                <small>{formData.primaryPhoto.name}</small>
                                            </>
                                        ) : (
                                            <>
                                                <span className={styles.photoIcon}>📷</span>
                                                <span>Haz clic para subir foto</span>
                                                <small>JPG o PNG, máximo 5MB</small>
                                            </>
                                        )}
                                    </div>
                                </label>

                                <p className={styles.photoHelp}>
                                    📅 Tienes 15 días para subir la foto desde tu cuenta.
                                    No te preocupes si no la tienes ahora.
                                </p>
                            </div>
                        </div>

                        {/* Para mestizos */}
                        {formData.isMixedBreed && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Historia de adopción</h3>

                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAdopted}
                                        onChange={(e) => setFormData({ ...formData, isAdopted: e.target.checked })}
                                    />
                                    <span>Fue adoptado/a</span>
                                </label>

                                {formData.isAdopted && (
                                    <div className={styles.textAreaWrapper}>
                                        <label className={styles.textAreaLabel}>
                                            Cuéntanos su historia (opcional)
                                        </label>
                                        <textarea
                                            value={formData.adoptionStory}
                                            onChange={(e) => setFormData({ ...formData, adoptionStory: e.target.value })}
                                            placeholder="¿Cómo llegó a tu vida?"
                                            className={styles.textArea}
                                            rows={4}
                                            maxLength={500}
                                        />
                                        <small className={styles.charCount}>
                                            {formData.adoptionStory.length}/500
                                        </small>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Certificado para seniors */}
                        {isSenior && (
                            <div className={styles.alertBox}>
                                <span className={styles.alertIcon}>⚕️</span>
                                <div>
                                    <strong>Certificado veterinario requerido</strong>
                                    <p>
                                        Como {petData.petName} tiene {petMeta?.ageInYears} años,
                                        necesitarás subir un certificado veterinario dentro de los
                                        próximos 15 días para activar la cobertura completa.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Finalizando...' : 'Completar registro'}
                            {!isSubmitting && <span>✓</span>}
                        </button>
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
