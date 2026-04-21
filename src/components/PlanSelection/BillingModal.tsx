'use client';

import React, { useState } from 'react';
import styles from './PlanSelection.module.css';
import { validateRFC, formatRFC } from '@/utils/rfc-validator';

interface BillingDetails {
    rfc: string;
    businessName: string;
    fiscalAddress: string;
    taxRegime: string;
    cfdiUse: string;
    email: string;
    taxCertificate: File | null;
}

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: BillingDetails) => void;
}

export default function BillingModal({ isOpen, onClose, onSave }: BillingModalProps) {
    const [details, setDetails] = useState<BillingDetails>({
        rfc: '',
        businessName: '',
        fiscalAddress: '',
        taxRegime: '',
        cfdiUse: '',
        email: '',
        taxCertificate: null,
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
        setDetails({ ...details, rfc: formatted, taxRegime: '' });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = validateRFC(details.rfc);
        if (!result.isValid) {
            setRfcError(result.error || 'RFC inválido');
            return;
        }
        
        setIsSubmitting(true);
        onSave(details);
        setIsSubmitting(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDetails({ ...details, taxCertificate: e.target.files[0] });
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Datos para facturar 📄</h2>
                    <button className={styles.modalClose} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    <p className={styles.modalDescription}>
                        Por favor, ingresa tus datos fiscales tal como aparecen en tu Constancia de Situación Fiscal.
                    </p>
                    <form id="billing-form" onSubmit={handleSubmit} className={styles.billingForm}>
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
                            <label>Dirección Fiscal *</label>
                            <textarea
                                required
                                value={details.fiscalAddress}
                                onChange={(e) => setDetails({ ...details, fiscalAddress: e.target.value })}
                                placeholder="Calle, Número, Col, CP, Ciudad, Estado"
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
                                <option value="">{rfcType ? 'Selecciona...' : 'Ingresa un RFC válido primero...'}</option>
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
                                <option value="">Selecciona...</option>
                                <option value="G01">Adquisición de mercancías</option>
                                <option value="G03">Gastos en general</option>
                                <option value="S01">Sin efectos fiscales</option>
                                <option value="CP01">Pagos</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Correo electrónico de facturación *</label>
                            <input
                                type="email"
                                required
                                value={details.email}
                                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Constancia de Situación Fiscal (PDF) *</label>
                            <div className={styles.fileUploadArea}>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    id="tax-cert-upload"
                                />
                                <label htmlFor="tax-cert-upload">
                                    {details.taxCertificate ? `✅ ${details.taxCertificate.name}` : '📁 Subir constancia'}
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ borderTop: 'none', padding: '1rem 0 0 0' }}>
                            <button type="submit" className={styles.modalCloseBtn} style={{ width: '100%', maxWidth: 'none', margin: 0 }} disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : 'Guardar datos'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
