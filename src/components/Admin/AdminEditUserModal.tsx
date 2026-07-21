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

    const Field = ({ label, fieldKey, type = 'text', placeholder }: {
        label: string;
        fieldKey: keyof UserFormData;
        type?: string;
        placeholder?: string;
    }) => (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>
            <input
                type={type}
                value={formData[fieldKey]}
                onChange={e => handleChange(fieldKey, e.target.value)}
                className={styles.input}
                placeholder={placeholder || label}
            />
        </div>
    );

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
                            <Field label="Nombre(s)" fieldKey="firstName" />
                            <Field label="Apellido Paterno" fieldKey="paternalLastName" />
                            <Field label="Apellido Materno" fieldKey="maternalLastName" />
                            <Field label="Fecha de Nacimiento" fieldKey="birthDate" type="date" />
                            <Field label="CURP" fieldKey="curp" placeholder="XXXX000000XXXXXX00" />
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📱 Contacto</h3>
                        <div className={styles.grid}>
                            <Field label="Correo Electrónico" fieldKey="email" type="email" />
                            <Field label="Teléfono" fieldKey="phone" type="tel" />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📍 Dirección</h3>
                        <div className={styles.grid}>
                            <Field label="Código Postal" fieldKey="postalCode" />
                            <Field label="Estado" fieldKey="state" />
                            <Field label="Ciudad" fieldKey="city" />
                            <Field label="Colonia" fieldKey="colony" />
                            <Field label="Dirección (calle y número)" fieldKey="address" />
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
