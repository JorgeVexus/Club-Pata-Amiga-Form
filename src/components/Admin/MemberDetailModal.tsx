'use client';

import React, { useState, useEffect } from 'react';
import styles from './MemberDetailModal.module.css';
import { getPetsByUserId, getBillingDetailsByMemberstackId, getUserDataByMemberstackId } from '@/app/actions/user.actions';

interface Pet {
    id: string;
    name: string;
    breed: string;
    gender?: string;
    age_value?: string | number;
    age_unit?: string;
    pet_type?: string;
    status: 'pending' | 'approved' | 'action_required' | 'rejected' | 'appealed';
    admin_notes?: string;
    photo_url?: string;
    photo2_url?: string;
    photo3_url?: string;
    photo4_url?: string;
    photo5_url?: string;
    vet_certificate_url?: string;
    coat_color?: string;
    nose_color?: string;
    nose_color_code?: string;
    eye_color?: string;
    eye_color_code?: string;
    is_mixed_breed?: boolean;
    is_adopted?: boolean;
    adoption_story?: string;
    is_senior?: boolean;
    waiting_period_end?: string | null;
    created_at: string;
}

interface AppealLog {
    id: string;
    user_id: string;
    admin_id?: string;
    admin_name: string;
    type: 'user_appeal' | 'admin_request' | 'user_update' | 'system';
    message: string;
    created_at: string;
    formatted_date: string;
}

interface MemberDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: any; // Using any for flexibility with MemberStack data structure
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    showAppealSection?: boolean; // Solo muestra la sección de apelación si viene del menú de Apelaciones
    selectedPetId?: string | null; // Para filtrar a una sola mascota en apelaciones
    isSuperAdmin?: boolean; // 🆕 Solo SuperAdmin puede ver apelaciones
    onDataChange?: () => void; // 🆕 Callback para refrescar datos en el padre
}

