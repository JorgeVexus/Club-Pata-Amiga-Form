'use client';

import React, { useState, useEffect } from 'react';
import styles from './MemberDetailModal.module.css';
import { getPetsByUserId, getBillingDetailsByUserId } from '@/app/actions/user.actions';

interface Pet {
    id: string;
    name: string;
    breed: string;
    breed_size: string;
    age?: string;
    type?: string;
    status: 'pending' | 'approved' | 'action_required' | 'rejected' | 'appealed';
    admin_notes?: string;
    photo_url?: string;
    photo2_url?: string;
    vet_certificate_url?: string;
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

    useEffect(() => {
        if (isOpen && member) {
            loadPets();
            loadBillingDetails();
        }
    }, [isOpen, member]);

    async function loadBillingDetails() {
        setLoadingBilling(true);
        try {
            const result = await getBillingDetailsByUserId(member.id);
            if (result.success) {
                setBillingDetails(result.billingDetails);
            }
        } catch (error) {
            console.error('Error loading billing details:', error);
        } finally {
            setLoadingBilling(false);
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

    // 🆕 Cargar logs de apelación para una mascota específica
    async function loadPetAppealLogs(petId: string) {
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
                                <span className={styles.value}>{fields['first-name']} {fields['last-name']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Email</span>
                                <span className={styles.value}>{member.auth?.email}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Teléfono</span>
                                <span className={styles.value}>{fields['phone'] || 'No registrado'}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>CURP</span>
                                <span className={styles.value}>{fields['curp'] || 'No registrado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Dirección</h3>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <span className={styles.label}>Calle y Número</span>
                                <span className={styles.value}>{fields['address']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Colonia</span>
                                <span className={styles.value}>{fields['colony']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Ciudad/Estado</span>
                                <span className={styles.value}>{fields['city']}, {fields['state']}</span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Código Postal</span>
                                <span className={styles.value}>{fields['postal-code']}</span>
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

                    {/* Documents */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Documentos Personales</h3>
                        <div className={styles.grid}>
                            {fields['ine-front-url'] && (
                                <div className={styles.documentCard}>
                                    <span className={styles.documentIcon}>🆔</span>
                                    <div className={styles.documentInfo}>
                                        <div className={styles.documentName}>INE (Frente)</div>
                                    </div>
                                    <div className={styles.docActions}>
                                        <a href={fields['ine-front-url']} target="_blank" rel="noopener noreferrer" className={styles.viewDocButton}>Ver</a>
                                        <a
                                            href="#"
                                            onClick={(e) => handleDownload(e, fields['ine-front-url'], 'ine-frente')}
                                            className={styles.viewDocButton}
                                        >
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            )}
                            {fields['ine-back-url'] && (
                                <div className={styles.documentCard}>
                                    <span className={styles.documentIcon}>🆔</span>
                                    <div className={styles.documentInfo}>
                                        <div className={styles.documentName}>INE (Reverso)</div>
                                    </div>
                                    <div className={styles.docActions}>
                                        <a href={fields['ine-back-url']} target="_blank" rel="noopener noreferrer" className={styles.viewDocButton}>Ver</a>
                                        <a
                                            href="#"
                                            onClick={(e) => handleDownload(e, fields['ine-back-url'], 'ine-reverso')}
                                            className={styles.viewDocButton}
                                        >
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            )}
                            {fields['proof-of-address-url'] && (
                                <div className={styles.documentCard}>
                                    <span className={styles.documentIcon}>📄</span>
                                    <div className={styles.documentInfo}>
                                        <div className={styles.documentName}>Comprobante de Domicilio</div>
                                    </div>
                                    <div className={styles.docActions}>
                                        <a href={fields['proof-of-address-url']} target="_blank" rel="noopener noreferrer" className={styles.viewDocButton}>Ver</a>
                                        <a
                                            href="#"
                                            onClick={(e) => handleDownload(e, fields['proof-of-address-url'], 'comprobante-domicilio')}
                                            className={styles.viewDocButton}
                                        >
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                {(selectedPetId ? pets.filter(p => p.id === selectedPetId) : pets).map((pet) => (
                                    <div key={pet.id} className={styles.petCardFull}>
                                        <div className={styles.petHeader}>
                                            <div className={styles.petAvatar}>🐶</div>
                                            <div className={styles.petInfo}>
                                                <h4>{pet.name}</h4>
                                                <div className={styles.petBreed}>{pet.breed} • {pet.breed_size}</div>
                                            </div>
                                            <div className={`${styles.statusBadge} ${styles[pet.status]}`}>
                                                {pet.status === 'pending' ? 'Pendiente' :
                                                    pet.status === 'approved' ? 'Aprobada' :
                                                        pet.status === 'rejected' ? 'Rechazada' :
                                                            pet.status === 'appealed' ? '⚖️ Apelada' : 'Acción Requerida'}
                                            </div>
                                        </div>

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
                                        {/* Pet Photo Section */}
                                        <div className={styles.petPhotosSection}>
                                            <div className={styles.petPhotosGrid}>
                                                {/* Unified Photo Rendering Logic: Show Supabase photo OR Memberstack fallback per slot */}
                                                {(() => {
                                                    const pIdx = pets.indexOf(pet) + 1;
                                                    const msUrl1 = fields[`pet-${pIdx}-photo-1-url`];
                                                    const msUrl2 = fields[`pet-${pIdx}-photo-2-url`];

                                                    // Array of photos: [Photo 1, Photo 2]
                                                    // Each item: { url: string, source: 'Supabase' | 'Memberstack', index: number }
                                                    // Update: Use dedicated photo2_url field
                                                    const photosToShow = [
                                                        { url: pet.photo_url || msUrl1, source: pet.photo_url ? 'Supabase' : 'Memberstack', id: 1 },
                                                        { url: pet.photo2_url || msUrl2, source: pet.photo2_url ? 'Supabase' : 'Memberstack', id: 2 }
                                                    ].filter(p => p.url); // Only show if URL exists

                                                    if (photosToShow.length === 0) {
                                                        return (
                                                            <div className={styles.noPhotoPlaceholder}>
                                                                <span>📷 Sin fotos detectadas</span>
                                                                <p style={{ fontSize: '0.6rem', margin: '5px 0 0' }}>Sync Error o falta de archivos.</p>
                                                            </div>
                                                        );
                                                    }

                                                    return photosToShow.map((photo, idx) => (
                                                        <div key={idx} className={styles.petPhotoContainer}>
                                                            <img
                                                                src={photo.url}
                                                                alt={`${pet.name} - Foto ${photo.id}`}
                                                                className={styles.petThumb}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693991ad1e9e5d0b490f9020_animated-dog-image-0929.png';
                                                                    (e.target as HTMLImageElement).style.opacity = '0.5';
                                                                }}
                                                            />
                                                            <div className={styles.photoActions}>
                                                                <a href={photo.url} target="_blank" rel="noopener noreferrer">Ver #{photo.id}</a>
                                                                <a href="#" onClick={(e) => handleDownload(e, photo.url!, `${pet.name}-foto-${photo.id}`)}>Bajar</a>
                                                            </div>
                                                        </div>
                                                    ));
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

                                            {/* 🆕 Sección de Comunicación por Mascota (solo para rechazados y solo SuperAdmin) */}
                                            {isSuperAdmin && showAppealSection && (pet.status === 'rejected' || pet.status === 'action_required') && (
                                                <div className={styles.petCommunicationSection}>
                                                    {/* Mostrar última respuesta del admin si existe */}
                                                    {(pet as any).last_admin_response && (
                                                        <div className={styles.lastAdminResponse}>
                                                            <strong>📩 Último mensaje enviado:</strong>
                                                            <p>{(pet as any).last_admin_response}</p>
                                                        </div>
                                                    )}

                                                    {/* Formulario de respuesta */}
                                                    <div className={styles.petResponseForm}>
                                                        <label>💬 Responder sobre esta mascota:</label>
                                                        <textarea
                                                            value={petMessages[pet.id] || ''}
                                                            onChange={(e) => setPetMessages({ ...petMessages, [pet.id]: e.target.value })}
                                                            placeholder="Indica qué información falta o por qué se rechaza esta mascota..."
                                                            className={styles.notesInput}
                                                            rows={3}
                                                        />
                                                        <button
                                                            className={styles.sendResponseBtn}
                                                            onClick={() => sendPetResponse(pet.id)}
                                                        >
                                                            Enviar Mensaje 📩
                                                        </button>
                                                    </div>

                                                    {/* Historial de esta mascota */}
                                                    <div className={styles.petHistorySection}>
                                                        <button
                                                            className={styles.loadHistoryBtn}
                                                            onClick={() => loadPetAppealLogs(pet.id)}
                                                        >
                                                            {loadingLogs[pet.id] ? 'Cargando...' : '📜 Ver Historial de Mensajes'}
                                                        </button>
                                                        {petLogs[pet.id] && petLogs[pet.id].length > 0 && (
                                                            <div className={styles.historyList}>
                                                                {petLogs[pet.id].map((log) => (
                                                                    <div
                                                                        key={log.id}
                                                                        className={`${styles.historyItem} ${log.type === 'user_appeal' || log.type === 'user_update' ? styles.userMessage : styles.adminMessage}`}
                                                                    >
                                                                        <div className={styles.historyHeader}>
                                                                            <span className={styles.historyAuthor}>
                                                                                {log.type === 'user_appeal' || log.type === 'user_update'
                                                                                    ? '👤 Usuario'
                                                                                    : `🛡️ ${log.admin_name}`}
                                                                            </span>
                                                                            <span className={styles.historyDate}>{log.formatted_date}</span>
                                                                        </div>
                                                                        <p className={styles.historyMessage}>{log.message}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
