'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminEditUserModal.module.css'; // Reutiliza los mismos estilos base
import { adminFetch } from '@/utils/admin-fetch';

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
    memberstack_slot?: number | null;
}

interface AdminEditPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet;
    petIndex: number; // 1, 2, o 3 — para el slot de Memberstack
    memberId: string;
    memberName: string;
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
}

export default function AdminEditPetModal({
    isOpen,
    onClose,
    pet,
    petIndex,
    memberId,
    memberName,
    onSaved,
}: AdminEditPetModalProps) {
    const initialData = (): PetFormData => ({
        name:        pet.name        || '',
        breed:       pet.breed       || '',
        petType:     pet.pet_type    || 'dog',
        gender:      pet.gender      || '',
        ageValue:    String(pet.age_value || ''),
        ageUnit:     pet.age_unit    || 'years',
        isAdopted:   pet.is_adopted  ?? false,
        isSenior:    pet.is_senior   ?? false,
        isMixedBreed: pet.is_mixed_breed ?? false,
    });

    const [formData, setFormData] = useState<PetFormData>(initialData);
    const [isSaving, setIsSaving] = useState(false);
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

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('El nombre de la mascota es obligatorio');
            return;
        }
        setIsSaving(true);
        setError(null);

        try {
            const original = initialData();

            // Detectar qué cambió
            const diff: Record<string, { old: string | boolean; new: string | boolean }> = {};
            const fieldKeyMap: Record<keyof PetFormData, string> = {
                name: 'name', breed: 'breed', petType: 'pet_type', gender: 'gender',
                ageValue: 'age_value', ageUnit: 'age_unit',
                isAdopted: 'is_adopted', isSenior: 'is_senior', isMixedBreed: 'is_mixed_breed',
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
        } catch (e: any) {
            setError('Error de conexión');
        } finally {
            setIsSaving(false);
        }
    };

    const petEmoji = formData.petType === 'cat' ? '🐱' : '🐶';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {petEmoji} Editar Info de {pet.name}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
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
                                <label className={styles.label}>Raza</label>
                                <input
                                    type="text"
                                    value={formData.breed}
                                    onChange={e => handleChange('breed', e.target.value)}
                                    className={styles.input}
                                    placeholder={formData.isMixedBreed ? 'Mestizo' : 'Raza'}
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
