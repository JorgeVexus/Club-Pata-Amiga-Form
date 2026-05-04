'use client';

import React, { useState, useEffect } from 'react';
import styles from './BillingModal.module.css';

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: any) => void;
    initialEmail?: string;
}

export default function BillingModal({ isOpen, onClose, onSave, initialEmail }: BillingModalProps) {
    const [formData, setFormData] = useState({
        rfc: '',
        razonSocial: '',
        regimenFiscal: '',
        cp: '',
        emailFacturacion: initialEmail || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isMoral, setIsMoral] = useState(false);

    useEffect(() => {
        if (initialEmail && !formData.emailFacturacion) {
            setFormData(prev => ({ ...prev, emailFacturacion: initialEmail }));
        }
    }, [initialEmail]);

    // Detectar si es persona moral por longitud de RFC
    useEffect(() => {
        if (formData.rfc.length === 12) setIsMoral(true);
        else if (formData.rfc.length === 13) setIsMoral(false);
    }, [formData.rfc]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.rfc || (formData.rfc.length !== 12 && formData.rfc.length !== 13)) {
            newErrors.rfc = 'RFC debe tener 12 o 13 caracteres';
        }
        if (!formData.razonSocial) newErrors.razonSocial = 'Requerido';
        if (!formData.regimenFiscal) newErrors.regimenFiscal = 'Requerido';
        if (!formData.cp || formData.cp.length !== 5) newErrors.cp = 'CP inválido';
        if (!formData.emailFacturacion) newErrors.emailFacturacion = 'Requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Datos de Facturación</h3>
                    <button className={styles.modalClose} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.modalDescription}>
                        Ingresa los datos fiscales tal como aparecen en tu Constancia de Situación Fiscal.
                    </p>

                    <form onSubmit={handleSubmit} className={styles.billingForm}>
                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}>
                                <label>RFC</label>
                                {formData.rfc.length >= 12 && (
                                    <span className={`${styles.typeBadge} ${isMoral ? styles.typeBadgeMoral : ''}`}>
                                        {isMoral ? 'Persona Moral' : 'Persona Física'}
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="XAXX010101000"
                                className={styles.inputField}
                                value={formData.rfc}
                                onChange={e => setFormData(prev => ({ ...prev, rfc: e.target.value.toUpperCase().trim() }))}
                                maxLength={13}
                            />
                            {errors.rfc && <span className={styles.errorText}>{errors.rfc}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}><label>Nombre o Razón Social</label></div>
                            <input
                                type="text"
                                placeholder="Como aparece en el SAT"
                                className={styles.inputField}
                                value={formData.razonSocial}
                                onChange={e => setFormData(prev => ({ ...prev, razonSocial: e.target.value.toUpperCase() }))}
                            />
                            {errors.razonSocial && <span className={styles.errorText}>{errors.razonSocial}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}><label>Régimen Fiscal</label></div>
                            <select
                                className={styles.selectField}
                                value={formData.regimenFiscal}
                                onChange={e => setFormData(prev => ({ ...prev, regimenFiscal: e.target.value }))}
                            >
                                <option value="">Selecciona una opción</option>
                                <option value="601">601 - General de Ley Personas Morales</option>
                                <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                                <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                                <option value="606">606 - Arrendamiento</option>
                                <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                                <option value="621">621 - Incorporación Fiscal</option>
                                <option value="625">625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                                <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                            </select>
                            {errors.regimenFiscal && <span className={styles.errorText}>{errors.regimenFiscal}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}><label>C.P.</label></div>
                            <input
                                type="text"
                                placeholder="00000"
                                className={styles.inputField}
                                value={formData.cp}
                                onChange={e => setFormData(prev => ({ ...prev, cp: e.target.value.replace(/\D/g, '') }))}
                                maxLength={5}
                            />
                            {errors.cp && <span className={styles.errorText}>{errors.cp}</span>}
                        </div>
                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}><label>Email de envío</label></div>
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                className={styles.inputField}
                                value={formData.emailFacturacion}
                                onChange={e => setFormData(prev => ({ ...prev, emailFacturacion: e.target.value.toLowerCase() }))}
                            />
                            {errors.emailFacturacion && <span className={styles.errorText}>{errors.emailFacturacion}</span>}
                        </div>

                        <div className={styles.buttonRow}>
                            <button type="button" className={styles.cancelButton} onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit" className={styles.saveButton}>
                                Guardar Datos
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
