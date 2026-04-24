'use client';

import React, { useState } from 'react';
import styles from './steps.module.css';
import { validateRFC, formatRFC } from '@/utils/rfc-validator';

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

    const validateRFCLocal = (rfc: string) => {
        const cleanRFC = formatRFC(rfc);
        if (!cleanRFC) {
            setRfcError('');
            setRfcType(null);
            return;
        }

        const result = validateRFC(cleanRFC);
        
        // Always try to detect type based on length for better UX
        if (cleanRFC.length === 12) setRfcType('moral');
        else if (cleanRFC.length === 13) setRfcType('physical');
        else if (cleanRFC.length < 12) setRfcType(null);

        if (result.isValid) {
            setRfcType(result.type || null);
            setRfcError('');
        } else {
            // Only show error if length is at least the minimum for an RFC
            if (cleanRFC.length >= 12) {
                setRfcError(result.error || 'RFC inválido');
            } else {
                setRfcError('');
            }
        }
    };

    const handleRFCChange = (val: string) => {
        const formatted = formatRFC(val);
        setDetails({ ...details, rfc: formatted, taxRegime: '' }); // Reset regime when RFC changes
        validateRFCLocal(formatted);
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
        const result = validateRFC(details.rfc);
        if (!result.isValid) {
            setRfcError(result.error || 'RFC inválido');
            return;
        }
        
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
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                RFC *
                                {rfcType && (
                                    <span style={{ 
                                        fontSize: '0.65rem', 
                                        backgroundColor: rfcType === 'physical' ? '#EBF8FF' : '#F0FFF4',
                                        color: rfcType === 'physical' ? '#2B6CB0' : '#2F855A',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        border: `1px solid ${rfcType === 'physical' ? '#BEE3F8' : '#C6F6D5'}`
                                    }}>
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
                                style={{ 
                                    borderColor: rfcError ? '#E53E3E' : (details.rfc.length >= 12 && !rfcError ? '#38A169' : '#E2E8F0'),
                                    boxShadow: rfcError ? '0 0 0 1px #E53E3E' : (details.rfc.length >= 12 && !rfcError ? '0 0 0 1px #38A169' : 'none'),
                                    textTransform: 'uppercase'
                                }}
                            />
                            {rfcError && (
                                <span style={{ color: '#E53E3E', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                    {rfcError}
                                </span>
                            )}
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
