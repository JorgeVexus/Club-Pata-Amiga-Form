/**
 * Paso 4: Completar perfil - MODO DEMO
 * Post-pago: Datos personales completos
 * Conecta a API SEPOMEX oficial del gobierno
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import DatePicker from '@/components/FormFields/DatePicker';
import PhoneInput from '@/components/FormFields/PhoneInput';
import NationalitySelect from '../NationalitySelect';
import styles from './steps.module.css';

// Cache en memoria para SEPOMEX (persiste durante la sesión)
const sepomexCache = new Map<string, any>();

interface Step4CompleteProfileProps {
    data: any;
    member: any;
    onNext: (data: any) => void;
    onBack: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
    onLogout?: () => void;
}

export default function Step4CompleteProfileDemo({ data, member, onNext, showToast }: Step4CompleteProfileProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        paternalLastName: '',
        maternalLastName: '',
        birthDate: '',
        nationality: '',
        nationalityCode: '',
        phone: '',
        email: member?.auth?.email || data?.account?.email || '',
        curp: '',
        postalCode: '',
        state: '',
        city: '',
        colony: '',
        address: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCP, setIsLoadingCP] = useState(false);

    // Cargar datos guardados
    useEffect(() => {
        if (data?.profile) {
            const profile = data.profile;
            setFormData(prev => ({
                ...prev,
                firstName: profile.firstName || '',
                paternalLastName: profile.paternalLastName || '',
                maternalLastName: profile.maternalLastName || '',
                birthDate: profile.birthDate || '',
                nationality: profile.nationality || '',
                nationalityCode: profile.nationalityCode || '',
                phone: profile.phone || '',
                email: profile.email || prev.email,
                curp: profile.curp || '',
                postalCode: profile.postalCode || '',
                state: profile.state || '',
                city: profile.city || '',
                colony: profile.colony || '',
                address: profile.address || '',
            }));
        }
    }, [data]);

    // Consultar SEPOMEX cuando el CP tenga 5 dígitos
    const handlePostalCodeBlur = async () => {
        if (formData.postalCode.length !== 5) return;

        // Validar formato
        if (!/^\d{5}$/.test(formData.postalCode)) {
            setErrors(prev => ({ ...prev, postalCode: 'CP debe tener 5 dígitos numéricos' }));
            return;
        }

        const cp = formData.postalCode;

        // Revisar cache primero
        if (sepomexCache.has(cp)) {
            const cached = sepomexCache.get(cp);
            setFormData(prev => ({
                ...prev,
                state: cached.state,
                city: cached.municipality
            }));
            showToast('Datos cargados desde cache', 'success');
            return;
        }

        setIsLoadingCP(true);
        setErrors(prev => ({ ...prev, postalCode: '' }));

        try {
            // Llamar a nuestra API que usa SEPOMEX oficial (query param)
            const response = await fetch(`/api/sepomex?cp=${cp}`);
            const result = await response.json();

            if (result.success) {
                // Guardar en cache
                sepomexCache.set(cp, result.data);
                
                setFormData(prev => ({
                    ...prev,
                    state: result.data.state,
                    city: result.data.municipality
                }));
                
                showToast(
                    result.fromCache 
                        ? 'Datos cargados desde cache' 
                        : 'Datos obtenidos de SEPOMEX', 
                    'success'
                );
            } else {
                // Si no encuentra, mostrar error pero no bloquear
                setErrors(prev => ({ 
                    ...prev, 
                    postalCode: 'CP no encontrado. Verifica e ingresa manualmente.' 
                }));
                showToast('CP no encontrado en SEPOMEX', 'warning');
                
                // Limpiar campos para que el usuario llene manualmente
                setFormData(prev => ({
                    ...prev,
                    state: '',
                    city: ''
                }));
            }
        } catch (error) {
            console.error('Error consultando CP:', error);
            
            // Detectar si es error 404 (ruta no encontrada - necesita reiniciar servidor)
            const is404 = String(error).includes('404') || String(error).includes('Failed to fetch');
            
            if (is404) {
                setErrors(prev => ({ 
                    ...prev, 
                    postalCode: 'Servicio no disponible. Reinicia el servidor (Ctrl+C → npm run dev)' 
                }));
                showToast('Endpoint no encontrado. Reinicia el servidor de desarrollo.', 'error');
            } else {
                setErrors(prev => ({ 
                    ...prev, 
                    postalCode: 'Error al consultar CP. Ingresa manualmente.' 
                }));
                showToast('Error al consultar CP. Intenta de nuevo.', 'error');
            }
        } finally {
            setIsLoadingCP(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'Requerido';
        if (!formData.paternalLastName.trim()) newErrors.paternalLastName = 'Requerido';
        if (!formData.maternalLastName.trim()) newErrors.maternalLastName = 'Requerido';
        if (!formData.birthDate) newErrors.birthDate = 'Requerido';
        if (!formData.nationality) newErrors.nationality = 'Requerido';
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Teléfono inválido';
        if (!formData.curp || formData.curp.length !== 18) newErrors.curp = 'CURP inválida';
        if (!formData.postalCode || formData.postalCode.length !== 5) newErrors.postalCode = 'CP inválido';
        if (!formData.colony.trim()) newErrors.colony = 'Requerido';
        if (!formData.address.trim()) newErrors.address = 'Requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Completa todos los campos requeridos', 'error');
            return;
        }

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        await onNext(formData);
        setIsLoading(false);
    };

    return (
        <div className={styles.stepCard}>
            <div className={styles.header}>
                <span className={styles.stepBadge}>Paso 1 de 2 post-pago</span>
                <h2 className={styles.title}>Completa tu perfil</h2>
                <p className={styles.subtitle}>
                    Necesitamos estos datos para activar tu membresía
                </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Datos personales</h3>
                    
                    <TextInput
                        label="Nombre"
                        name="firstName"
                        value={formData.firstName}
                        onChange={(value) => setFormData({ ...formData, firstName: value })}
                        error={errors.firstName}
                        required
                    />

                    <TextInput
                        label="Apellido paterno"
                        name="paternalLastName"
                        value={formData.paternalLastName}
                        onChange={(value) => setFormData({ ...formData, paternalLastName: value })}
                        error={errors.paternalLastName}
                        required
                    />

                    <TextInput
                        label="Apellido materno"
                        name="maternalLastName"
                        value={formData.maternalLastName}
                        onChange={(value) => setFormData({ ...formData, maternalLastName: value })}
                        error={errors.maternalLastName}
                        required
                    />

                    <DatePicker
                        label="Fecha de nacimiento"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={(value) => setFormData({ ...formData, birthDate: value })}
                        error={errors.birthDate}
                        required
                    />

                    <NationalitySelect
                        value={formData.nationality}
                        onChange={(value, code) => setFormData({ 
                            ...formData, 
                            nationality: value, 
                            nationalityCode: code 
                        })}
                        error={errors.nationality}
                        required
                    />

                    <TextInput
                        label="CURP"
                        name="curp"
                        value={formData.curp}
                        onChange={(value) => setFormData({ ...formData, curp: value.toUpperCase() })}
                        placeholder="ABCD123456HDFRNN09"
                        error={errors.curp}
                        required
                        maxLength={18}
                    />
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Contacto</h3>
                    
                    <PhoneInput
                        label="Teléfono"
                        name="phone"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        error={errors.phone}
                        required
                    />

                    <TextInput
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        value={formData.email}
                        readOnly
                    />
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Dirección</h3>
                    
                    <div className={styles.postalCodeRow}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <TextInput
                                label="Código Postal"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={(value) => {
                                    const cleanValue = value.replace(/\D/g, '').slice(0, 5);
                                    setFormData({ ...formData, postalCode: cleanValue });
                                    // Limpiar error al escribir
                                    if (errors.postalCode) {
                                        setErrors({ ...errors, postalCode: '' });
                                    }
                                }}
                                onBlur={handlePostalCodeBlur}
                                placeholder="Ej: 01000"
                                error={errors.postalCode}
                                required
                                maxLength={5}
                            />
                            {isLoadingCP && (
                                <span style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '2.8rem',
                                    fontSize: '0.8rem',
                                    color: '#718096'
                                }}>
                                    🔍 Buscando...
                                </span>
                            )}
                        </div>
                    </div>

                    <TextInput
                        label="Estado"
                        name="state"
                        value={formData.state}
                        onChange={(value) => setFormData({ ...formData, state: value })}
                        placeholder="Autocompletado o ingresa manual"
                        readOnly={!!formData.state && !errors.postalCode}
                    />

                    <TextInput
                        label="Municipio/Alcaldía"
                        name="city"
                        value={formData.city}
                        onChange={(value) => setFormData({ ...formData, city: value })}
                        placeholder="Autocompletado o ingresa manual"
                        readOnly={!!formData.city && !errors.postalCode}
                    />

                    <TextInput
                        label="Colonia"
                        name="colony"
                        value={formData.colony}
                        onChange={(value) => setFormData({ ...formData, colony: value })}
                        placeholder="Ej: Centro, San Rafael..."
                        error={errors.colony}
                        required
                    />

                    <TextInput
                        label="Calle y número"
                        name="address"
                        value={formData.address}
                        onChange={(value) => setFormData({ ...formData, address: value })}
                        placeholder="Ej: Av. Insurgentes Sur 1234, Depto 502"
                        error={errors.address}
                        required
                    />
                </div>

                {/* Info de SEPOMEX */}
                <div style={{
                    background: '#F7FAFC',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#718096',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span>ℹ️</span>
                    <span>
                        Los datos de dirección se obtienen de la API oficial de SEPOMEX (Gobierno de México).
                        Si el CP no se encuentra, puedes ingresar los datos manualmente.
                    </span>
                </div>

                <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={isLoading}
                >
                    {isLoading ? 'Guardando...' : 'Continuar →'}
                </button>
            </form>
        </div>
    );
}
