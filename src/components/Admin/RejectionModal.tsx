'use client';

import React, { useState } from 'react';
import styles from './RejectionModal.module.css';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    memberName: string;
}

const PRESET_REASONS = [
    { value: 'maltrato', label: 'Historial comprobado de maltrato o negligencia animal' },
    { value: 'incumplimiento-normas', label: 'Incumplimiento previo de normas de Pata Amiga' },
    { value: 'falta-docs', label: 'Falta de documentación veterinaria requerida' },
    { value: 'conducta-conflictiva', label: 'Conducta conflictiva, violenta o irrespetuosa del solicitante' },
    { value: 'info-falsa', label: 'Proporcionar información falsa o incompleta en la solicitud' },
    { value: 'impago', label: 'Incumplimiento de pagos o antecedentes financieros negativos con el club' },
    { value: 'uso-indebido', label: 'Uso indebido previo de instalaciones, servicios o beneficios de Pata Amiga' },
    { value: 'incompatibilidad-animal', label: 'Incompatibilidad del tipo de animal con las políticas de cobertura de Pata Amiga' },
    { value: 'violaciones-politicas', label: 'Violaciones anteriores a las políticas de Pata Amiga' },
    { value: 'uso-no-autorizado', label: 'Uso no autorizado de la membresía' },
    { value: 'quejas', label: 'Quejas reiteradas de otros miembros/centros de bienestar sobre el solicitante o su mascota' },
    { value: 'requisitos-elegibilidad', label: 'Incumplimiento de requisitos de edad, residencia o elegibilidad' }
];

const DEFAULT_PREFIX = 'El comité deliberó improcedente tu solicitud debido a ';

export default function RejectionModal({ isOpen, onClose, onConfirm, memberName }: RejectionModalProps) {
    const [reason, setReason] = useState(DEFAULT_PREFIX);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedPreset(val);
        if (val) {
            const preset = PRESET_REASONS.find(p => p.value === val);
            if (preset) {
                const formatted = `${DEFAULT_PREFIX}${preset.label.charAt(0).toLowerCase() + preset.label.slice(1)}.`;
                setReason(formatted);
            }
        } else {
            setReason(DEFAULT_PREFIX);
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim() || reason.trim() === DEFAULT_PREFIX.trim()) return;

        try {
            setIsSubmitting(true);
            await onConfirm(reason);
            setReason(DEFAULT_PREFIX); // Reset on success
            setSelectedPreset('');
            onClose();
        } catch (error) {
            console.error('Error submitting rejection:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setReason(DEFAULT_PREFIX);
        setSelectedPreset('');
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Rechazar Solicitud</h2>
                    <button className={styles.closeButton} onClick={handleCancel}>✕</button>
                </div>

                <div className={styles.content}>
                    <p className={styles.warningText}>
                        Estás a punto de rechazar la solicitud de <strong>{memberName}</strong>.
                        Esta acción es irreversible y se notificará al usuario.
                    </p>

                    <label className={styles.label}>
                        Motivo predeterminado
                    </label>
                    <select
                        className={styles.select}
                        value={selectedPreset}
                        onChange={handlePresetChange}
                    >
                        <option value="">-- Selecciona un motivo predeterminado --</option>
                        {PRESET_REASONS.map((preset) => (
                            <option key={preset.value} value={preset.value}>
                                {preset.label}
                            </option>
                        ))}
                    </select>

                    <label className={styles.label}>
                        Mensaje de rechazo (Obligatorio)
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explica claramente por qué se rechaza la solicitud..."
                        maxLength={1000}
                        autoFocus
                    />
                    <span className={styles.charCount}>
                        {reason.length}/1000 caracteres
                    </span>
                </div>

                <div className={styles.footer}>
                    <button
                        className={`${styles.button} ${styles.cancelButton}`}
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        className={`${styles.button} ${styles.confirmButton}`}
                        onClick={handleSubmit}
                        disabled={!reason.trim() || reason.trim() === DEFAULT_PREFIX.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Rechazando...' : 'Confirmar Rechazo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
