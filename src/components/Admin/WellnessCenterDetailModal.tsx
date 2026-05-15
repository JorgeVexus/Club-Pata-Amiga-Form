'use client';

import React, { useState } from 'react';
import styles from './MemberDetailModal.module.css';
import { WellnessCenter } from '@/types/wellness.types';
import { adminFetch } from '@/utils/admin-fetch';

interface Props {
    center: WellnessCenter;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export default function WellnessCenterDetailModal({ center, isOpen, onClose, onRefresh }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    if (!isOpen) return null;

    const rejectionPresets = [
        'Falta de documentación oficial',
        'Servicios no compatibles con Pata Amiga',
        'Ubicación fuera de área de cobertura',
        'Inconsistencia en la información proporcionada'
    ];

    const handleAction = async (action: 'approve' | 'reject') => {
        let reason = '';
        if (action === 'reject') {
            if (!isRejecting) {
                setIsRejecting(true);
                return;
            }
            reason = selectedReason === 'Otro' ? customReason : (selectedReason || customReason);
            if (!reason) {
                alert('Por favor selecciona o escribe un motivo');
                return;
            }
        } else {
            if (!confirm('¿Aprobar este aliado?')) return;
        }

        setIsSubmitting(true);
        try {
            const response = await adminFetch(`/api/admin/wellness/${center.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: action === 'approve' ? 'approved' : 'rejected',
                    rejection_reason: reason
                })
            });

            if (response.ok) {
                alert(`Aliado ${action === 'approve' ? 'aprobado' : 'rechazado'}`);
                onRefresh();
                onClose();
            } else {
                alert('Error al procesar la acción');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>Detalles del Aliado</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </header>

                <div className={styles.body}>
                    {!isRejecting ? (
                        <>
                            <section className={styles.section}>
                                <h3>Información General</h3>
                                <div className={styles.grid}>
                                    <div className={styles.infoItem}>
                                        <label>Establecimiento</label>
                                        <span>{center.establishment_name}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <label>Email</label>
                                        <span>{center.email}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <label>Estado Actual</label>
                                        <span className={`${styles.statusBadge} ${styles[center.status]}`}>
                                            {center.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h3>Servicios Ofrecidos</h3>
                                <div className={styles.tagsContainer}>
                                    {center.services.map(s => (
                                        <span key={s} className={styles.tag}>{s}</span>
                                    ))}
                                </div>
                            </section>

                            {center.address && (
                                <section className={styles.section}>
                                    <h3>Ubicación</h3>
                                    <p>{center.address}</p>
                                    {center.lat && center.lng && (
                                        <p className={styles.coords}>
                                            Lat: {center.lat} | Lng: {center.lng}
                                        </p>
                                    )}
                                </section>
                            )}

                            {center.promotion_details && (
                                <section className={styles.section}>
                                    <h3>Promoción</h3>
                                    <p className={styles.promotion}>{center.promotion_details}</p>
                                </section>
                            )}
                        </>
                    ) : (
                        <section className={styles.section}>
                            <h3>Motivo del Rechazo</h3>
                            <div className={styles.rejectionForm}>
                                <label>Selecciona un motivo predeterminado:</label>
                                <select 
                                    className={styles.select}
                                    value={selectedReason} 
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                >
                                    <option value="">-- Selecciona un motivo --</option>
                                    {rejectionPresets.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                    <option value="Otro">Otro (especificar abajo)</option>
                                </select>

                                {(selectedReason === 'Otro' || !selectedReason) && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <label>Detalles adicionales:</label>
                                        <textarea 
                                            className={styles.textarea}
                                            placeholder="Explica el motivo del rechazo..."
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                <footer className={styles.footer}>
                    {!isRejecting ? (
                        <>
                            {center.status === 'pending' && (
                                <>
                                    <button 
                                        className={styles.approveButton} 
                                        onClick={() => handleAction('approve')}
                                        disabled={isSubmitting}
                                    >
                                        Aprobar Aliado
                                    </button>
                                    <button 
                                        className={styles.rejectButton} 
                                        onClick={() => handleAction('reject')}
                                        disabled={isSubmitting}
                                    >
                                        Rechazar
                                    </button>
                                </>
                            )}
                            <button className={styles.cancelButton} onClick={onClose}>Cerrar</button>
                        </>
                    ) : (
                        <>
                            <button 
                                className={styles.rejectButton} 
                                onClick={() => handleAction('reject')}
                                disabled={isSubmitting}
                            >
                                Confirmar Rechazo
                            </button>
                            <button 
                                className={styles.cancelButton} 
                                onClick={() => setIsRejecting(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
}
