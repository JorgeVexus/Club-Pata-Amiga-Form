'use client';

import React, { useState } from 'react';
import styles from './RejectionModal.module.css';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    memberName: string;
}

export default function RejectionModal({ isOpen, onClose, onConfirm, memberName }: RejectionModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!reason.trim()) return;

        try {
            setIsSubmitting(true);
            await onConfirm(reason);
            setReason(''); // Reset on success
            onClose();
        } catch (error) {
            console.error('Error submitting rejection:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Rechazar Solicitud</h2>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <p className={styles.warningText}>
                        Estás a punto de rechazar la solicitud de <strong>{memberName}</strong>.
                        Esta acción es irreversible y se notificará al usuario.
                    </p>

                    <label className={styles.label}>
                        Motivo del rechazo (Obligatorio)
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explica claramente por qué se rechaza la solicitud (ej. Documentos ilegibles, perro de raza no permitida, falta foto...)"
                        maxLength={500}
                        autoFocus
                    />
                    <span className={styles.charCount}>
                        {reason.length}/500 caracteres
                    </span>
                </div>

                <div className={styles.footer}>
                    <button
                        className={`${styles.button} ${styles.cancelButton}`}
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        className={`${styles.button} ${styles.confirmButton}`}
                        onClick={handleSubmit}
                        disabled={!reason.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Rechazando...' : 'Confirmar Rechazo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
