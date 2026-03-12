'use client';

import React, { useState } from 'react';
import styles from './steps.module.css';

interface BillingData {
    rfc: string;
    businessName: string;
    fiscalAddress: string;
    taxRegime: string;
    cfdiUse: string;
    email: string;
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
        fiscalAddress: '',
        taxRegime: '',
        cfdiUse: '',
        email: initialEmail || '',
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
                        La constancia ya no es requerida, pero asegúrate de que los datos coincidan con ella.
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
                            <label>Código Postal y Dirección Fiscal *</label>
                            <textarea
                                required
                                value={details.fiscalAddress}
                                onChange={(e) => setDetails({ ...details, fiscalAddress: e.target.value })}
                                placeholder="CP, Calle, Número, Colonia, Ciudad, Estado"
                                rows={2}
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

                        <div className={styles.formGroup}>
                            <label>Correo electrónico para facturas *</label>
                            <input
                                type="email"
                                required
                                value={details.email}
                                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                placeholder="ejemplo@correo.com"
                            />
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
