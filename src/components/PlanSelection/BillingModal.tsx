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
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // In a real app, we might upload the file here or pass it to the parent
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
                            <label>RFC *</label>
                            <input
                                type="text"
                                required
                                value={details.rfc}
                                onChange={(e) => setDetails({ ...details, rfc: e.target.value.toUpperCase() })}
                                placeholder="ABCD123456XYZ"
                            />
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
                            >
                                <option value="">Selecciona...</option>
                                <option value="601">General de Ley Personas Morales</option>
                                <option value="603">Personas Morales con Fines no Lucrativos</option>
                                <option value="605">Sueldos y Salarios</option>
                                <option value="606">Arrendamiento</option>
                                <option value="612">Actividades Empresariales y Profesionales</option>
                                <option value="626">RESICO</option>
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
