'use client';

import React, { useState } from 'react';
import styles from './WellnessCenterDetailModal.module.css';
import { WellnessCenter } from '@/types/wellness.types';
import { adminFetch } from '@/utils/admin-fetch';

interface Props {
    center: WellnessCenter;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

type TabType = 'info' | 'location' | 'services';

export default function WellnessCenterDetailModal({ center, isOpen, onClose, onRefresh }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('info');

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
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2 className={styles.title}>Detalles del Aliado</h2>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </header>

                {!isRejecting && (
                    <nav className={styles.tabs}>
                        <button 
                            className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            Información
                        </button>
                        <button 
                            className={`${styles.tab} ${activeTab === 'location' ? styles.active : ''}`}
                            onClick={() => setActiveTab('location')}
                        >
                            Ubicación
                        </button>
                        <button 
                            className={`${styles.tab} ${activeTab === 'services' ? styles.active : ''}`}
                            onClick={() => setActiveTab('services')}
                        >
                            Servicios
                        </button>
                    </nav>
                )}

                <div className={styles.content}>
                    {!isRejecting ? (
                        <>
                            {activeTab === 'info' && (
                                <section className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Información General</h3>
                                    <div className={styles.grid}>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Establecimiento</span>
                                            <span className={styles.value}>{center.establishment_name}</span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Email de contacto</span>
                                            <span className={styles.value}>{center.email}</span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Estado Actual</span>
                                            <span className={`${styles.statusBadge} ${styles[center.status]}`}>
                                                {center.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Fecha de Registro</span>
                                            <span className={styles.value}>{new Date(center.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'location' && (
                                <section className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Ubicación y Área</h3>
                                    <div className={styles.locationContainer}>
                                        <p className={styles.address}>
                                            {center.address || 'No se proporcionó dirección física.'}
                                        </p>
                                        {(center.lat && center.lng) && (
                                            <div className={styles.coords}>
                                                Coordenadas: {center.lat}, {center.lng}
                                                <div style={{ marginTop: '10px' }}>
                                                    <a 
                                                        href={`https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#00BBB4', fontWeight: 600, textDecoration: 'underline' }}
                                                    >
                                                        📍 Ver en Google Maps
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {activeTab === 'services' && (
                                <>
                                    <section className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Servicios Ofrecidos</h3>
                                        <div className={styles.servicesContainer}>
                                            {center.services.map(s => (
                                                <span key={s} className={styles.serviceTag}>{s}</span>
                                            ))}
                                        </div>
                                    </section>

                                    {center.promotion_details && (
                                        <section className={styles.section}>
                                            <h3 className={styles.sectionTitle}>Detalles de Promoción</h3>
                                            <div className={styles.promotionBox}>
                                                {center.promotion_details}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Motivo del Rechazo</h3>
                            <div className={styles.rejectionForm}>
                                <label className={styles.label}>Selecciona un motivo predeterminado:</label>
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
                                        <label className={styles.label}>Detalles adicionales:</label>
                                        <textarea 
                                            className={styles.textarea}
                                            placeholder="Explica detalladamente el motivo del rechazo..."
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
                                        className={`${styles.actionButton} ${styles.approveButton}`} 
                                        onClick={() => handleAction('approve')}
                                        disabled={isSubmitting}
                                    >
                                        Aprobar Aliado
                                    </button>
                                    <button 
                                        className={`${styles.actionButton} ${styles.rejectButton}`} 
                                        onClick={() => handleAction('reject')}
                                        disabled={isSubmitting}
                                    >
                                        Rechazar
                                    </button>
                                </>
                            )}
                            <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={onClose}>Cerrar</button>
                        </>
                    ) : (
                        <>
                            <button 
                                className={`${styles.actionButton} ${styles.rejectButton}`} 
                                onClick={() => handleAction('reject')}
                                disabled={isSubmitting}
                            >
                                Confirmar Rechazo
                            </button>
                            <button 
                                className={`${styles.actionButton} ${styles.cancelButton}`} 
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
