'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminEditUserModal.module.css';
import { adminFetch } from '@/utils/admin-fetch';
import NationalitySelect from '../RegistrationV2/NationalitySelect';
import ColonyAutocomplete from '../FormFields/ColonyAutocomplete';
import { getCDMXAlcaldia } from '@/utils/postalCodeUtils';

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
    nationality: string;
    nationalityCode: string;
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
        nationality:     supabaseUser?.nationality     || fields['nationality']           || 'México',
        nationalityCode: supabaseUser?.nationality_code || 'MEX',
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
    const [isLoadingCP, setIsLoadingCP] = useState(false);
    const [colonySuggestions, setColonySuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData());
            setError(null);
            setColonySuggestions([]);
        }
    }, [isOpen, member, supabaseUser]);

    const fetchFromGoogle = async (cp: string) => {
        if (typeof window === 'undefined' || !(window as any).google || !(window as any).google.maps) return null;
        try {
            const geocoder = new (window as any).google.maps.Geocoder();
            const response = await geocoder.geocode({
                address: cp,
                componentRestrictions: { country: 'MX' },
                language: 'es',
                region: 'mx'
            });

            if (response.results && response.results.length > 0) {
                const result = response.results[0];
                let state = '';
                let city = '';

                result.address_components.forEach((component: any) => {
                    if (component.types.includes('administrative_area_level_1')) {
                        state = component.long_name;
                    }
                });

                const isCDMXState =
                    state.toLowerCase().includes('ciudad de méxico') ||
                    state.toLowerCase().includes('mexico city') ||
                    state.toLowerCase() === 'distrito federal';

                if (isCDMXState) state = 'Ciudad de México';

                const components = result.address_components;
                const sublocality1 = components.find((c: any) => c.types.includes('sublocality_level_1'))?.long_name;
                const adminArea2 = components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;
                const locality = components.find((c: any) => c.types.includes('locality'))?.long_name;

                if (isCDMXState) {
                    city = sublocality1 || adminArea2 || locality || '';
                    if (city.toLowerCase().includes('ciudad de méxico') ||
                        city.toLowerCase().includes('mexico city') ||
                        city.toLowerCase().includes('cdmx')) {
                        city = sublocality1 || adminArea2 || '';
                    }
                } else {
                    city = adminArea2 || locality || sublocality1 || '';
                }

                return { state, city };
            }
        } catch (err) {
            console.error('Google Geocoding error:', err);
        }
        return null;
    };

    const fetchColoniesFromSepomex = async (cp: string) => {
        if (!cp || cp.length !== 5) return null;
        try {
            const response = await fetch(`/api/sepomex?cp=${cp}`);
            const result = await response.json();
            if (result.success) {
                setColonySuggestions(result.data.colonies || []);
                return result.data;
            }
        } catch (err) {
            console.error('Error SEPOMEX:', err);
        }
        return null;
    };

    const handlePostalCodeQuery = async (cpValue?: string) => {
        const cp = cpValue || formData.postalCode;
        if (!cp || cp.length !== 5) return;

        setIsLoadingCP(true);
        try {
            const [googleData, sepomexData] = await Promise.all([
                fetchFromGoogle(cp),
                fetchColoniesFromSepomex(cp)
            ]);

            if (googleData || sepomexData) {
                setFormData(current => {
                    const finalState = googleData?.state || sepomexData?.state || current.state;
                    const localAlcaldia = getCDMXAlcaldia(cp);
                    const isCDMX = localAlcaldia ||
                                  finalState.toLowerCase().includes('ciudad de méxico') ||
                                  finalState.toLowerCase().includes('mexico city');

                    let finalCity = localAlcaldia || googleData?.city;

                    if (!finalCity || (isCDMX && !localAlcaldia && (
                        finalCity.toLowerCase().includes('ciudad de méxico') ||
                        finalCity.toLowerCase().includes('mexico city')
                    ))) {
                        finalCity = sepomexData?.municipality || finalCity || current.city;
                    }

                    return {
                        ...current,
                        state: finalState || '',
                        city: finalCity || '',
                        postalCode: cp,
                    };
                });
            }
        } catch (err) {
            console.error('Error consultando CP:', err);
        } finally {
            setIsLoadingCP(false);
        }
    };

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
                nationality:     'nationality',
                nationalityCode: 'nationality_code',
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
                                <NationalitySelect
                                    value={formData.nationality}
                                    onChange={(nameEs, code) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            nationality: nameEs,
                                            nationalityCode: code,
                                        }));
                                    }}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>CURP</label>
                                <input
                                    type="text"
                                    value={formData.curp}
                                    onChange={e => handleChange('curp', e.target.value.toUpperCase())}
                                    className={styles.input}
                                    placeholder="XXXX000000XXXXXX00"
                                    maxLength={18}
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
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={formData.postalCode}
                                        onChange={e => {
                                            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 5);
                                            handleChange('postalCode', cleaned);
                                            if (cleaned.length === 5) {
                                                handlePostalCodeQuery(cleaned);
                                            }
                                        }}
                                        onBlur={() => handlePostalCodeQuery()}
                                        className={styles.input}
                                        placeholder="Código Postal (5 dígitos)"
                                        maxLength={5}
                                    />
                                    {isLoadingCP && <span style={{ fontSize: '0.75rem', color: '#FE8F15', fontWeight: 600 }}>Consultando...</span>}
                                </div>
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
                                <label className={styles.label}>Municipio / Alcaldía</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => handleChange('city', e.target.value)}
                                    className={styles.input}
                                    placeholder="Municipio / Alcaldía"
                                />
                            </div>
                            <div className={styles.field}>
                                <ColonyAutocomplete
                                    label="Colonia"
                                    name="colony"
                                    value={formData.colony}
                                    suggestions={colonySuggestions}
                                    onChange={value => handleChange('colony', value)}
                                    placeholder="Escribe o selecciona colonia..."
                                    isLoading={isLoadingCP}
                                />
                            </div>
                            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Dirección (calle y número)</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                    className={styles.input}
                                    placeholder="Calle y número exterior/interior"
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
