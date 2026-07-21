'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminEditUserModal.module.css';
import { adminFetch } from '@/utils/admin-fetch';

interface AdminEditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: any;
    supabaseUser: any;
    memberName: string;
    onSaved: () => void;
}

interface UserFormData {
    firstName: string;
    paternalLastName: string;
    maternalLastName: string;
    email: string;
    phone: string;
    birthDate: string;
    curp: string;
    address: string;
    colony: string;
    city: string;
    state: string;
    postalCode: string;
}

export default function AdminEditUserModal({
    isOpen,
    onClose,
    member,
    supabaseUser,
    memberName,
    onSaved,
}: AdminEditUserModalProps) {
    const fields = member?.customFields || {};

    const initialData = (): UserFormData => ({
        firstName:       fields['first-name']          || supabaseUser?.first_name       || '',
        paternalLastName: fields['paternal-last-name'] || supabaseUser?.last_name         || '',
        maternalLastName: fields['maternal-last-name'] || supabaseUser?.mother_last_name  || '',
        email:           member?.auth?.email           || member?.email                   || supabaseUser?.email || '',
        phone:           fields['phone']               || supabaseUser?.phone             || '',
        birthDate:       fields['birth-date']          || supabaseUser?.birth_date        || '',
        curp:            fields['curp']                || supabaseUser?.curp              || '',
        address:         fields['address']             || supabaseUser?.address           || '',
        colony:          fields['colony']              || supabaseUser?.colony            || '',
        city:            fields['city']                || supabaseUser?.city              || '',
        state:           fields['state']               || supabaseUser?.state             || '',
        postalCode:      fields['postal-code']         || supabaseUser?.postal_code       || '',
    });

    const [formData, setFormData] = useState<UserFormData>(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData());
            setError(null);
        }
    }, [isOpen, member, supabaseUser]);

    if (!isOpen) return null;

    const handleChange = (key: keyof UserFormData, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const original = initialData();

            // Detectar qué cambió
            const diff: Record<string, { old: string; new: string }> = {};
            const fieldKeyMap: Record<keyof UserFormData, string> = {
                firstName:       'first_name',
                paternalLastName: 'last_name',
                maternalLastName: 'mother_last_name',
                email:           'email',
                phone:           'phone',
                birthDate:       'birth_date',
                curp:            'curp',
                address:         'address',
                colony:          'colony',
                city:            'city',
                state:           'state',
                postalCode:      'postal_code',
            };

            (Object.keys(formData) as (keyof UserFormData)[]).forEach(key => {
                if (formData[key] !== original[key]) {
                    diff[fieldKeyMap[key]] = { old: original[key], new: formData[key] };
                }
            });

            if (Object.keys(diff).length === 0) {
                onClose();
                return;
            }

            const res = await adminFetch(`/api/admin/members/${member.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>✏️ Editar Información del Usuario</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    {/* Identidad */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>👤 Identidad</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nombre(s)</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={e => handleChange('firstName', e.target.value)}
                                    className={styles.input}
                                    placeholder="Nombre(s)"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Apellido Paterno</label>
                                <input
                                    type="text"
                                    value={formData.paternalLastName}
                                    onChange={e => handleChange('paternalLastName', e.target.value)}
                                    className={styles.input}
                                    placeholder="Apellido Paterno"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Apellido Materno</label>
                                <input
                                    type="text"
                                    value={formData.maternalLastName}
                                    onChange={e => handleChange('maternalLastName', e.target.value)}
                                    className={styles.input}
                                    placeholder="Apellido Materno"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={e => handleChange('birthDate', e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>CURP</label>
                                <input
                                    type="text"
                                    value={formData.curp}
                                    onChange={e => handleChange('curp', e.target.value)}
                                    className={styles.input}
                                    placeholder="XXXX000000XXXXXX00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📱 Contacto</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    className={styles.input}
                                    placeholder="Correo Electrónico"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => handleChange('phone', e.target.value)}
                                    className={styles.input}
                                    placeholder="Teléfono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📍 Dirección</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className={styles.label}>Código Postal</label>
                                <input
                                    type="text"
                                    value={formData.postalCode}
                                    onChange={e => handleChange('postalCode', e.target.value)}
                                    className={styles.input}
                                    placeholder="Código Postal"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Estado</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={e => handleChange('state', e.target.value)}
                                    className={styles.input}
                                    placeholder="Estado"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Ciudad</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => handleChange('city', e.target.value)}
                                    className={styles.input}
                                    placeholder="Ciudad"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Colonia</label>
                                <input
                                    type="text"
                                    value={formData.colony}
                                    onChange={e => handleChange('colony', e.target.value)}
                                    className={styles.input}
                                    placeholder="Colonia"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Dirección (calle y número)</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                    className={styles.input}
                                    placeholder="Dirección (calle y número)"
                                />
                            </div>
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
