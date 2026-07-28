'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminEditUserModal.module.css'; // Reutiliza los mismos estilos base
import { adminFetch } from '@/utils/admin-fetch';

import BreedAutocomplete from '@/components/FormFields/BreedAutocomplete';
import ColorAutocomplete from '@/components/FormFields/ColorAutocomplete';

interface Pet {
    id: string;
    name: string;
    breed?: string;
    gender?: string;
    age_value?: string | number;
    age_unit?: string;
    pet_type?: string;
    is_adopted?: boolean;
    is_senior?: boolean;
    is_mixed_breed?: boolean;
    coat_color?: string;
    nose_color?: string;
    eye_color?: string;
    primary_photo_url?: string;
    photo_url?: string;
    memberstack_slot?: number | null;
}

interface AdminEditPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet;
    petIndex: number; // 1, 2, o 3 — para el slot de Memberstack
    memberId: string;
    memberName: string;
    isNew?: boolean;
    onSaved: () => void;
}

interface PetFormData {
    name: string;
    breed: string;
    petType: string;
    gender: string;
    ageValue: string;
    ageUnit: string;
    isAdopted: boolean;
    isSenior: boolean;
    isMixedBreed: boolean;
    coatColor: string;
    noseColor: string;
    eyeColor: string;
    primaryPhotoUrl: string;
}

