'use client';

import React, { useState, useEffect } from 'react';
import styles from './MemberDetailModal.module.css';
import { formatMXN } from '@/utils/format';
import { adminFetch } from '@/utils/admin-fetch';
import { getPetsByUserId, getBillingDetailsByMemberstackId, getUserDataByMemberstackId } from '@/app/actions/user.actions';
import { getPetCarenciaDate, getDaysUntilActive, getDaysElapsed } from '@/utils/carencia.utils';

interface Pet {
    id: string;
    name: string;
    breed: string;
    gender?: string;
    age_value?: string | number;
    age_unit?: string;
    birth_month?: number;
    birth_year?: number;
    pet_type?: string;
    status: 'pending' | 'approved' | 'action_required' | 'rejected' | 'appealed' | 'unsubscribed';
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
    waiting_period_start?: string | null;
    waiting_period_end?: string | null;
    is_mixed?: boolean;
    created_at: string;
    is_active?: boolean;
    unsubscribed_reason?: string | null;
    unsubscribed_description?: string | null;
    unsubscribed_at?: string | null;
    memberstack_slot?: number | null;
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
    onApprove: (id: string, metadata?: { membershipType: string; membershipCost: string }) => void;
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
    const [isUnsubscribing, setIsUnsubscribing] = useState<Record<string, boolean>>({});
    const [stripeDetails, setStripeDetails] = useState<any>(null);
    const [loadingStripe, setLoadingStripe] = useState(false);
    const [isSyncingCRM, setIsSyncingCRM] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({});
    const [sendingPetRecoveryLink, setSendingPetRecoveryLink] = useState(false);
    // 🆕 Cancellation data
    const [cancellationData, setCancellationData] = useState<any>(null);
    const [loadingCancellation, setLoadingCancellation] = useState(false);

    // States for Editing
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [editingEmailValue, setEditingEmailValue] = useState(member?.auth?.email || member?.email || '');
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    const [editingPetId, setEditingPetId] = useState<string | null>(null);
    const [editingPetNameValue, setEditingPetNameValue] = useState('');
    const [isSavingPetName, setIsSavingPetName] = useState(false);
    const [showUnsubscribedPets, setShowUnsubscribedPets] = useState(false);

    useEffect(() => {
        if (isOpen && member) {
            loadPets();
            loadSupabaseUserData();
            loadBillingDetails();
            loadStripeDetails();
            loadCancellationData();
            // Reset editing states
            setIsEditingEmail(false);
            setEditingEmailValue(member?.auth?.email || member?.email || '');
            setEditingPetId(null);
            setShowRejectForm({});
            setShowUnsubscribedPets(false);
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
            const response = await adminFetch(`/api/admin/members/${member.id}/stripe-details`);
            if (response.ok) {
                const data = await response.json();
                setStripeDetails(data.stripeData);
            }
        } catch (error) {
            console.error('Error loading stripe details:', error);
        } finally {
            setLoadingStripe(false);
        }
    }

    async function loadCancellationData() {
        if (!member) return;
        setLoadingCancellation(true);
        try {
            const response = await adminFetch(`/api/admin/members/${member.id}/cancellation-data`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.cancellation) {
                    setCancellationData(data.cancellation);
                }
            }
        } catch (error) {
            console.error('Error loading cancellation data:', error);
        } finally {
            setLoadingCancellation(false);
        }
    }