export default function MemberDetailModal({ isOpen, onClose, member, onApprove, onReject, showAppealSection = false, selectedPetId, isSuperAdmin = false, onDataChange }: MemberDetailModalProps) {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loadingPets, setLoadingPets] = useState(false);
    const [updatingPetId, setUpdatingPetId] = useState<string | null>(null);
    const [petNotes, setPetNotes] = useState<Record<string, string>>({});
    const [petMessages, setPetMessages] = useState<Record<string, string>>({});  // 🆕 Mensaje de respuesta por mascota
    const [petLogs, setPetLogs] = useState<Record<string, AppealLog[]>>({});      // 🆕 Logs por mascota
    const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({}); // 🆕 Loading state por mascota
    const [appealLogs, setAppealLogs] = useState<AppealLog[]>([]);
    const [isRefunding, setIsRefunding] = useState(false);
    const [refundDone, setRefundDone] = useState(false);
    const [billingDetails, setBillingDetails] = useState<any>(null);
    const [loadingBilling, setLoadingBilling] = useState(false);
    const [supabaseUser, setSupabaseUser] = useState<any>(null);
    const [loadingSupabase, setLoadingSupabase] = useState(false);
    // 🆕 Estado para solicitudes de información
    const [showRequestUI, setShowRequestUI] = useState<Record<string, boolean>>({});
    const [selectedRequests, setSelectedRequests] = useState<Record<string, string[]>>({});
    const [requestCustomMsg, setRequestCustomMsg] = useState<Record<string, string>>({});
    const [sendingRequest, setSendingRequest] = useState<Record<string, boolean>>({});
    const [stripeDetails, setStripeDetails] = useState<any>(null);
    const [loadingStripe, setLoadingStripe] = useState(false);

    useEffect(() => {
        if (isOpen && member) {
            loadPets();
            loadSupabaseUserData();
            loadBillingDetails();
            loadStripeDetails();
        }
    }, [isOpen, member]);

    async function loadSupabaseUserData() {
        setLoadingSupabase(true);
        try {
            const result = await getUserDataByMemberstackId(member.id);
            if (result.success) {
                setSupabaseUser(result.userData);
            }
        } catch (error) {
            console.error('Error loading supabase user data:', error);
        } finally {
            setLoadingSupabase(false);
        }
    }

    async function loadBillingDetails() {
        setLoadingBilling(true);
        try {
            const result = await getBillingDetailsByMemberstackId(member.id);
            if (result.success) {
                setBillingDetails(result.billingDetails);
            }
        } catch (error) {
            console.error('Error loading billing details:', error);
        } finally {
            setLoadingBilling(false);
        }
    }

    async function loadStripeDetails() {
        setLoadingStripe(true);
        try {
            const res = await fetch(`/api/admin/members/${member.id}/stripe-details`);
            const data = await res.json();
            if (data.success) {
                setStripeDetails(data.stripeData);
            }
        } catch (error) {
            console.error('Error loading stripe details:', error);
        } finally {
            setLoadingStripe(false);
        }
    }

    async function loadPets() {
        setLoadingPets(true);
        try {
            const result = await getPetsByUserId(member.id);
            if (result.success && result.pets) {
                setPets(result.pets);
                // Inicializar notas
                const notes: Record<string, string> = {};
                result.pets.forEach((p: any) => {
                    notes[p.id] = p.admin_notes || '';
                });
                setPetNotes(notes);
            }
        } catch (error) {
            console.error('Error loading pets:', error);
        } finally {
            setLoadingPets(false);
        }
    }

    // 🆕 Cargar logs de apelación para una mascota específica (con Toggle)
    async function loadPetAppealLogs(petId: string) {
        if (petLogs[petId]) {
            // Toggle off
            const newLogs = { ...petLogs };
            delete newLogs[petId];
            setPetLogs(newLogs);
            return;
        }

        setLoadingLogs(prev => ({ ...prev, [petId]: true }));
        try {
            const res = await fetch(`/api/admin/members/${member.id}/appeal-logs?petId=${petId}`);
            const data = await res.json();
            if (data.success && data.logs) {
                setPetLogs(prev => ({ ...prev, [petId]: data.logs }));
            }
        } catch (error) {
            console.error(`Error loading appeal logs for pet ${petId}:`, error);
        } finally {
            setLoadingLogs(prev => ({ ...prev, [petId]: false }));
        }
    }

    // 🆕 Cerrar historial de una mascota
    function closePetHistory(petId: string) {
        const newLogs = { ...petLogs };
        delete newLogs[petId];
        setPetLogs(newLogs);
    }

    // 🆕 Enviar mensaje de respuesta a una mascota específica
    async function sendPetResponse(petId: string) {
        const msg = petMessages[petId];
        if (!msg?.trim()) {
            alert('Escribe un mensaje primero.');
            return;
        }

        try {
            const res = await fetch(`/api/admin/members/${member.id}/appeal-response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    petId: petId,
                    adminId: 'current_admin'
                })
            });
            if (res.ok) {
                alert('Mensaje enviado.');
                setPetMessages(prev => ({ ...prev, [petId]: '' }));
                loadPetAppealLogs(petId); // Recargar historial de esta mascota
                loadPets(); // Recargar para ver el nuevo status
            } else {
                const err = await res.json();
                alert('Error: ' + (err.error || 'Error al enviar'));
            }
        } catch (e) {
            alert('Error de conexión.');
        }
    }

    // 🆕 Toggle un tipo de solicitud para una mascota
    function toggleRequestType(petId: string, type: string) {
        setSelectedRequests(prev => {
            const current = prev[petId] || [];
            if (current.includes(type)) {
                return { ...prev, [petId]: current.filter(t => t !== type) };
            }
            return { ...prev, [petId]: [...current, type] };
        });
    }

    // 🆕 Enviar solicitud de información
    async function sendInfoRequest(petId: string) {
        const types = selectedRequests[petId] || [];
        if (types.length === 0) {
            alert('Selecciona al menos un tipo de información a solicitar.');
            return;
        }

        setSendingRequest(prev => ({ ...prev, [petId]: true }));
        try {
            const res = await fetch(`/api/admin/members/${member.id}/request-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    petId,
                    requestTypes: types,
                    customMessage: requestCustomMsg[petId]?.trim() || null,
                    adminId: 'current_admin'
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`✅ Solicitud enviada: ${data.message}`);
                // Limpiar UI
                setSelectedRequests(prev => ({ ...prev, [petId]: [] }));
                setRequestCustomMsg(prev => ({ ...prev, [petId]: '' }));
                setShowRequestUI(prev => ({ ...prev, [petId]: false }));
                // Recargar datos
                loadPetAppealLogs(petId);
                loadPets();
                if (onDataChange) onDataChange();
            } else {
                alert('Error: ' + (data.error || 'Error al enviar'));
            }
        } catch (e) {
            alert('Error de conexión.');
        } finally {
            setSendingRequest(prev => ({ ...prev, [petId]: false }));
        }
    }

    async function handlePetStatusUpdate(petId: string, status: string) {
        // Validación: Motivo de rechazo obligatorio
        if ((status === 'rejected' || status === 'action_required') && (!petNotes[petId] || !petNotes[petId].trim())) {
            alert('⚠️ Debes escribir una nota explicando el motivo (Rechazo o Solicitud de Info).');
            return;
        }

        setUpdatingPetId(petId);
        try {
            const response = await fetch(`/api/admin/members/${member.id}/pets/${petId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    adminNotes: petNotes[petId],
                    adminId: 'current_admin' // TODO: Get from auth
                })
            });

            const data = await response.json();
            if (data.success) {
                // Actualizar localmente
                setPets(prev => prev.map(p => p.id === petId ? { ...p, status: status as any, admin_notes: petNotes[petId] } : p));
                alert(`Mascota actualizada a ${status}`);
                if (onDataChange) onDataChange(); // Notificar al padre
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error updating pet:', error);
            alert('Error de conexión');
        } finally {
            setUpdatingPetId(null);
        }
    }

    // Refund handler
    async function handleRefund() {
        if (!confirm('¿Estás seguro de reembolsar el pago de este miembro? Esta acción no se puede deshacer.')) return;
        setIsRefunding(true);
        try {
            const response = await fetch(`/api/admin/members/${member.id}/refund`, {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                setRefundDone(true);
                alert(`✅ ${data.message}`);
                if (onDataChange) onDataChange();
            } else {
                alert('❌ Error: ' + (data.error || 'Intenta de nuevo'));
            }
        } catch (error) {
            console.error('Refund error:', error);
            alert('Error de conexión al procesar el reembolso.');
        } finally {
            setIsRefunding(false);
        }
    }

    if (!isOpen || !member) return null;

    const fields = member.customFields || {};

    // Force download handler
    const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
        e.preventDefault();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab if fetch fails (e.g. CORS)
            window.open(url, '_blank');
        }
    };

    // 🆕 Helper to render content with links as buttons
    const renderMessageContent = (message: string) => {
        const urlRegex = /(https?:\/\/[^\s)]+)/g;
        const matches = message.match(urlRegex);

        if (!matches) return <p className={styles.historyMessage}>{message}</p>;

        // Clean message from URLs for the text part
        let cleanText = message;
        matches.forEach(url => {
            cleanText = cleanText.replace(`(${url})`, '').replace(url, '');
        });

        return (
            <div className={styles.messageWithLinks}>
                <p className={styles.historyMessage}>{cleanText.trim()}</p>
                <div className={styles.messageLinks}>
                    {matches.map((url, i) => (
                        <div key={i} className={styles.docActionMini}>
                            <a href={url} target="_blank" rel="noopener noreferrer" className={styles.miniDocBtn}>
                                👁️ Ver Archivo
                            </a>
                            <a 
                                href="#" 
                                onClick={(e) => handleDownload(e, url, `documento-${i}`)} 
                                className={styles.miniDocBtn}
                                style={{ background: '#f8fafc' }}
                            >
                                📥 Descargar
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Detalles de la Solicitud</h2>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Appeal Info Banner (solo info básica, formularios están dentro de cada mascota) */}
                    {showAppealSection && fields['approval-status'] === 'appealed' && (
                        <div className={`${styles.section} ${styles.appealSection}`}>
                            <h3 className={styles.sectionTitle}>📩 Apelación Recibida</h3>
                            <div className={styles.appealContent}>
                                <p className={styles.appealMessage}>Mensaje del usuario: "{fields['appeal-message'] || 'Sin mensaje registrado.'}"</p>
                                <span className={styles.appealDate}>
                                    Fecha: {fields['appealed-at'] ? new Date(fields['appealed-at']).toLocaleDateString() : 'Desconocida'}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px', fontStyle: 'italic' }}>
                                💡 Responde a cada mascota individualmente en su tarjeta de abajo.
                            </p>
                        </div>
                    )}

                    {/* Personal Info */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Información Personal</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <span className={styles.label}>Nombre Completo</span>
                                <span className={styles.value}>
                                    {fields['first-name'] || supabaseUser?.first_name || '-'} {fields['paternal-last-name'] || supabaseUser?.last_name || ''} {fields['maternal-last-name'] || supabaseUser?.mother_last_name || ''}
                                </span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Fecha de Nacimiento</span>
                                <span className={styles.value}>{fields['birth-date'] || supabaseUser?.birth_date || '-'}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>CURP</span>
                                <span className={styles.value}>{fields['curp'] || supabaseUser?.curp || '-'}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Nacionalidad</span>
                                <span className={styles.value}>
                                    {supabaseUser?.nationality ? `${supabaseUser.nationality} (${supabaseUser.nationality_code || ''})` : (fields['nationality'] || '-')}
                                </span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Correo Electrónico</span>
                                <span className={styles.value}>{member.auth?.email || member.email || supabaseUser?.email || '-'}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Teléfono</span>
                                <span className={styles.value}>{fields['phone'] || supabaseUser?.phone || '-'}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Fecha de Registro</span>
                                <span className={styles.value}>
                                    {fields['registration-date'] ? new Date(fields['registration-date']).toLocaleDateString('es-MX', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : supabaseUser?.created_at ? new Date(supabaseUser.created_at).toLocaleDateString('es-MX', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Membership Details */}
                    <div className={styles.section} style={{ background: '#F8FAFC', borderLeft: '4px solid #7DD8D5' }}>
                        <h3 className={styles.sectionTitle}>Detalles de Membresía 💳</h3>
                        <div className={styles.grid}>
                            {(() => {
                                const plan = member.planConnections?.[0];
                                if (!plan) return <p className={styles.noBilling}>No se detectaron planes activos en Memberstack.</p>;

                                // 1. Fecha de Activación (Memberstack createdAt)
                                const activationDate = plan.createdAt ? new Date(plan.createdAt) : null;
                                const activationDateFormatted = activationDate ? activationDate.toLocaleDateString('es-MX', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                }) : '-';

                                // 2. Lógica Dinámica de Próxima Renovación
                                const isAnual = stripeDetails?.subscription?.interval === 'anual' || plan.planName?.toLowerCase().includes('anual');
                                let finalRenewalDate: Date | null = null;

                                // Prioridad 1: Stripe (Directo del API)
                                if (stripeDetails?.subscription?.currentPeriodEnd) {
                                    finalRenewalDate = new Date(stripeDetails.subscription.currentPeriodEnd);
                                }
                                // Prioridad 2: Memberstack (Sync previo)
                                else if (plan.currentPeriodEnd) {
                                    finalRenewalDate = typeof plan.currentPeriodEnd === 'number' 
                                        ? new Date(plan.currentPeriodEnd * 1000) 
                                        : new Date(plan.currentPeriodEnd);
                                }
                                // Prioridad 3: Cálculo basado en Último Pago
                                else if (stripeDetails?.payments?.length > 0) {
                                    const lastPayment = new Date(stripeDetails.payments[0].date);
                                    finalRenewalDate = new Date(lastPayment);
                                    if (isAnual) finalRenewalDate.setFullYear(finalRenewalDate.getFullYear() + 1);
                                    else finalRenewalDate.setMonth(finalRenewalDate.getMonth() + 1);
                                }
                                // Prioridad 4: Cálculo basado en Fecha de Activación
                                else if (activationDate) {
                                    finalRenewalDate = new Date(activationDate);
                                    if (isAnual) finalRenewalDate.setFullYear(finalRenewalDate.getFullYear() + 1);
                                    else finalRenewalDate.setMonth(finalRenewalDate.getMonth() + 1);
                                }

                                const renewalDateFormatted = finalRenewalDate ? finalRenewalDate.toLocaleDateString('es-MX', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                }) : '-';

                                return (
                                    <>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Plan Actual</span>
                                            <span className={styles.value} style={{ fontWeight: 700, color: '#0088BD' }}>
                                                {plan.planName || plan.planId || 'Membresía Activa'}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Frecuencia de Pago</span>
                                            <span className={styles.value} style={{ textTransform: 'capitalize' }}>
                                                {isAnual ? 'Anual' : 'Mensual'}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Estado de Pago</span>
                                            <span className={`${styles.paymentStatus} ${styles[plan.status?.toLowerCase() || 'none']}`}>
                                                {plan.status || 'Desconocido'}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Fecha de Activación</span>
                                            <span className={styles.value}>{activationDateFormatted}</span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Próxima Renovación</span>
                                            <span className={styles.value} style={{ fontWeight: 600 }}>
                                                {renewalDateFormatted}
                                            </span>
                                        </div>
                                        {stripeDetails?.payments?.length > 0 && (
                                            <div className={styles.field}>
                                                <span className={styles.label}>Último Pago</span>
                                                <span className={styles.value}>
                                                    {new Date(stripeDetails.payments[0].date).toLocaleDateString('es-MX', {
                                                        day: '2-digit',
                                                        month: 'long'
                                                    })} - ${stripeDetails.payments[0].amount.toFixed(2)} {stripeDetails.payments[0].currency}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Stripe Payment History Table */}
                        {stripeDetails?.payments?.length > 0 && (
                            <div className={styles.paymentHistory}>
                                <h4 className={styles.subSectionTitle}>Historial de Pagos Recientes</h4>
                                <div className={styles.paymentTableWrapper}>
                                    <table className={styles.paymentTable}>
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Monto</th>
                                                <th>Estado</th>
                                                <th>Factura</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stripeDetails.payments.map((p: any) => (
                                                <tr key={p.id}>
                                                    <td>{new Date(p.date).toLocaleDateString('es-MX')}</td>
                                                    <td style={{ fontWeight: 600 }}>${p.amount.toFixed(2)} {p.currency}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${p.status === 'succeeded' ? styles.statusSucceeded : ''}`}>
                                                            {p.status === 'succeeded' ? 'Pagado' : p.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {p.pdf ? (
                                                            <a href={p.pdf} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                                                                📄 PDF
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Dirección</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <span className={styles.label}>Colonia</span>
                                <span className={styles.value}>{fields['colony'] || supabaseUser?.colony || '-'}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Ciudad/Estado</span>
                                <span className={styles.value}>{(fields['city'] || supabaseUser?.city || '')}, {(fields['state'] || supabaseUser?.state || '')}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Código Postal</span>
                                <span className={styles.value}>{fields['postal-code'] || supabaseUser?.postal_code || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Billing Details */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Datos de Facturación 📄
                            {loadingBilling && <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>(Cargando...)</span>}
                        </h3>
                        {!loadingBilling && billingDetails ? (
                            <div className={styles.billingContainer}>
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <span className={styles.label}>RFC</span>
                                        <span className={styles.value} style={{ fontWeight: 700 }}>{billingDetails.rfc}</span>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.label}>Nombre/Razón Social</span>
                                        <span className={styles.value}>{billingDetails.business_name}</span>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.label}>Correo de Facturación</span>
                                        <span className={styles.value}>{billingDetails.email}</span>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.label}>Uso de CFDI</span>
                                        <span className={styles.value}>{billingDetails.cfdi_use}</span>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.label}>Régimen Fiscal</span>
                                        <span className={styles.value}>{billingDetails.tax_regime}</span>
                                    </div>
                                </div>
                                <div className={styles.field} style={{ marginTop: '1rem' }}>
                                    <span className={styles.label}>Dirección Fiscal</span>
                                    <span className={styles.value}>{billingDetails.fiscal_address}</span>
                                </div>

                                {billingDetails.tax_certificate_url && (
                                    <div className={styles.documentCard} style={{ marginTop: '1.25rem', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                                        <span className={styles.documentIcon}>📄</span>
                                        <div className={styles.documentInfo}>
                                            <div className={styles.documentName}>Constancia de Situación Fiscal</div>
                                            <div className={styles.docDesc}>Archivo oficial subido por el miembro</div>
                                        </div>
                                        <div className={styles.docActions}>
                                            <a href={billingDetails.tax_certificate_url} target="_blank" rel="noopener noreferrer" className={styles.viewDocButton}>Ver</a>
                                            <a
                                                href="#"
                                                onClick={(e) => handleDownload(e, billingDetails.tax_certificate_url, `constancia-${billingDetails.rfc}`)}
                                                className={styles.viewDocButton}
                                            >
                                                Descargar
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : !loadingBilling ? (
                            <div className={styles.noBilling}>
                                <p>Este miembro no ha registrado datos de facturación.</p>
                            </div>
                        ) : null}
                    </div>


                    {/* Pets */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            {selectedPetId ? 'Mascota en Apelación' : `Mascotas Registradas (${pets.length})`}
                        </h3>
                        {loadingPets ? (
                            <div className={styles.loading}>Cargando mascotas...</div>
                        ) : (
                            <div className={styles.grid}>
                                 {(selectedPetId ? pets.filter(p => p.id === selectedPetId) : pets).map((pet) => {
                                    const pIdx = pets.indexOf(pet) + 1;
                                    const mainPhoto = pet.photo_url || fields[`pet-${pIdx}-photo-1-url`];

                                    return (
                                        <div key={pet.id} className={styles.petCardFull}>
                                            <div className={styles.petHeader}>
                                                <div className={styles.petAvatar}>
                                                    {mainPhoto && mainPhoto.startsWith('http') ? (
                                                        <img 
                                                            src={mainPhoto} 
                                                            alt={pet.name} 
                                                            className={styles.petAvatarImage}
                                                        />
                                                    ) : (
                                                        pet.pet_type === 'cat' ? '🐱' : '🐶'
                                                    )}
                                                </div>
                                                <div className={styles.petInfo}>
                                                    <h4>{pet.name}</h4>
                                                    <div className={styles.petBreed}>
                                                        {pet.is_mixed_breed 
                                                            ? (pet.pet_type === 'cat' ? 'Doméstico' : 'Mestizo') 
                                                            : pet.breed}
                                                    </div>
                                                </div>
                                                <div className={`${styles.statusBadge} ${styles[pet.status]}`}>
                                                    {pet.status === 'pending' ? 'Pendiente' :
                                                        pet.status === 'approved' ? 'Aprobada' :
                                                            pet.status === 'rejected' ? 'Rechazada' :
                                                                pet.status === 'appealed' ? '⚖️ Apelada' : 'Acción Requerida'}
                                                </div>
                                            </div>

                                        {/* Pet Badges */}
                                        <div className={styles.petBadges}>
                                            {pet.is_adopted && <span className={`${styles.petBadge} ${styles.adopted}`}>🏠 Adoptado</span>}
                                            {pet.is_mixed_breed && (
                                                <span className={`${styles.petBadge} ${styles.mixed}`}>
                                                    🔀 {pet.pet_type === 'cat' ? 'Doméstico' : 'Mestizo'}
                                                </span>
                                            )}
                                            {pet.is_senior && <span className={`${styles.petBadge} ${styles.senior}`}>👴 Senior</span>}
                                        </div>

                                        {/* Pet Details Grid */}
                                        <div className={styles.detailsGrid}>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>🎂 Edad</span>
                                                <span className={styles.detailValue}>
                                                    {pet.age_value ? `${pet.age_value} ${pet.age_unit === 'months' ? 'meses' : 'años'}` : 'No especificada'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>⚧ Sexo</span>
                                                <span className={styles.detailValue}>
                                                    {pet.gender === 'macho' ? '♂ Macho' : pet.gender === 'hembra' ? '♀ Hembra' : 'No especificado'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>🎨 Color pelo</span>
                                                <span className={styles.detailValue}>{pet.coat_color || '---'}</span>
                                            </div>
                                            {pet.nose_color && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>👃 Nariz</span>
                                                    <span className={styles.detailValue}>{pet.nose_color}</span>
                                                </div>
                                            )}
                                            {pet.eye_color && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>👁️ Ojos</span>
                                                    <span className={styles.detailValue}>{pet.eye_color}</span>
                                                </div>
                                            )}

                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>🧬 Tipo</span>
                                                <span className={styles.detailValue}>
                                                    {pet.pet_type === 'cat' ? 'Gato' : pet.pet_type === 'dog' ? 'Perro' : pet.pet_type || 'No especificado'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>📅 Registro</span>
                                                <span className={styles.detailValue}>
                                                    {new Date(pet.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            {pet.waiting_period_end && (
                                                <div className={styles.detailRow} style={{ gridColumn: 'span 2' }}>
                                                    <span className={styles.detailLabel}>🚀 Activación de beneficios</span>
                                                    <span className={styles.detailValue} style={{ color: '#0088BD', fontWeight: 600 }}>
                                                        {new Date(pet.waiting_period_end).toLocaleDateString('es-MX', { 
                                                            day: '2-digit', 
                                                            month: 'long', 
                                                            year: 'numeric' 
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {pet.vet_certificate_url && (
                                                <div className={styles.detailRow} style={{ gridColumn: 'span 2' }}>
                                                    <span className={styles.detailLabel}>⚕️ Certificado Médico Senior</span>
                                                    <a 
                                                        href={pet.vet_certificate_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className={styles.viewDocButton}
                                                        style={{ display: 'inline-block', marginTop: '4px' }}
                                                    >
                                                        Descargar Certificado 📄
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Adoption Story */}
                                        {pet.adoption_story && (
                                            <div className={styles.adoptionStory}>
                                                <strong>📜 Historia de adopción:</strong>
                                                <p>{pet.adoption_story}</p>
                                            </div>
                                        )}

                                        {/* Mensaje de Apelación - Solo mostrar si la mascota está apelada */}
                                        {pet.status === 'appealed' && (pet as any).appeal_message && (
                                            <div style={{
                                                background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
                                                padding: '15px',
                                                borderRadius: '12px',
                                                marginBottom: '15px',
                                                border: '1px solid #CE93D8'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '18px' }}>⚖️</span>
                                                    <strong style={{ color: '#7B1FA2' }}>Mensaje de Apelación del Usuario:</strong>
                                                </div>
                                                <p style={{ margin: 0, color: '#4A148C', fontStyle: 'italic' }}>
                                                    "{(pet as any).appeal_message}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Pet Photo Section - Premium Editorial Layout */}
                                        <div className={styles.petPhotosSection}>
                                            <div className={styles.premiumGallery}>
                                                {(() => {
                                                    const pIdx = pets.indexOf(pet) + 1;
                                                    
                                                    // Collect all available photos from Supabase or Memberstack fallback
                                                    const photos = [
                                                        { url: pet.photo_url || fields[`pet-${pIdx}-photo-1-url`], id: 1 },
                                                        { url: pet.photo2_url || fields[`pet-${pIdx}-photo-2-url`], id: 2 },
                                                        { url: pet.photo3_url || fields[`pet-${pIdx}-photo-3-url`], id: 3 },
                                                        { url: pet.photo4_url || fields[`pet-${pIdx}-photo-4-url`], id: 4 },
                                                        { url: pet.photo5_url || fields[`pet-${pIdx}-photo-5-url`], id: 5 }
                                                    ].filter(p => p.url && p.url.startsWith('http'));

                                                    if (photos.length === 0) {
                                                        return (
                                                            <div className={styles.noPhotoPlaceholder}>
                                                                <span>📷 Sin fotos detectadas</span>
                                                                <p style={{ fontSize: '0.6rem', margin: '5px 0 0' }}>Sync Error o falta de archivos.</p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className={styles.editorialGrid}>
                                                            <div className={styles.mainPhotoWrapper}>
                                                                <img 
                                                                    src={photos[0].url} 
                                                                    alt="Principal" 
                                                                    className={styles.mainPhoto}
                                                                    onClick={() => window.open(photos[0].url, '_blank')}
                                                                />
                                                                <div className={styles.photoLabel}>FOTO PRINCIPAL</div>
                                                            </div>
                                                            {photos.length > 1 && (
                                                                <div className={styles.sidePhotos}>
                                                                    {photos.slice(1).map((photo, idx) => (
                                                                        <div key={idx} className={styles.sidePhotoWrapper}>
                                                                            <img 
                                                                                src={photo.url} 
                                                                                alt={`Foto ${photo.id}`} 
                                                                                className={styles.sidePhoto}
                                                                                onClick={() => window.open(photo.url, '_blank')}
                                                                            />
                                                                            <div className={styles.miniLabel}>#{photo.id}</div>
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Admin Actions per Pet */}
                                        <div className={styles.petAdminActions}>
                                            <div className={styles.notesField}>
                                                <label>Notas del Administrador:</label>
                                                <textarea
                                                    value={petNotes[pet.id] || ''}
                                                    onChange={(e) => setPetNotes({ ...petNotes, [pet.id]: e.target.value })}
                                                    placeholder="Razón del rechazo o info faltante..."
                                                    className={styles.notesInput}
                                                />
                                            </div>
                                            <div className={styles.petButtons}>
                                                {pet.status !== 'approved' && (
                                                    <button
                                                        className={styles.petApproveBtn}
                                                        onClick={() => handlePetStatusUpdate(pet.id, 'approved')}
                                                        disabled={updatingPetId === pet.id}
                                                    >
                                                        {updatingPetId === pet.id ? '...' : 'Aprobar'}
                                                    </button>
                                                )}
                                                {pet.status !== 'action_required' && (
                                                    <button
                                                        className={styles.petInfoBtn}
                                                        onClick={() => handlePetStatusUpdate(pet.id, 'action_required')}
                                                        disabled={updatingPetId === pet.id}
                                                    >
                                                        {updatingPetId === pet.id ? '...' : 'Solicitar Info'}
                                                    </button>
                                                )}
                                                {pet.status !== 'rejected' && (
                                                    <button
                                                        className={styles.petRejectBtn}
                                                        onClick={() => handlePetStatusUpdate(pet.id, 'rejected')}
                                                        disabled={updatingPetId === pet.id}
                                                    >
                                                        {updatingPetId === pet.id ? '...' : 'Rechazar'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* 🆕 Sección de Comunicación Mejorada por Mascota */}
                                            <div className={styles.petCommunicationSection}>
                                                    {/* Botones de acción */}
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                        <button
                                                            className={styles.loadHistoryBtn}
                                                            style={{ background: '#FE8F15', color: '#fff', border: '2px solid #000' }}
                                                            onClick={() => setShowRequestUI(prev => ({ ...prev, [pet.id]: !prev[pet.id] }))}
                                                        >
                                                            {showRequestUI[pet.id] ? '✕ Cerrar' : '📋 Solicitar Información'}
                                                        </button>
                                                        <button
                                                            className={styles.loadHistoryBtn}
                                                            onClick={() => loadPetAppealLogs(pet.id)}
                                                            style={{ 
                                                                background: petLogs[pet.id] ? '#f1f5f9' : '#fff',
                                                                borderColor: petLogs[pet.id] ? '#cbd5e1' : '#000'
                                                            }}
                                                        >
                                                            {loadingLogs[pet.id] ? '⏳ Cargando...' : petLogs[pet.id] ? '✕ Cerrar Historial' : '📜 Ver Historial'}
                                                        </button>
                                                    </div>

                                                    {/* Panel de Solicitud */}
                                                    {showRequestUI[pet.id] && (
                                                        <div style={{ background: '#FFFBF5', border: '2px solid #FEE4C4', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                                                            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.85rem', color: '#FE8F15', textTransform: 'uppercase' as const }}>Selecciona qué información necesitas:</p>
                                                            {[
                                                                { type: 'PET_PHOTO_1', label: '📸 Foto Principal', color: '#FE8F15' },
                                                                { type: 'PET_VET_CERT', label: '🏥 Certificado Médico', color: '#7DD8D5' },
                                                                { type: 'OTHER_DOC', label: '📄 Documento Adicional', color: '#A0AEC0' }
                                                            ].map(opt => (
                                                                <label key={opt.type} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', border: `2px solid ${(selectedRequests[pet.id] || []).includes(opt.type) ? opt.color : '#E2E8F0'}`, background: (selectedRequests[pet.id] || []).includes(opt.type) ? `${opt.color}15` : '#fff', cursor: 'pointer', marginBottom: '8px', fontWeight: (selectedRequests[pet.id] || []).includes(opt.type) ? 700 : 400, fontSize: '0.9rem' }}>
                                                                    <input type="checkbox" checked={(selectedRequests[pet.id] || []).includes(opt.type)} onChange={() => toggleRequestType(pet.id, opt.type)} style={{ width: '18px', height: '18px', accentColor: opt.color }} />
                                                                    {opt.label}
                                                                </label>
                                                            ))}
                                                            <textarea value={requestCustomMsg[pet.id] || ''} onChange={(e) => setRequestCustomMsg(prev => ({ ...prev, [pet.id]: e.target.value }))} placeholder="Mensaje adicional (opcional)..." className={styles.notesInput} rows={2} style={{ marginBottom: '12px' }} />
                                                            <button style={{ background: '#FE8F15', color: '#fff', border: '2px solid #000', borderRadius: '50px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: '0.9rem', opacity: sendingRequest[pet.id] ? 0.7 : 1 }} onClick={() => sendInfoRequest(pet.id)} disabled={sendingRequest[pet.id]}>
                                                                {sendingRequest[pet.id] ? '⏳ Enviando...' : '📩 Enviar Solicitud + Email'}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Chat libre */}
                                                    <div className={styles.petResponseForm}>
                                                        <label>💬 Mensaje directo:</label>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                                            <textarea value={petMessages[pet.id] || ''} onChange={(e) => setPetMessages({ ...petMessages, [pet.id]: e.target.value })} placeholder="Escribe un mensaje al miembro..." className={styles.notesInput} rows={2} style={{ flex: 1 }} />
                                                            <button className={styles.sendResponseBtn} onClick={() => sendPetResponse(pet.id)} style={{ whiteSpace: 'nowrap' }}>Enviar 📩</button>
                                                        </div>
                                                    </div>

                                                    {/* Historial */}
                                                    {petLogs[pet.id] && petLogs[pet.id].length > 0 && (
                                                        <div className={styles.historyContainer}>
                                                           <div className={styles.historyListHeader}>
                                                               <span>📜 Historial de Comunicación</span>
                                                               <button onClick={() => closePetHistory(pet.id)}>✕</button>
                                                           </div>
                                                           <div className={styles.historyList}>
                                                               {petLogs[pet.id].map((log) => (
                                                                   <div key={log.id} className={`${styles.historyItem} ${log.type.startsWith('user_') ? styles.userMessage : styles.adminMessage}`}>
                                                                       <div className={styles.historyHeader}>
                                                                           <span className={styles.historyAuthor}>{log.type.startsWith('user_') ? '👤 Usuario' : `🛡️ ${log.admin_name || 'Admin'}`}</span>
                                                                           <span className={styles.historyDate}>{log.formatted_date}</span>
                                                                       </div>
                                                                       {renderMessageContent(log.message)}
                                                                   </div>
                                                               ))}
                                                           </div>
                                                           <div className={styles.historyListFooter}>
                                                               <button onClick={() => closePetHistory(pet.id)}>Ocultar Historial</button>
                                                           </div>
                                                        </div>
                                                    )}
                                            </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    {fields['approval-status'] !== 'approved' && (
                        <>
                            <button
                                className={`${styles.actionButton} ${styles.approveButton}`}
                                onClick={() => onApprove(member.id)}
                            >
                                Aprobar Solicitud
                            </button>
                            <button
                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                onClick={() => onReject(member.id)}
                            >
                                Rechazar Solicitud
                            </button>
                        </>
                    )}
                    {fields['approval-status'] === 'rejected' && !refundDone && (
                        <button
                            className={`${styles.actionButton}`}
                            style={{
                                background: '#7c3aed',
                                color: 'white',
                                opacity: isRefunding ? 0.7 : 1,
                            }}
                            onClick={handleRefund}
                            disabled={isRefunding}
                        >
                            {isRefunding ? '⏳ Procesando...' : '💳 Reembolsar Pago'}
                        </button>
                    )}
                    {refundDone && (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                        }}>
                            ✅ Pago reembolsado
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
