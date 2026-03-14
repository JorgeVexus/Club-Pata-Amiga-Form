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
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                            <label>RFC *</label>
                            <input
                                type="text"
                                required
                                value={details.rfc}
                                onChange={(e) => setDetails({ ...details, rfc: e.target.value.toUpperCase() })}
                                placeholder="ABCD123456XYZ"
                                maxLength={13}
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
                            >
                                <option value="">Selecciona un régimen...</option>
                                <option value="601">General de Ley Personas Morales</option>
                                <option value="603">Personas Morales con Fines no Lucrativos</option>
                                <option value="605">Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                                <option value="606">Arrendamiento</option>
                                <option value="612">Personas Físicas con Actividades Empresariales y Profesionales</option>
                                <option value="626">Régimen Simplificado de Confianza (RESICO)</option>
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
