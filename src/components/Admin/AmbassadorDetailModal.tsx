'use client';

import React, { useState, useEffect } from 'react';
import styles from './AmbassadorDetailModal.module.css';
import { Ambassador, Referral, AmbassadorPayout } from '@/types/ambassador.types';

interface AmbassadorDetailModalProps {
    ambassador: Ambassador;
    onClose: () => void;
    onRefresh: () => void;
}

export default function AmbassadorDetailModal({
    ambassador,
    onClose,
    onRefresh
}: AmbassadorDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'referrals' | 'payouts'>('info');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [payouts, setPayouts] = useState<AmbassadorPayout[]>([]);
    const [loading, setLoading] = useState(false);
    const [fullDetails, setFullDetails] = useState<any>(null);

    useEffect(() => {
        loadDetails();
    }, [ambassador.id]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/ambassadors/${ambassador.id}`);
            const data = await response.json();
            if (data.success) {
                console.log('🔍 Ambassador data loaded:', data.data);
                console.log('🪪 INE Front URL:', data.data.ine_front_url);
                console.log('🪪 INE Back URL:', data.data.ine_back_url);
                setFullDetails(data.data);
                setReferrals(data.data.referrals || []);
                setPayouts(data.data.payouts || []);
            }
        } catch (error) {
            console.error('Error loading details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm('¿Aprobar este embajador?')) return;

        try {
            const response = await fetch(`/api/ambassadors/${ambassador.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' })
            });

            if (response.ok) {
                alert('Embajador aprobado');
                onRefresh();
                onClose();
            }
        } catch (error) {
            alert('Error al aprobar');
        }
    };

    const handleReject = async () => {
        const reason = prompt('Motivo del rechazo:');
        if (!reason) return;

        try {
            const response = await fetch(`/api/ambassadors/${ambassador.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
            });

            if (response.ok) {
                alert('Solicitud rechazada');
                onRefresh();
                onClose();
            }
        } catch (error) {
            alert('Error al rechazar');
        }
    };

    const handleUpdateReferral = async (referralId: string, currentAmount: number, isApproving: boolean = false) => {
        let newAmount = currentAmount;

        if (isApproving && currentAmount === 0) {
            const input = prompt('Ingresa el monto de la membresía para calcular la comisión:', '500');
            if (input === null) return;
            newAmount = parseFloat(input);
            if (isNaN(newAmount)) {
                alert('Monto inválido');
                return;
            }
        } else if (!isApproving) {
            const input = prompt('Editar monto de la membresía:', currentAmount.toString());
            if (input === null) return;
            newAmount = parseFloat(input);
            if (isNaN(newAmount)) {
                alert('Monto inválido');
                return;
            }
        }

        try {
            setLoading(true);
            const body: any = { membership_amount: newAmount };
            if (isApproving) {
                body.commission_status = 'approved';
            }

            const response = await fetch(`/api/referrals/${referralId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert(isApproving ? 'Comisión aprobada' : 'Monto actualizado');
                loadDetails(); // Recargar datos del modal
                onRefresh();   // Recargar tabla principal
            } else {
                const err = await response.json();
                alert('Error: ' + (err.error || 'No se pudo actualizar'));
            }
        } catch (error) {
            console.error('Error updating referral:', error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePayout = async (payoutId: string) => {
        const ref = prompt('Referencia de pago (opcional):');
        if (ref === null) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/payouts/${payoutId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'completed',
                    payment_reference: ref
                })
            });

            if (response.ok) {
                alert('Pago completado');
                loadDetails();
                onRefresh();
            }
        } catch (error) {
            alert('Error al completar pago');
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status: string) => {
        const map: Record<string, string> = {
            pending: styles.statusPending,
            approved: styles.statusApproved,
            rejected: styles.statusRejected,
            suspended: styles.statusSuspended
        };
        return map[status] || styles.statusPending;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const amb = fullDetails || ambassador;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerMain}>
                        <div className={styles.avatar}>
                            {amb.first_name[0]}{amb.paternal_surname[0]}
                        </div>
                        <div>
                            <h2 className={styles.name}>
                                {amb.first_name} {amb.paternal_surname} {amb.maternal_surname || ''}
                            </h2>
                            <div className={styles.subtitle}>
                                <span className={`${styles.statusBadge} ${getStatusClass(amb.status)}`}>
                                    {amb.status === 'pending' ? 'Pendiente' :
                                        amb.status === 'approved' ? 'Aprobado' :
                                            amb.status === 'rejected' ? 'Rechazado' : 'Suspendido'}
                                </span>
                                <span className={styles.code}>{amb.referral_code}</span>
                            </div>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{amb.commission_percentage}%</div>
                        <div className={styles.statLabel}>Comisión</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{fullDetails?.referrals_count || 0}</div>
                        <div className={styles.statLabel}>Referidos</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>${(amb.total_earnings || 0).toFixed(2)}</div>
                        <div className={styles.statLabel}>Ganancias Totales</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>${(amb.pending_payout || 0).toFixed(2)}</div>
                        <div className={styles.statLabel}>Pendiente Pago</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Información
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'referrals' ? styles.active : ''}`}
                        onClick={() => setActiveTab('referrals')}
                    >
                        Referidos ({referrals.length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'payouts' ? styles.active : ''}`}
                        onClick={() => setActiveTab('payouts')}
                    >
                        Pagos ({payouts.length})
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Cargando...</div>
                    ) : activeTab === 'info' ? (
                        <div className={styles.infoGrid}>
                            <div className={styles.section}>
                                <h4>📋 Datos Personales</h4>
                                <div className={styles.infoRow}>
                                    <span>Email:</span>
                                    <span>{amb.email}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Teléfono:</span>
                                    <span>{amb.phone || 'No especificado'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>CURP:</span>
                                    <span>{amb.curp}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Fecha de nacimiento:</span>
                                    <span>{amb.birth_date ? formatDate(amb.birth_date) : 'No especificada'}</span>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h4>📍 Dirección</h4>
                                <div className={styles.infoRow}>
                                    <span>Estado:</span>
                                    <span>{amb.state || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Ciudad:</span>
                                    <span>{amb.city || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Colonia:</span>
                                    <span>{amb.neighborhood || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>CP:</span>
                                    <span>{amb.postal_code || '-'}</span>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h4>🏦 Datos Bancarios</h4>
                                <div className={styles.infoRow}>
                                    <span>RFC:</span>
                                    <span>{amb.rfc || 'No especificado'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Método de pago:</span>
                                    <span>
                                        {amb.payment_method === 'card' ? 'Tarjeta' :
                                            amb.payment_method === 'clabe' ? 'CLABE' : 'Pendiente'}
                                    </span>
                                </div>
                                {amb.bank_name && (
                                    <div className={styles.infoRow}>
                                        <span>Banco:</span>
                                        <span>{amb.bank_name}</span>
                                    </div>
                                )}
                                {amb.clabe && (
                                    <div className={styles.infoRow}>
                                        <span>CLABE:</span>
                                        <span>****{amb.clabe.slice(-4)}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.section}>
                                <h4>📱 Redes Sociales</h4>
                                {amb.instagram && (
                                    <div className={styles.infoRow}>
                                        <span>Instagram:</span>
                                        <span>{amb.instagram}</span>
                                    </div>
                                )}
                                {amb.facebook && (
                                    <div className={styles.infoRow}>
                                        <span>Facebook:</span>
                                        <span>{amb.facebook}</span>
                                    </div>
                                )}
                                {amb.tiktok && (
                                    <div className={styles.infoRow}>
                                        <span>TikTok:</span>
                                        <span>{amb.tiktok}</span>
                                    </div>
                                )}
                            </div>

                            {amb.motivation && (
                                <div className={`${styles.section} ${styles.fullWidth}`}>
                                    <h4>💭 Motivación</h4>
                                    <p className={styles.motivation}>{amb.motivation}</p>
                                </div>
                            )}

                            {amb.status === 'rejected' && amb.rejection_reason && (
                                <div className={`${styles.section} ${styles.fullWidth} ${styles.rejectionSection}`}>
                                    <h4>❌ Motivo de Rechazo</h4>
                                    <p>{amb.rejection_reason}</p>
                                </div>
                            )}

                            {/* INE Documents */}
                            {(amb.ine_front_url || amb.ine_back_url) ? (
                                <div className={`${styles.section} ${styles.fullWidth}`}>
                                    <h4>🪪 Identificación Oficial (INE)</h4>
                                    <div className={styles.ineContainer}>
                                        {amb.ine_front_url ? (
                                            <div className={styles.ineImageWrapper}>
                                                <p className={styles.ineLabel}>Frente</p>
                                                <a
                                                    href={amb.ine_front_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.ineLink}
                                                >
                                                    <img
                                                        src={amb.ine_front_url}
                                                        alt="INE Frente"
                                                        className={styles.ineImage}
                                                        onError={(e) => {
                                                            console.error('❌ Error loading INE front image:', amb.ine_front_url);
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className={styles.ineImageWrapper}>
                                                <p className={styles.ineLabel}>Frente</p>
                                                <div className={styles.inePlaceholder}>No disponible</div>
                                            </div>
                                        )}
                                        {amb.ine_back_url ? (
                                            <div className={styles.ineImageWrapper}>
                                                <p className={styles.ineLabel}>Reverso</p>
                                                <a
                                                    href={amb.ine_back_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.ineLink}
                                                >
                                                    <img
                                                        src={amb.ine_back_url}
                                                        alt="INE Reverso"
                                                        className={styles.ineImage}
                                                        onError={(e) => {
                                                            console.error('❌ Error loading INE back image:', amb.ine_back_url);
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className={styles.ineImageWrapper}>
                                                <p className={styles.ineLabel}>Reverso</p>
                                                <div className={styles.inePlaceholder}>No disponible</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className={`${styles.section} ${styles.fullWidth} ${styles.noIneSection}`}>
                                    <h4>🪪 Identificación Oficial (INE)</h4>
                                    <p className={styles.noIneMessage}>⚠️ Este embajador no tiene INE subida</p>
                                    <p className={styles.debugInfo}>DEBUG: ine_front_url={amb.ine_front_url || 'null'}, ine_back_url={amb.ine_back_url || 'null'}</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'referrals' ? (
                        <div className={styles.referralsList}>
                            {referrals.length === 0 ? (
                                <div className={styles.empty}>
                                    <p>Aún no tiene referidos</p>
                                </div>
                            ) : (
                                referrals.map((ref) => (
                                    <div key={ref.id} className={styles.referralCard}>
                                        <div className={styles.referralInfo}>
                                            <div className={styles.referralName}>
                                                {ref.referred_user_name || 'Usuario'}
                                            </div>
                                            <div className={styles.referralEmail}>
                                                {ref.referred_user_email}
                                            </div>
                                        </div>
                                        <div className={styles.referralAmount}>
                                            <div className={styles.commission}>
                                                +${ref.commission_amount?.toFixed(2)}
                                            </div>
                                            <div className={styles.plan}>
                                                {ref.membership_plan || 'Membresía'}
                                            </div>
                                        </div>
                                        <div className={`${styles.commissionStatus} ${styles[ref.commission_status]}`}>
                                            {ref.commission_status === 'pending' ? 'Pendiente' :
                                                ref.commission_status === 'approved' ? 'Aprobada' :
                                                    ref.commission_status === 'paid' ? 'Pagada' : 'Cancelada'}
                                        </div>

                                        <div className={styles.referralActions}>
                                            {ref.commission_status === 'pending' && (
                                                <button
                                                    className={`${styles.btnAction} ${styles.btnApproveReferral}`}
                                                    onClick={() => handleUpdateReferral(ref.id, ref.membership_amount || 0, true)}
                                                    title="Aprobar Comisión"
                                                >
                                                    ✅
                                                </button>
                                            )}
                                            <button
                                                className={styles.btnAction}
                                                onClick={() => handleUpdateReferral(ref.id, ref.membership_amount || 0, false)}
                                                title="Editar Monto"
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className={styles.payoutsList}>
                            {payouts.length === 0 ? (
                                <div className={styles.empty}>
                                    <p>No hay pagos registrados</p>
                                </div>
                            ) : (
                                payouts.map((payout) => (
                                    <div key={payout.id} className={styles.payoutCard}>
                                        <div className={styles.payoutInfo}>
                                            <div className={styles.payoutAmount}>
                                                ${payout.amount.toFixed(2)}
                                            </div>
                                            <div className={styles.payoutDate}>
                                                {formatDate(payout.created_at)}
                                            </div>
                                        </div>
                                        <div className={`${styles.payoutStatus} ${styles[payout.status]}`}>
                                            {payout.status === 'pending' ? 'Pendiente' :
                                                payout.status === 'processing' ? 'Procesando' :
                                                    payout.status === 'completed' ? 'Completado' : 'Fallido'}
                                        </div>

                                        {payout.status === 'pending' && (
                                            <div className={styles.payoutActions}>
                                                <button
                                                    className={styles.btnCompletePayout}
                                                    onClick={() => handleCompletePayout(payout.id)}
                                                >
                                                    Pagar 💸
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {amb.status === 'pending' && (
                    <div className={styles.actions}>
                        <button className={styles.btnReject} onClick={handleReject}>
                            ❌ Rechazar
                        </button>
                        <button className={styles.btnApprove} onClick={handleApprove}>
                            ✅ Aprobar Embajador
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
