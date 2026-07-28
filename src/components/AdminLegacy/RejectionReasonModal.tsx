'use client';

import React from 'react';
import styles from './RejectionModal.module.css'; // Reutilizamos estilos

interface RejectionReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    rejectionReason: string;
    rejectedBy: string;
    rejectedAt: string;
    memberName: string;
}

export default function RejectionReasonModal({
    isOpen,
    onClose,
    rejectionReason,
    rejectedBy,
    rejectedAt,
    memberName
}: RejectionReasonModalProps) {
    if (!isOpen) return null;

    const formattedDate = new Date(rejectedAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title} style={{ color: '#ef4444' }}>Solicitud Rechazada</h2>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <span className={styles.label}>Miembro</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{memberName}</div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <span className={styles.label}>Motivo del Rechazo</span>
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '1rem',
                            borderRadius: '8px',
                            color: '#991b1b',
                            lineHeight: '1.5'
                        }}>
                            {rejectionReason || 'No se especificó una razón.'}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <span className={styles.label}>Rechazado por</span>
                            <div className={styles.value}>{rejectedBy}</div>
                        </div>
                        <div>
                            <span className={styles.label}>Fecha</span>
                            <div className={styles.value}>{formattedDate !== 'Invalid Date' ? formattedDate : 'Fecha no disponible'}</div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        className={`${styles.button} ${styles.cancelButton}`}
                        onClick={onClose}
                        style={{ width: '100%' }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