    async function handleSaveEmail() {
        if (!editingEmailValue || !editingEmailValue.includes('@')) {
            alert('Por favor ingresa un email válido.');
            return;
        }

        setIsSavingEmail(true);
        try {
            const response = await adminFetch(`/api/admin/members/${member.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: editingEmailValue })
            });

            const data = await response.json();
            if (data.success) {
                alert('✅ Email actualizado y verificado correctamente.');
                setIsEditingEmail(false);
                if (onDataChange) onDataChange();
            } else {
                alert('❌ Error: ' + (data.error || 'Ocurrió un error al actualizar el email.'));
            }
        } catch (error) {
            console.error('Error saving email:', error);
            alert('Error de conexión');
        } finally {
            setIsSavingEmail(false);
        }
    }

    async function handleSavePetName(petId: string, msIndex: number) {
        if (!editingPetNameValue.trim()) {
            alert('El nombre no puede estar vacío.');
            return;
        }

        setIsSavingPetName(true);
        try {
            const response = await adminFetch(`/api/admin/members/${member.id}/pets/${petId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: editingPetNameValue,
                    msIndex: msIndex
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('✅ Nombre de mascota actualizado correctamente.');
                setEditingPetId(null);
                loadPets(); // Recargar mascotas locales
                if (onDataChange) onDataChange();
            } else {
                alert('❌ Error: ' + (data.error || 'Ocurrió un error al actualizar el nombre.'));
            }
        } catch (error) {
            console.error('Error saving pet name:', error);
            alert('Error de conexión');
        } finally {
            setIsSavingPetName(false);
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
            const res = await adminFetch(`/api/admin/members/${member.id}/appeal-logs?petId=${petId}`);
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
            const res = await adminFetch(`/api/admin/members/${member.id}/appeal-response`, {
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
                if (onDataChange) onDataChange();
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
            let next: string[];
            if (current.includes(type)) {
                next = current.filter(t => t !== type);
            } else {
                next = [...current, type];
            }
            
            // 🆕 Autocompletar sugerencia de mensaje
            if (next.length > 0) {
                const pet = pets.find(p => p.id === petId);
                const petName = pet?.name || 'la mascota';
                
                const typeLabels: Record<string, string> = {
                    'PET_PHOTO_1': 'Foto Principal',
                    'PET_VET_CERT': 'Certificado Médico',
                    'OTHER_DOC': 'Documento Adicional'
                };
                
                const selectedLabels = next.map(t => typeLabels[t] || t);
                let docsText = selectedLabels.join(' y ');
                if (selectedLabels.length > 2) {
                    docsText = selectedLabels.slice(0, -1).join(', ') + ' y ' + selectedLabels.slice(-1);
                }
                
                const suggestedMsg = `Estimado tutor, solicitamos ${docsText} de ${petName} debido a que `;
                
                setRequestCustomMsg(prevMsg => ({
                    ...prevMsg,
                    [petId]: suggestedMsg
                }));
            } else {
                // Si no hay nada seleccionado, limpiamos el mensaje sugerido
                setRequestCustomMsg(prevMsg => ({
                    ...prevMsg,
                    [petId]: ''
                }));
            }

            return { ...prev, [petId]: next };
        });
    }

    // 🆕 Enviar solicitud de información
    async function sendInfoRequest(petId: string) {
        const types = selectedRequests[petId] || [];
        if (types.length === 0) {
            alert('Selecciona al menos un tipo de información a solicitar.');
            return;
        }

        const pet = pets.find(p => p.id === petId);
        const memberstackSlot = pet?.memberstack_slot || (pet ? pets.indexOf(pet) + 1 : undefined);

        setSendingRequest(prev => ({ ...prev, [petId]: true }));
        try {
            const res = await adminFetch(`/api/admin/members/${member.id}/request-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    petId,
                    memberstackSlot,
                    petName: pet?.name,
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
            const pet = pets.find(p => p.id === petId);
            const memberstackSlot = pet?.memberstack_slot || (pet ? pets.indexOf(pet) + 1 : undefined);
            const response = await adminFetch(`/api/admin/members/${member.id}/pets/${petId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    adminNotes: petNotes[petId],
                    memberstackSlot,
                    petName: pet?.name,
                    adminId: 'current_admin' // TODO: Get from auth
                })
            });

            const data = await response.json();
            if (data.success) {
                // Actualizar localmente
                setPets(prev => prev.map(p => p.id === petId ? { ...p, status: status as any, admin_notes: petNotes[petId] } : p));
                setShowRejectForm(prev => ({ ...prev, [petId]: false }));
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

    async function handlePetUnsubscribe(petId: string, msIndex: number, petName: string) {
        const reason = prompt(`¿Estás seguro de dar de baja a ${petName}? Esta acción liberará un espacio en la manada.\n\nEscribe el motivo (ej. Fallecimiento, Ya no vive conmigo, etc.):`);
        
        if (!reason || !reason.trim()) return;

        if (!confirm(`Confirmar baja de ${petName}. ¿Proceder?`)) return;

        setIsUnsubscribing(prev => ({ ...prev, [petId]: true }));
        try {
            const response = await adminFetch(`/api/user/pets/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: member.id,
                    petId,
                    petIndex: msIndex,
                    petName,
                    reason,
                    isAdmin: true
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`✅ ${petName} ha sido dado de baja correctamente.`);
                loadPets(); // Recargar para ver el estado (aunque el estado visual dependa de MS fields)
                if (onDataChange) onDataChange();
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo procesar la baja.'));
            }
        } catch (error) {
            console.error('Error unsubscribing pet:', error);
            alert('Error de conexión');
        } finally {
            setIsUnsubscribing(prev => ({ ...prev, [petId]: false }));
        }
    }

    // Refund handler
    async function handleRefund() {
        if (!confirm('¿Estás seguro de reembolsar el pago de este miembro? Esta acción no se puede deshacer.')) return;
        setIsRefunding(true);
        try {
            const response = await adminFetch(`/api/admin/members/${member.id}/refund`, {
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

    async function handleSyncCRM() {
        if (isSyncingCRM) return;
        setIsSyncingCRM(true);
        try {
            const plan = member.planConnections?.[0];
            const isAnual = stripeDetails?.subscription?.interval === 'year' || 
                            plan?.planName?.toLowerCase().includes('anual') ||
                            (stripeDetails?.payments?.[0]?.amount && stripeDetails.payments[0].amount > 1000);
            const membershipType = isAnual ? 'Anual' : 'Mensual';
            const membershipCost = isAnual ? '$1,699' : '$159';

            const memberEmail = member.auth?.email || member.email || member.customFields?.['email'] || '';
            const response = await adminFetch(`/api/admin/members/${member.id}/sync-crm?email=${encodeURIComponent(memberEmail)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membershipType, membershipCost })
            });

            const data = await response.json();
            if (data.success) {
                alert('✅ CRM Sincronizado correctamente');
            } else {
                alert('❌ Error: ' + (data.error || 'No se pudo sincronizar'));
            }
        } catch (error) {
            console.error('CRM Sync error:', error);
            alert('Error de conexión');
        } finally {
            setIsSyncingCRM(false);
        }
    }

    async function sendPetRecoveryLink() {
        if (sendingPetRecoveryLink) return;
        setSendingPetRecoveryLink(true);

        try {
            const response = await adminFetch(`/api/admin/members/${member.id}/pet-recovery-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (data.success) {
                alert(`Link enviado correctamente. ${data.message || ''}`);
                onDataChange?.();
            } else {
                alert('Error: ' + (data.error || 'No se pudo enviar el link'));
            }
        } catch (error) {
            console.error('Pet recovery link error:', error);
            alert('Error de conexion al enviar el link.');
        } finally {
            setSendingPetRecoveryLink(false);
        }
    }

    if (!isOpen || !member) return null;

    const fields = member.customFields || {};
    const registrationIssue = member.registrationIssue as string | null | undefined;
    const needsPetRecovery = registrationIssue === 'paid_without_pets' || registrationIssue === 'paid_without_complete_pet_rows';
    const hasActiveMembershipPlan = member.planConnections?.some((plan: any) => {
        const status = String(plan?.status || '').toLowerCase();
        return status === 'active' || status === 'trialing';
    });
    const isMemberApprovedByPayment = hasActiveMembershipPlan && fields['approval-status'] !== 'rejected';

    // 🆕 Lógica reforzada para detectar extranjeros
    const nationalityValue = (supabaseUser?.nationality || fields['nationality'] || '').toLowerCase();
    const isForeigner = (nationalityValue !== '' && 
                        nationalityValue !== 'mexicano' && 
                        nationalityValue !== 'mexicana' && 
                        nationalityValue !== 'méxico' && 
                        nationalityValue !== 'mexico') || 
                        fields['is-foreigner'] === 'true' || 
                        fields['is-foreigner'] === true;

    // Force download handler
    const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
        e.preventDefault();
        try {
            const response = await adminFetch(url);
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

    
    const activePets = selectedPetId 
        ? pets.filter(p => p.id === selectedPetId) 
        : pets.filter(p => p.is_active !== false && p.status !== 'unsubscribed' && fields[`pet-${pets.indexOf(p) + 1}-is-active`] !== 'false');

    const unsubscribedPets = selectedPetId 
        ? [] 
        : pets.filter(p => p.is_active === false || p.status === 'unsubscribed' || fields[`pet-${pets.indexOf(p) + 1}-is-active`] === 'false');

    
    const renderPetCard = (pet: Pet) => {
        const pIdx = pets.indexOf(pet) + 1;
                                    const mainPhoto = pet.photo_url || fields[`pet-${pIdx}-photo-1-url`];

                                    const hasAmbassadorCode = !!(fields['ambassador-code'] || supabaseUser?.ambassador_code);
                                    
                                    let totalCarenciaDays = 180;
                                    if (hasAmbassadorCode) {
                                        totalCarenciaDays = 90;
                                    } else if (pet.is_adopted) {
                                        const isMixed = pet.is_mixed_breed === true || pet.is_mixed === true;
                                        totalCarenciaDays = isMixed ? 120 : 150;
                                    }
                                    if (pet.waiting_period_start && pet.waiting_period_end) {
                                        const start = new Date(pet.waiting_period_start);
                                        const end = new Date(pet.waiting_period_end);
                                        const diff = end.getTime() - start.getTime();
                                        totalCarenciaDays = Math.round(diff / (1000 * 60 * 60 * 24));
                                    }

                                    const daysElapsed = pet.waiting_period_start ? getDaysElapsed(pet, hasAmbassadorCode) : 0;
                                    const daysRemaining = pet.waiting_period_start ? getDaysUntilActive(pet, hasAmbassadorCode) : totalCarenciaDays;

                                    return (
                                        <div key={pet.id} className={styles.petCardFull}>
                                            <div className={styles.petHeader}>
                                                <div className={styles.petAvatar} style={{ 
                                                    filter: fields[`pet-${pIdx}-is-active`] === 'false' ? 'grayscale(100%)' : 'none',
                                                    opacity: fields[`pet-${pIdx}-is-active`] === 'false' ? 0.7 : 1
                                                }}>
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
                                                    {editingPetId === pet.id ? (
                                                        <div className={styles.editRow}>
                                                            <input 
                                                                type="text" 
                                                                value={editingPetNameValue} 
                                                                onChange={(e) => setEditingPetNameValue(e.target.value)}
                                                                className={styles.editInput}
                                                                autoFocus
                                                            />
                                                            <button onClick={() => handleSavePetName(pet.id, pIdx)} disabled={isSavingPetName} className={styles.saveButton}>
                                                                {isSavingPetName ? '...' : '✓'}
                                                            </button>
                                                            <button onClick={() => setEditingPetId(null)} className={styles.cancelButton}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <div className={styles.valueRow}>
                                                            <h4 style={{ margin: 0 }}>{pet.name}</h4>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingPetId(pet.id);
                                                                    setEditingPetNameValue(pet.name);
                                                                }} 
                                                                className={styles.editLink}
                                                            >
                                                                Editar
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className={styles.petBreed}>
                                                        {pet.is_mixed_breed 
                                                            ? (pet.pet_type === 'cat' ? 'Doméstico' : 'Mestizo') 
                                                            : pet.breed}
                                                    </div>
                                                </div>
                                                <div className={`${styles.statusBadge} ${pet.is_active === false ? 'unsubscribed' : styles[pet.status]}`}
                                                    style={pet.is_active === false ? { background: '#F1F3F4', color: '#3D494D', border: '2px solid #3D494D' } : {}}>
                                                    {pet.is_active === false ? '🚫 Dada de Baja' :
                                                        pet.status === 'pending' ? 'Pendiente' :
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
                                                <span className={styles.detailLabel}>🎈 Cumpleaños</span>
                                                <span className={styles.detailValue}>
                                                    {pet.birth_month && pet.birth_year ? `${['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][pet.birth_month] || pet.birth_month} ${pet.birth_year}` : 'No especificado'}
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
                                                <span className={styles.detailValue}>{pet.coat_color || fields[`pet-${pIdx}-coat-color`] || '---'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>👃 Nariz</span>
                                                <span className={styles.detailValue}>{pet.nose_color || fields[`pet-${pIdx}-nose-color`] || '---'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>👁️ Ojos</span>
                                                <span className={styles.detailValue}>{pet.eye_color || fields[`pet-${pIdx}-eye-color`] || '---'}</span>
                                            </div>

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
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>⏱️ Tiempo de espera</span>
                                                <span className={styles.detailValue}>
                                                    {totalCarenciaDays} días {!pet.waiting_period_start && '(estimado)'}
                                                </span>
                                            </div>
                                            {pet.waiting_period_start ? (
                                                <>
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>📅 Inicio de tiempo de espera</span>
                                                        <span className={styles.detailValue}>
                                                            {new Date(pet.waiting_period_start).toLocaleDateString('es-MX', { 
                                                                day: '2-digit', 
                                                                month: 'short', 
                                                                year: 'numeric' 
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>📈 Días transcurridos</span>
                                                        <span className={styles.detailValue}>
                                                            {daysElapsed} {daysElapsed === 1 ? 'día' : 'días'}
                                                        </span>
                                                    </div>
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>⏳ Días restantes</span>
                                                        <span className={styles.detailValue} style={{ fontWeight: 600, color: daysRemaining > 0 ? '#FE8F15' : '#38A169' }}>
                                                            {daysRemaining > 0 ? `${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}` : 'Completado (Activa)'}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>📅 Inicio de tiempo de espera</span>
                                                    <span className={styles.detailValue} style={{ color: '#718096', fontStyle: 'italic' }}>
                                                        Pendiente de aprobación
                                                    </span>
                                                </div>
                                            )}
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

                                            {/* 🆕 Información de Baja */}
                                            {pet.is_active === false && (
                                                <div style={{
                                                    gridColumn: 'span 2',
                                                    background: '#F1F3F4',
                                                    borderRadius: '16px',
                                                    padding: '16px',
                                                    border: '2px solid #D1D5DB',
                                                    marginTop: '8px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <span style={{ fontSize: '20px' }}>🚫</span>
                                                        <strong style={{ color: '#3D494D', fontSize: '0.95rem' }}>Datos de la Baja</strong>
                                                    </div>
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>Motivo</span>
                                                        <span className={styles.detailValue} style={{ fontWeight: 600 }}>
                                                            {pet.unsubscribed_reason || 'No especificado'}
                                                        </span>
                                                    </div>
                                                    {pet.unsubscribed_description && (
                                                        <div className={styles.detailRow}>
                                                            <span className={styles.detailLabel}>Descripción</span>
                                                            <span className={styles.detailValue}>{pet.unsubscribed_description}</span>
                                                        </div>
                                                    )}
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>Fecha de Baja</span>
                                                        <span className={styles.detailValue} style={{ fontWeight: 600 }}>
                                                            {pet.unsubscribed_at
                                                                ? new Date(pet.unsubscribed_at).toLocaleDateString('es-MX', {
                                                                    day: '2-digit',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })
                                                                : 'No registrada'}
                                                        </span>
                                                    </div>
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

                                        {/* Motivo de Rechazo / Solicitud de Información */}
                                        {(pet.status === 'rejected' || pet.status === 'action_required') && pet.admin_notes && (
                                            <div style={{
                                                background: pet.status === 'rejected' ? 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)' : 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                                                padding: '15px',
                                                borderRadius: '12px',
                                                marginBottom: '15px',
                                                border: pet.status === 'rejected' ? '1px solid #EF9A9A' : '1px solid #90CAF9'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '18px' }}>{pet.status === 'rejected' ? '❌' : '📋'}</span>
                                                    <strong style={{ color: pet.status === 'rejected' ? '#C62828' : '#1565C0' }}>
                                                        {pet.status === 'rejected' ? 'Motivo del Rechazo:' : 'Información Solicitada:'}
                                                    </strong>
                                                </div>
                                                <p style={{ margin: 0, color: pet.status === 'rejected' ? '#B71C1C' : '#0D47A1', fontWeight: 600 }}>
                                                    "{pet.admin_notes}"
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
                                            {pet.is_active !== false && (
                                                <>
                                            {showRejectForm[pet.id] ? (
                                                <div className={styles.notesField} style={{ animation: 'fadeIn 0.2s ease-out', marginBottom: '16px' }}>
                                                    <label style={{ color: '#991B1B', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                                                        Motivo del Rechazo (Requerido):
                                                    </label>
                                                    <textarea
                                                        value={petNotes[pet.id] || ''}
                                                        onChange={(e) => setPetNotes({ ...petNotes, [pet.id]: e.target.value })}
                                                        placeholder="Escribe la razón detallada del rechazo..."
                                                        className={styles.notesInput}
                                                        style={{ borderColor: '#FCA5A5', minHeight: '80px', width: '100%' }}
                                                        autoFocus
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                        <button
                                                            className={styles.petRejectBtn}
                                                            onClick={() => handlePetStatusUpdate(pet.id, 'rejected')}
                                                            disabled={updatingPetId === pet.id}
                                                            style={{ 
                                                                flex: 1, 
                                                                background: '#DC2626', 
                                                                color: '#fff', 
                                                                border: '2px solid #000',
                                                                borderRadius: '50px',
                                                                padding: '8px 16px',
                                                                fontWeight: 800,
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {updatingPetId === pet.id ? '...' : 'Confirmar Rechazo ❌'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowRejectForm(prev => ({ ...prev, [pet.id]: false }));
                                                                setPetNotes(prev => ({ ...prev, [pet.id]: '' }));
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                background: '#E2E8F0',
                                                                color: '#475569',
                                                                border: '2px solid #475569',
                                                                borderRadius: '50px',
                                                                padding: '8px 16px',
                                                                fontWeight: 800,
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
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
                                                    {pet.status !== 'rejected' && (
                                                        <button
                                                            className={styles.petRejectBtn}
                                                            onClick={() => setShowRejectForm(prev => ({ ...prev, [pet.id]: true }))}
                                                            disabled={updatingPetId === pet.id}
                                                        >
                                                            {updatingPetId === pet.id ? '...' : 'Rechazar'}
                                                        </button>
                                                    )}
                                                    {fields[`pet-${pets.indexOf(pet) + 1}-is-active`] !== 'false' && (
                                                        <button
                                                            className={styles.petUnsubscribeBtn}
                                                            onClick={() => handlePetUnsubscribe(pet.id, pets.indexOf(pet), pet.name)}
                                                            disabled={isUnsubscribing[pet.id]}
                                                            style={{ 
                                                                background: '#FEE2E2', 
                                                                color: '#991B1B', 
                                                                border: '2px solid #991B1B',
                                                                borderRadius: '50px',
                                                                padding: '8px 16px',
                                                                fontWeight: 600,
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {isUnsubscribing[pet.id] ? '...' : 'Dar de Baja'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

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
                                            </>     

                                            )}
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

                    {needsPetRecovery && (
                        <div className={styles.section} style={{ border: '2px solid #FCA5A5', background: '#FEF2F2' }}>
                            <h3 className={styles.sectionTitle}>Mascota por recuperar</h3>
                            <p style={{ margin: '0 0 16px', color: '#7F1D1D', lineHeight: 1.5 }}>
                                Este miembro tiene membresia activa o pagada, pero no tiene mascotas completas en el expediente.
                                Puedes enviarle un enlace seguro para completar los pasos de mascota del Registro V2.
                            </p>
                            <button
                                type="button"
                                style={{
                                    background: '#FE8F15',
                                    color: '#fff',
                                    border: '2px solid #000',
                                    borderRadius: '50px',
                                    padding: '12px 24px',
                                    fontWeight: 700,
                                    cursor: sendingPetRecoveryLink ? 'not-allowed' : 'pointer',
                                    opacity: sendingPetRecoveryLink ? 0.7 : 1
                                }}
                                onClick={sendPetRecoveryLink}
                                disabled={sendingPetRecoveryLink}
                            >
                                {sendingPetRecoveryLink ? 'Enviando...' : 'Enviar link para completar mascota'}
                            </button>
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
                            {!isForeigner && (
                                <div className={styles.field}>
                                    <span className={styles.label}>CURP</span>
                                    <span className={styles.value}>{fields['curp'] || supabaseUser?.curp || '-'}</span>
                                </div>
                            )}
                            <div className={styles.field}>
                                <span className={styles.label}>Nacionalidad</span>
                                <span className={styles.value}>
                                    {supabaseUser?.nationality ? `${supabaseUser.nationality} (${supabaseUser.nationality_code || ''})` : (fields['nationality'] || '-')}
                                </span>
                            </div>
                            <div className={styles.field}>
                                <span className={styles.label}>Correo Electrónico</span>
                                <div className={styles.editableContainer}>
                                    {isEditingEmail ? (
                                        <div className={styles.editRow}>
                                            <input 
                                                type="email" 
                                                value={editingEmailValue} 
                                                onChange={(e) => setEditingEmailValue(e.target.value)}
                                                className={styles.editInput}
                                                autoFocus
                                            />
                                            <button onClick={handleSaveEmail} disabled={isSavingEmail} className={styles.saveButton}>
                                                {isSavingEmail ? '...' : '✓'}
                                            </button>
                                            <button onClick={() => setIsEditingEmail(false)} className={styles.cancelButton}>✕</button>
                                        </div>
                                    ) : (
                                        <div className={styles.valueRow}>
                                            <span className={styles.value}>{member?.auth?.email || member?.email || supabaseUser?.email || '-'}</span>
                                            <button 
                                                onClick={() => {
                                                    setEditingEmailValue(member?.auth?.email || member?.email || '');
                                                    setIsEditingEmail(true);
                                                }} 
                                                className={styles.editLink}
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    )}
                                </div>
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

                                // 1. Fecha de Activación (Prioridad: Stripe startDate -> plan.createdAt -> member.createdAt -> registration-date -> primer pago)
                                const activationDate = stripeDetails?.subscription?.startDate ? new Date(stripeDetails.subscription.startDate) :
                                                     plan.createdAt ? new Date(plan.createdAt) : 
                                                     (member as any).createdAt ? new Date((member as any).createdAt) :
                                                     fields['registration-date'] ? new Date(fields['registration-date']) :
                                                     supabaseUser?.created_at ? new Date(supabaseUser.created_at) :
                                                     (stripeDetails?.payments?.length > 0) ? new Date(stripeDetails.payments[stripeDetails.payments.length - 1].date) :
                                                     null;

                                const activationDateFormatted = activationDate ? activationDate.toLocaleDateString('es-MX', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                }) : '-';

                                // 2. Lógica Dinámica de Próxima Renovación
                                const isAnual = stripeDetails?.subscription?.interval === 'year' || 
                                                plan.planName?.toLowerCase().includes('anual') ||
                                                (stripeDetails?.payments?.[0]?.amount && stripeDetails.payments[0].amount > 1000);
                                const membershipCost = isAnual ? '$1,699' : '$159';
                                let finalRenewalDate: Date | null = null;

                                // 🆕 Detectar cancelación desde Stripe
                                const isCancelled = stripeDetails?.subscription?.cancel_at_period_end === true;
                                const cancelledAtRaw = stripeDetails?.subscription?.canceled_at;
                                const cancelledAt = cancelledAtRaw ? new Date(cancelledAtRaw) : null;
                                const cancelledAtFormatted = cancelledAt && !isNaN(cancelledAt.getTime()) ? cancelledAt.toLocaleDateString('es-MX', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                }) : null;

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
                                            <span className={styles.value} style={{ fontWeight: 700, color: isCancelled ? '#E53E3E' : '#0088BD' }}>
                                                {plan.planName || plan.planId || 'Membresía Activa'}
                                                {isCancelled && <span style={{ marginLeft: '8px', fontSize: '0.75em', background: '#E53E3E', color: '#fff', padding: '2px 8px', borderRadius: '50px' }}>CANCELADA</span>}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Frecuencia de Pago</span>
                                            <span className={styles.value} style={{ textTransform: 'capitalize' }}>
                                                {isAnual ? 'Anual' : 'Mensual'}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Costo de Membresía</span>
                                            <span className={styles.value} style={{ fontWeight: 600 }}>
                                                {membershipCost}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Estado de Pago</span>
                                            <span className={`${styles.paymentStatus} ${styles[plan.status?.toLowerCase() || 'none']}`}>
                                                {isCancelled ? 'Cancelada (fin de periodo)' : (plan.status || 'Desconocido')}
                                            </span>
                                        </div>
                                        <div className={styles.field}>
                                            <span className={styles.label}>Fecha de Activación</span>
                                            <span className={styles.value}>{activationDateFormatted}</span>
                                        </div>
                                        {isCancelled ? (
                                            <>
                                                <div className={styles.field}>
                                                    <span className={styles.label}>Fecha de Cancelación</span>
                                                    <span className={styles.value} style={{ fontWeight: 600, color: '#E53E3E' }}>
                                                        {cancelledAtFormatted || 'No disponible'}
                                                    </span>
                                                </div>
                                                {cancellationData && (
                                                    <>
                                                        <div className={styles.field}>
                                                            <span className={styles.label}>Razón de Cancelación</span>
                                                            <span className={styles.value} style={{ fontWeight: 600, color: '#E53E3E' }}>
                                                                {cancellationData.cancellation_reason_label}
                                                                {cancellationData.reason_other_text && (
                                                                    <span style={{ marginLeft: '8px', fontSize: '0.9em', fontWeight: 400, color: '#718096' }}>
                                                                        ({cancellationData.reason_other_text})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        {cancellationData.comments && (
                                                            <div className={styles.field}>
                                                                <span className={styles.label}>Comentarios</span>
                                                                <span className={styles.value} style={{ fontSize: '0.9em', color: '#4A5568' }}>
                                                                    {cancellationData.comments}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div className={styles.field}>
                                                    <span className={styles.label}>Apoyo hasta</span>
                                                    <span className={styles.value} style={{ fontWeight: 600, color: '#E53E3E', fontSize: '1.1em' }}>
                                                        {renewalDateFormatted}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={styles.field}>
                                                <span className={styles.label}>Próxima Renovación</span>
                                                <span className={styles.value} style={{ fontWeight: 600 }}>
                                                    {renewalDateFormatted}
                                                </span>
                                            </div>
                                        )}
                                        {stripeDetails?.payments?.length > 0 && (
                                            <div className={styles.field}>
                                                <span className={styles.label}>Último Pago</span>
                                                <span className={styles.value}>
                                                    {new Date(stripeDetails.payments[0].date).toLocaleDateString('es-MX', {
                                                        day: '2-digit',
                                                        month: 'long'
                                                    })} - {formatMXN(stripeDetails.payments[0].amount)} {stripeDetails.payments[0].currency}
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
                                                <th>Recibo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stripeDetails.payments.map((p: any) => (
                                                <tr key={p.id}>
                                                    <td>{new Date(p.date).toLocaleDateString('es-MX')}</td>
                                                    <td style={{ fontWeight: 600 }}>{formatMXN(p.amount)} {p.currency}</td>
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

                    {/* Member Documents (Foreigners Only) */}
                    {isForeigner && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Documentación Oficial 🛂</h3>
                            <div className={styles.grid}>
                                {(fields['ine-front-url'] || supabaseUser?.ine_front_url) && (
                                    <div className={styles.documentCard} style={{ background: '#F0F9FF', borderColor: '#BAE6FD' }}>
                                        <span className={styles.documentIcon}>🛂</span>
                                        <div className={styles.documentInfo}>
                                            <div className={styles.documentName}>Pasaporte</div>
                                            <div className={styles.docDesc}>Documento de identidad extranjero</div>
                                        </div>
                                        <div className={styles.docActions}>
                                            <a 
                                                href={fields['ine-front-url'] || supabaseUser?.ine_front_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className={styles.viewDocButton}
                                            >
                                                Ver
                                            </a>
                                            <a
                                                href="#"
                                                onClick={(e) => handleDownload(e, fields['ine-front-url'] || supabaseUser?.ine_front_url, `pasaporte-${member.id}`)}
                                                className={styles.viewDocButton}
                                            >
                                                Descargar
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Passport Image Preview */}
                            {(fields['ine-front-url'] || supabaseUser?.ine_front_url) && (
                                <div style={{ marginTop: '1.5rem', borderRadius: '16px', overflow: 'hidden', border: '2px solid #E2E8F0' }}>
                                    <img 
                                        src={fields['ine-front-url'] || supabaseUser?.ine_front_url} 
                                        alt="Pasaporte" 
                                        style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#f8fafc' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}


                    {/* Pets */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            {selectedPetId ? 'Mascota en Apelación' : `Mascotas Registradas (${pets.length})`}
                        </h3>
                        {loadingPets ? (
                            <div className={styles.loading}>Cargando mascotas...</div>
                        ) : (
                            <>
                                {activePets.length > 0 ? (
                                    <div className={styles.grid}>
                                        {activePets.map((pet) => renderPetCard(pet))}
                                    </div>
                                ) : (
                                    <p className={styles.noPets} style={{ fontStyle: 'italic', color: '#64748B', padding: '16px 0' }}>
                                        No hay mascotas activas o pendientes.
                                    </p>
                                )}

                                {unsubscribedPets.length > 0 && (
                                    <div className={styles.unsubscribedSection}>
                                        <div 
                                            className={`${styles.unsubscribedHeader} ${showUnsubscribedPets ? styles.unsubscribedHeaderActive : ''}`} 
                                            onClick={() => setShowUnsubscribedPets(!showUnsubscribedPets)}
                                        >
                                            <h4 className={styles.unsubscribedTitle}>
                                                📁 Mascotas Dadas de Baja (${unsubscribedPets.length})
                                            </h4>
                                            <span className={`${styles.unsubscribedIcon} ${showUnsubscribedPets ? styles.unsubscribedIconRotated : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                        {showUnsubscribedPets && (
                                            <div className={styles.unsubscribedGrid}>
                                                {unsubscribedPets.map((pet) => renderPetCard(pet))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    {fields['approval-status'] !== 'approved' && !isMemberApprovedByPayment && (
                        <>
                            <button
                                className={`${styles.actionButton} ${styles.approveButton}`}
                                onClick={() => {
                                    const plan = member.planConnections?.[0];
                                    const isAnual = stripeDetails?.subscription?.interval === 'year' || 
                                                    plan?.planName?.toLowerCase().includes('anual') ||
                                                    (stripeDetails?.payments?.[0]?.amount && stripeDetails.payments[0].amount > 1000);
                                    const membershipType = isAnual ? 'Anual' : 'Mensual';
                                    const membershipCost = isAnual ? '$1,699' : '$159';
                                    onApprove(member.id, { membershipType, membershipCost });
                                }}
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
                    {(fields['approval-status'] === 'approved' || isMemberApprovedByPayment) && (
                        <button
                            className={`${styles.actionButton}`}
                            style={{
                                background: '#00BBB4',
                                color: 'white',
                                opacity: isSyncingCRM ? 0.7 : 1,
                            }}
                            onClick={handleSyncCRM}
                            disabled={isSyncingCRM}
                        >
                            {isSyncingCRM ? '⏳ Sincronizando...' : '🔄 Resincronizar CRM'}
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
