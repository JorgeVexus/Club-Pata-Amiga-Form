'use client';

import React, { useState } from 'react';
import styles from './PlanSelection.module.css';

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
        setDetails({ ...details, rfc: upperVal, taxRegime: '' });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rfcError || !rfcType) return;
        
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
