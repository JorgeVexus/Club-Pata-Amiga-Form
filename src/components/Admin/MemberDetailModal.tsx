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

    useEffect(() => {
        if (isOpen && member) {
            loadPets();
            loadSupabaseUserData();
            loadBillingDetails();
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
                                {(selectedPetId ? pets.filter(p => p.id === selectedPetId) : pets).map((pet) => (
                                    <div key={pet.id} className={styles.petCardFull}>
                                        <div className={styles.petHeader}>
                                            <div className={styles.petAvatar}>
                                                {pet.pet_type === 'cat' ? '🐱' : '🐶'}
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
                                                                ))
                                                            }
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