export default function AdminEditPetModal({
    isOpen,
    onClose,
    pet,
    petIndex,
    memberId,
    memberName,
    isNew = false,
    onSaved,
}: AdminEditPetModalProps) {
    const initialData = (): PetFormData => ({
        name:            pet.name            || '',
        breed:           pet.breed           || '',
        petType:         pet.pet_type        || 'dog',
        gender:          pet.gender          || '',
        ageValue:        String(pet.age_value || ''),
        ageUnit:         pet.age_unit        || 'years',
        isAdopted:       pet.is_adopted      ?? false,
        isSenior:        pet.is_senior       ?? false,
        isMixedBreed:    pet.is_mixed_breed  ?? false,
        coatColor:       pet.coat_color      || '',
        noseColor:       pet.nose_color      || '',
        eyeColor:        pet.eye_color       || '',
        primaryPhotoUrl: pet.primary_photo_url || pet.photo_url || '',
    });

    const [formData, setFormData] = useState<PetFormData>(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData());
            setError(null);
        }
    }, [isOpen, pet]);

    if (!isOpen) return null;

    const handleChange = (key: keyof PetFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError('La foto no debe superar 10MB');
            return;
        }

        setIsUploadingPhoto(true);
        setError(null);

        try {
            const uploadBody = new FormData();
            uploadBody.append('file', file);
            uploadBody.append('userId', memberId);

            const res = await fetch('/api/upload/pet-photo', {
                method: 'POST',
                body: uploadBody,
            });

            const data = await res.json();
            if (data.success && data.url) {
                handleChange('primaryPhotoUrl', data.url);
            } else {
                setError(data.error || 'Error al subir foto');
            }
        } catch (err: any) {
            setError('Error de conexión al subir foto');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('El nombre de la mascota es obligatorio');
            return;
        }
        setIsSaving(true);
        setError(null);

        try {
            if (isNew) {
                // Registrar nueva mascota vía POST
                const res = await adminFetch(`/api/admin/members/${memberId}/pets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        msIndex: petIndex,
                        memberName,
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    onSaved();
                    onClose();
                } else {
                    setError(data.error || 'Error al registrar mascota');
                }
            } else {
                // Editar mascota existente vía PATCH
                const original = initialData();

                const diff: Record<string, { old: string | boolean; new: string | boolean }> = {};
                const fieldKeyMap: Record<keyof PetFormData, string> = {
                    name: 'name', breed: 'breed', petType: 'pet_type', gender: 'gender',
                    ageValue: 'age_value', ageUnit: 'age_unit',
                    isAdopted: 'is_adopted', isSenior: 'is_senior', isMixedBreed: 'is_mixed_breed',
                    coatColor: 'coat_color', noseColor: 'nose_color', eyeColor: 'eye_color',
                    primaryPhotoUrl: 'primary_photo_url',
                };

                (Object.keys(formData) as (keyof PetFormData)[]).forEach(key => {
                    if (String(formData[key]) !== String(original[key])) {
                        diff[fieldKeyMap[key]] = { old: original[key] as string, new: formData[key] as string };
                    }
                });

                if (Object.keys(diff).length === 0) {
                    onClose();
                    return;
                }

                const res = await adminFetch(`/api/admin/members/${memberId}/pets/${pet.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        msIndex: petIndex,
                        petName: pet.name,
                        memberName,
                        changes: diff,
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    onSaved();
                    onClose();
                } else {
                    setError(data.error || 'Error al guardar');
                }
            }
        } catch (e: any) {
            setError('Error de conexión');
        } finally {
            setIsSaving(false);
        }
    };

    const petEmoji = formData.petType === 'cat' ? '🐱' : '🐶';
    const titleText = isNew
        ? `➕ Registrar Nueva Mascota (Slot ${petIndex})`
        : `${petEmoji} Editar Info de ${pet.name}`;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{titleText}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    {/* Foto Principal */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📸 Foto Principal</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            {formData.primaryPhotoUrl ? (
                                <img
                                    src={formData.primaryPhotoUrl}
                                    alt="Foto de la mascota"
                                    style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #7DD8D5', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                />
                            ) : (
                                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', border: '2px solid #000' }}>
                                    {petEmoji}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <label
                                    style={{
                                        display: 'inline-block', padding: '8px 18px', background: '#FE8F15', color: '#fff',
                                        borderRadius: '50px', border: '1.5px solid #000', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                                    }}
                                >
                                    {isUploadingPhoto ? '⏳ Subiendo...' : '📷 Subir / Cambiar Foto'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        style={{ display: 'none' }}
                                        disabled={isUploadingPhoto}
                                    />
                                </label>
                                {formData.primaryPhotoUrl && (
                                    <button
                                        type="button"
                                        onClick={() => handleChange('primaryPhotoUrl', '')}
                                        style={{ padding: '7px 14px', background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FCA5A5', borderRadius: '50px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                        Quitar Foto
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tipo */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>🐾 Tipo de Mascota</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Tipo</label>
                                <select
                                    value={formData.petType}
                                    onChange={e => handleChange('petType', e.target.value)}
                                    className={styles.input}
                                >
                                    <option value="dog">Perro 🐶</option>
                                    <option value="cat">Gato 🐱</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Sexo</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => handleChange('gender', e.target.value)}
                                    className={styles.input}
                                >
                                    <option value="">No especificado</option>
                                    <option value="macho">♂ Macho</option>
                                    <option value="hembra">♀ Hembra</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Datos básicos */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📋 Datos Básicos</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className={styles.input}
                                    placeholder="Nombre de la mascota"
                                />
                            </div>
                            <div className={styles.field}>
                                <BreedAutocomplete
                                    label="Raza"
                                    name="breed"
                                    petType={formData.petType === 'cat' ? 'gato' : 'perro'}
                                    value={formData.breed}
                                    showWarning={false}
                                    onChange={(value) => handleChange('breed', value)}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Edad (valor)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formData.ageValue}
                                    onChange={e => handleChange('ageValue', e.target.value)}
                                    className={styles.input}
                                    placeholder="Ej. 3"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Unidad de Edad</label>
                                <select
                                    value={formData.ageUnit}
                                    onChange={e => handleChange('ageUnit', e.target.value)}
                                    className={styles.input}
                                >
                                    <option value="years">Años</option>
                                    <option value="months">Meses</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Rasgos de Color */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>🎨 Rasgos de Color</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <ColorAutocomplete
                                    label="Color de Pelo"
                                    name="coatColor"
                                    category="coat"
                                    petType={formData.petType === 'cat' ? 'gato' : 'perro'}
                                    value={formData.coatColor}
                                    onChange={(val) => handleChange('coatColor', val)}
                                />
                            </div>
                            <div className={styles.field}>
                                <ColorAutocomplete
                                    label="Color de Nariz"
                                    name="noseColor"
                                    category="nose"
                                    petType={formData.petType === 'cat' ? 'gato' : 'perro'}
                                    value={formData.noseColor}
                                    onChange={(val) => handleChange('noseColor', val)}
                                />
                            </div>
                            <div className={styles.field}>
                                <ColorAutocomplete
                                    label="Color de Ojos"
                                    name="eyeColor"
                                    category="eye"
                                    petType={formData.petType === 'cat' ? 'gato' : 'perro'}
                                    value={formData.eyeColor}
                                    onChange={(val) => handleChange('eyeColor', val)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Características */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>🏷️ Características</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {[
                                { key: 'isAdopted' as keyof PetFormData, label: '🏠 Adoptado', emoji: '🏠' },
                                { key: 'isSenior' as keyof PetFormData, label: '👴 Senior', emoji: '👴' },
                                { key: 'isMixedBreed' as keyof PetFormData, label: '🔀 Mestizo', emoji: '🔀' },
                            ].map(({ key, label }) => (
                                <label
                                    key={key}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 14px', borderRadius: '50px',
                                        border: `2px solid ${formData[key] ? '#7DD8D5' : '#E2E8F0'}`,
                                        background: formData[key] ? '#F0FEFE' : '#fff',
                                        cursor: 'pointer', fontWeight: formData[key] ? 700 : 400,
                                        fontSize: '0.875rem', color: '#2D3748',
                                        userSelect: 'none', transition: 'all 0.15s',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData[key] as boolean}
                                        onChange={e => handleChange(key, e.target.checked)}
                                        style={{ accentColor: '#7DD8D5', width: '16px', height: '16px' }}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className={styles.errorBox}>❌ {error}</div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
