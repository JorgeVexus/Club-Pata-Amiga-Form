'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './AmbassadorDetailModal.module.css';
import { adminFetch } from '@/utils/admin-fetch';
import { Ambassador, Referral, AmbassadorPayout, AmbassadorMessage } from '@/types/ambassador.types';

interface AmbassadorDetailModalProps {
    ambassador: Ambassador;
    initialTab?: 'info' | 'referrals' | 'payouts' | 'chat';
    onClose: () => void;
    onRefresh: () => void;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseClient = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const DEFAULT_AVATAR_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <rect width="60" height="60" rx="12" fill="rgba(255,255,255,0.2)"/>
        <circle cx="30" cy="23" r="10" fill="rgba(255,255,255,0.8)"/>
        <path d="M13 49c3-12 10-18 17-18s14 6 17 18" fill="rgba(255,255,255,0.8)"/>
    </svg>
`)}`;

export default function AmbassadorDetailModal({
    ambassador,
    initialTab,
    onClose,
    onRefresh
}: AmbassadorDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'referrals' | 'payouts' | 'chat'>(initialTab || 'info');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [payouts, setPayouts] = useState<AmbassadorPayout[]>([]);
    const [loading, setLoading] = useState(false);
    const [fullDetails, setFullDetails] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<AmbassadorMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [sendingChat, setSendingChat] = useState(false);
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadDetails();
    }, [ambassador.id]);

    const amb = fullDetails || ambassador;

    const loadChatMessages = async () => {
        setChatLoading(true);
        try {
            const response = await adminFetch(`/api/ambassadors/${ambassador.id}/messages?markReadFor=admin`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setChatMessages(data);
            }
        } catch (error) {
            console.error('Error loading chat messages:', error);
        } finally {
            setChatLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'chat' && amb.status === 'approved') {
            loadChatMessages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, ambassador.id]);

    useEffect(() => {
        if (amb.status !== 'approved' || !supabaseClient) return;

        const channel = supabaseClient
            .channel(`ambassador-chat-${ambassador.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ambassador_messages',
                    filter: `ambassador_id=eq.${ambassador.id}`
                },
                (payload) => {
                    const newMessage = payload.new as AmbassadorMessage;
                    setChatMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
                }
            )
            .subscribe();

        return () => {
            supabaseClient.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ambassador.id, amb.status]);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSendChatMessage = async () => {
        const trimmed = chatInput.trim();
        if (!trimmed || sendingChat) return;

        setSendingChat(true);
        try {
            const response = await adminFetch(`/api/ambassadors/${ambassador.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderRole: 'admin', message: trimmed })
            });

            if (response.ok) {
                const newMessage = await response.json();
                setChatMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
                setChatInput('');
            } else {
                const err = await response.json();
                alert('Error: ' + (err.error || 'No se pudo enviar el mensaje'));
            }
        } catch (error) {
            console.error('Error sending chat message:', error);
            alert('Error de conexión al enviar el mensaje');
        } finally {
            setSendingChat(false);
        }
    };

    const loadDetails = async () => {
        setLoading(true);
        try {
            const response = await adminFetch(`/api/ambassadors/${ambassador.id}`);
            const data = await response.json();
            if (data.success) {
                console.log('🔍 Ambassador data loaded:', data.data);
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
            const response = await adminFetch(`/api/ambassadors/${ambassador.id}`, {
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
            const response = await adminFetch(`/api/ambassadors/${ambassador.id}`, {
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

            const response = await adminFetch(`/api/referrals/${referralId}`, {
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
            const response = await adminFetch(`/api/payouts/${payoutId}`, {
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
            suspended: styles.statusSuspended,
            cancelled: styles.statusCancelled
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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerMain}>
                        {amb.profile_photo_url ? (
                            <img
                                src={amb.profile_photo_url}
                                alt={`${amb.first_name} ${amb.paternal_surname}`}
                                className={styles.avatarPhoto}
                            />
                        ) : (
                            <img
                                src={DEFAULT_AVATAR_PLACEHOLDER}
                                alt="Sin foto de perfil"
                                className={styles.avatarPhoto}
                            />
                        )}
                        <div>
                            <h2 className={styles.name}>
                                {amb.first_name} {amb.paternal_surname} {amb.maternal_surname || ''}
                            </h2>
                            <div className={styles.subtitle}>
                                <span className={`${styles.statusBadge} ${getStatusClass(amb.status)}`}>
                                    {amb.status === 'pending' ? 'Pendiente' :
                                        amb.status === 'approved' ? 'Aprobado' :
                                            amb.status === 'rejected' ? 'Rechazado' :
                                                amb.status === 'cancelled' ? 'Cancelado' : 'Suspendido'}
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
                    {amb.status === 'approved' && (
                        <button
                            className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            💬 Chat
                        </button>
                    )}
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
                                <div className={styles.infoRow}>
                                    <span>Ciudad de nacimiento:</span>
                                    <span>{amb.birth_city || 'No especificada'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Fecha de registro:</span>
                                    <span>{amb.created_at ? formatDate(amb.created_at) : 'No especificada'}</span>
                                </div>
                                {amb.status === 'cancelled' && amb.cancelled_at && (
                                    <div className={styles.infoRow}>
                                        <span>Fecha de baja:</span>
                                        <span>{formatDate(amb.cancelled_at)}</span>
                                    </div>
                                )}
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
                                {!amb.instagram && !amb.facebook && !amb.tiktok && (
                                    <div className={styles.infoRow}>
                                        <span>No especificadas</span>
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
                            
                            {amb.status === 'cancelled' && (
                                <div className={`${styles.section} ${styles.fullWidth} ${styles.cancelledSection}`}>
                                    <h4>⚪ Cuenta Cancelada / Dada de Baja</h4>
                                    <p>Este embajador solicitó su baja voluntaria del programa{amb.cancelled_at ? ` el ${formatDate(amb.cancelled_at)}` : ''}.</p>
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
                    ) : activeTab === 'payouts' ? (
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
                    ) : (
                        <div className={styles.chatContainer}>
                            <div className={styles.chatMessages} ref={chatMessagesRef}>
                                {chatLoading ? (
                                    <div className={styles.loading}>Cargando mensajes...</div>
                                ) : chatMessages.length === 0 ? (
                                    <div className={styles.chatEmpty}>Aún no hay mensajes con este embajador.</div>
                                ) : (
                                    chatMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`${styles.chatBubble} ${msg.sender_role === 'admin' ? styles.chatBubbleAdmin : styles.chatBubbleAmbassador}`}
                                        >
                                            <p className={styles.chatBubbleText}>{msg.message}</p>
                                            <span className={styles.chatBubbleTime}>
                                                {new Date(msg.created_at).toLocaleString('es-MX', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className={styles.chatInputRow}>
                                <input
                                    type="text"
                                    className={styles.chatInput}
                                    placeholder="Escribe un mensaje..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSendChatMessage();
                                    }}
                                    disabled={sendingChat}
                                />
                                <button
                                    className={styles.chatSendBtn}
                                    onClick={handleSendChatMessage}
                                    disabled={sendingChat || !chatInput.trim()}
                                >
                                    Enviar
                                </button>
                            </div>
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
