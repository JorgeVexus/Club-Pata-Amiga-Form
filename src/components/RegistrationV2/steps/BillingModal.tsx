'use client';

import React, { useState } from 'react';
import styles from './steps.module.css';

interface BillingData {
    rfc: string;
    businessName: string;
    zipCode: string;
    taxRegime: string;
    cfdiUse: string;
}

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: BillingData) => void;
    initialEmail?: string;
}

export default function BillingModal({ isOpen, onClose, onSave, initialEmail }: BillingModalProps) {
    const [details, setDetails] = useState<BillingData>({
        rfc: '',
        businessName: '',
        zipCode: '',
        taxRegime: '',
        cfdiUse: '',
    });
    const [rfcError, setRfcError] = useState('');
    const [rfcType, setRfcType] = useState<'physical' | 'moral' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const validateRFC = (rfc: string) => {
        const cleanRFC = rfc.trim().toUpperCase();
        if (!cleanRFC) {
            setRfcError('');
            setRfcType(null);
            return;
        }

        const FISICA_REGEX = /^[A-Z&]{4}[0-9]{6}[A-Z0-9]{3}$/;
        const MORAL_REGEX = /^[A-Z&]{3}[0-9]{6}[A-Z0-9]{3}$/;

        if (cleanRFC.length === 12) {
            if (MORAL_REGEX.test(cleanRFC)) {
                setRfcType('moral');
                setRfcError('');
            } else {
                setRfcType(null);
                setRfcError('Formato de RFC Persona Moral inválido');
            }
        } else if (cleanRFC.length === 13) {
            if (FISICA_REGEX.test(cleanRFC)) {
                setRfcType('physical');
                setRfcError('');
            } else {
                setRfcType(null);
                setRfcError('Formato de RFC Persona Física inválido');
            }
        } else {
            setRfcType(null);
            if (cleanRFC.length > 0) {
                setRfcError('El RFC debe tener 12 o 13 caracteres');
            } else {
                setRfcError('');
            }
        }
    };

    const handleRFCChange = (val: string) => {
        const upperVal = val.toUpperCase();
        setDetails({ ...details, rfc: upperVal, taxRegime: '' }); // Reset regime when RFC changes
        validateRFC(upperVal);
    };

    const allRegimes = [
        { id: '601', name: 'General de Ley Personas Morales', type: 'moral' },
        { id: '603', name: 'Personas Morales con Fines no Lucrativos', type: 'moral' },
        { id: '605', name: 'Sueldos y Salarios e Ingresos Asimilados a Salarios', type: 'physical' },
        { id: '606', name: 'Arrendamiento', type: 'physical' },
        { id: '612', name: 'Personas Físicas con Actividades Empresariales y Profesionales', type: 'physical' },
        { id: '626', name: 'Régimen Simplificado de Confianza (RESICO)', type: 'physical' },
    ];

    const filteredRegimes = rfcType 
        ? allRegimes.filter(r => r.type === rfcType)
        : allRegimes;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rfcError || !rfcType) return;
        
        setIsSubmitting(true);
        try {
            await onSave(details);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Datos de Facturación 📄</h2>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    <p style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem',
                        color: '#718096',
                        marginBottom: '1.5rem',
                        lineHeight: '1.5'
                    }}>
                        Ingresa tus datos fiscales para generar tus facturas correctamente.
                    </p>

                    <form onSubmit={handleSubmit} className={styles.billingForm}>
                        <div className={styles.formGroup}>
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                RFC *
                                {rfcType && (
                                    <span style={{ fontSize: '0.75rem', color: '#00BBB4', fontWeight: 'bold' }}>
                                        {rfcType === 'physical' ? 'PERSONA FÍSICA' : 'PERSONA MORAL'}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                required
                                value={details.rfc}
                                onChange={(e) => handleRFCChange(e.target.value)}
                                placeholder="ABCD123456XYZ"
                                maxLength={13}
                                style={{ borderColor: rfcError ? '#E53E3E' : (rfcType ? '#38A169' : '#E2E8F0') }}
                            />
                            {rfcError && <span style={{ color: '#E53E3E', fontSize: '0.75rem', marginTop: '4px' }}>{rfcError}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Nombre o Razón Social *</label>
                            <input
                                type="text"
                                required
                                value={details.businessName}
                                onChange={(e) => setDetails({ ...details, businessName: e.target.value })}
                                placeholder="Nombre completo o Empresa"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Código Postal (C.P.) *</label>
                            <input
                                type="text"
                                required
                                value={details.zipCode}
                                onChange={(e) => setDetails({ ...details, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                                placeholder="Ej. 12345"
                                maxLength={5}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Régimen Fiscal *</label>
                            <select
                                required
                                value={details.taxRegime}
                                onChange={(e) => setDetails({ ...details, taxRegime: e.target.value })}
                                disabled={!rfcType}
                            >
                                <option value="">{rfcType ? 'Selecciona un régimen...' : 'Ingresa un RFC válido primero...'}</option>
                                {filteredRegimes.map(regime => (
                                    <option key={regime.id} value={regime.id}>{regime.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Uso de CFDI *</label>
                            <select
                                required
                                value={details.cfdiUse}
                                onChange={(e) => setDetails({ ...details, cfdiUse: e.target.value })}
                            >
                                <option value="">Selecciona uso...</option>
                                <option value="G01">Adquisición de mercancías</option>
                                <option value="G03">Gastos en general</option>
                                <option value="S01">Sin efectos fiscales</option>
                                <option value="CP01">Pagos</option>
                            </select>
                        </div>



                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={onClose}
                                style={{ flex: 1, padding: '0.875rem' }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={styles.primaryButton}
                                disabled={isSubmitting}
                                style={{ flex: 2, padding: '0.875rem' }}
                            >
                                {isSubmitting ? 'Guardando...' : 'Guardar Datos Fiscales'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
