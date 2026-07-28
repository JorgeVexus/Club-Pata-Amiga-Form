'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './SolidarityRequestDetail.module.css';
import { adminFetch } from '@/utils/admin-fetch';
import { SOLIDARITY_BENEFIT_LABELS, SOLIDARITY_STATUS_LABELS, SolidarityRequestStatus } from '@/types/solidarity.types';

interface Message {
    id: string;
    message: string;
    sender_role: 'admin' | 'user';
    attachments?: any[];
    created_at: string;
}

interface SolidarityRequest {
    id: string;
    user_id: string;
    pet_id: string;
    type: string;
    benefit_type: string;
    status: string;
    requested_amount: number;
    clinic_name?: string;
    case_title: string;
    case_description: string;
    bank_name?: string;
    bank_clabe?: string;
    bank_holder?: string;
    created_at: string;
    pet?: any;
    user?: any;
    approved_amount?: number;
}

interface Props {
    requestId: string;
    onClose: () => void;
    adminMemberstackId: string;
}

export default function SolidarityRequestDetail({ requestId, onClose, adminMemberstackId }: Props) {
    const [request, setRequest] = useState<SolidarityRequest | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    
    const chatRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [requestId]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && !sending) {
                loadMessages();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [requestId, loading, sending, messages.length]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    async function loadData() {
        setLoading(true);
        try {
            const [reqRes, msgRes] = await Promise.all([
                adminFetch(`/api/admin/solidarity/requests/${requestId}`),
                adminFetch(`/api/solidarity/requests/${requestId}/messages`)
            ]);
            
            const reqData = await reqRes.json();
            const msgData = await msgRes.json();

            if (reqData.success) setRequest(reqData.request);
            if (Array.isArray(msgData)) setMessages(msgData);
            
        } catch (error) {
            console.error('Error loading detail:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 15 * 1024 * 1024) {
                alert('El archivo es muy grande. Máximo 15MB.');
                return;
            }
            setSelectedFile(file);
        }
    }

    async function handleSendMessage() {
        if (sending || uploading) return;
        
        const hasText = newMessage.trim();
        const hasFile = !!selectedFile;

        if (!hasText && !hasFile) return;
        
        setSending(true);

        try {
            let attachments = [];

            if (selectedFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('requestId', requestId);
                
                const uploadRes = await adminFetch('/api/upload/solidarity-attachment', {
                    method: 'POST',
                    body: formData
                });
                
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    attachments.push({
                        name: selectedFile.name,
                        url: uploadData.url,
                        type: selectedFile.type
                    });
                }
                setUploading(false);
            }

            const res = await adminFetch(`/api/solidarity/requests/${requestId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: newMessage,
                    senderRole: 'admin',
                    attachments
                })
            });

            if (res.ok) {
                setNewMessage('');
                setSelectedFile(null);
                loadMessages();
                
                // Scroll to bottom
                setTimeout(() => {
                    if (chatRef.current) {
                        chatRef.current.scrollTop = chatRef.current.scrollHeight;
                    }
                }, 150);
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            alert('Error al enviar el mensaje: ' + error.message);
        } finally {
            setSending(false);
        }
    }

    async function handleUpdateStatus(newStatus: string, message?: string, approvedAmount?: number) {
        setUpdatingStatus(true);
        try {
            const res = await adminFetch(`/api/admin/solidarity/update`, {
                method: 'POST',
                body: JSON.stringify({
                    requestId,
                    status: newStatus,
                    adminId: adminMemberstackId,
                    adminName: 'Administrador',
                    message: message,
                    approvedAmount: approvedAmount
                })
            });
            const data = await res.json();
            if (data.success) {
                setRequest(prev => prev ? { 
                    ...prev, 
                    status: newStatus,
                    approved_amount: approvedAmount !== undefined ? approvedAmount : prev.approved_amount
                } : null);
                loadMessages();
            } else {
                alert('Error: ' + (data.error || 'No se pudo actualizar el estado'));
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error de conexión al actualizar el estado');
        } finally {
            setUpdatingStatus(false);
        }
    }

    async function loadMessages() {
        const msgRes = await adminFetch(`/api/solidarity/requests/${requestId}/messages`);
        const msgData = await msgRes.json();
        if (Array.isArray(msgData)) setMessages(msgData);
    }

    async function handleStartReview() {
        if (!request || updatingStatus) return;
        await handleUpdateStatus('in_review', 'La solicitud ha comenzado a ser revisada por el comité.');
    }

    async function handleRequestMoreInfo() {
        if (updatingStatus) return;
        
        const infoMessage = prompt('Especifica qué información adicional necesitas del usuario:', 'Hola, hemos revisado tu solicitud y necesitamos que nos proporciones un poco más de información sobre: ');
        if (infoMessage === null) return; // Cancelled

        await handleUpdateStatus('needs_info', infoMessage);
    }

    async function handleApproveRequest() {
        if (!request || updatingStatus) return;
        
        const amountStr = prompt('Ingresa el monto aprobado para esta solicitud:', request.requested_amount.toString());
        if (amountStr === null) return; // Cancelado
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            alert('Monto inválido. Debe ser un número mayor a 0.');
            return;
        }

        const msg = `Solicitud aprobada por un monto de $${amount.toFixed(2)}.`;
        await handleUpdateStatus('approved', msg, amount);
    }

    async function handleRejectRequest() {
        if (!request || updatingStatus) return;
        
        const reason = prompt('Especifica el motivo del rechazo de la solicitud:');
        if (reason === null) return; // Cancelado
        
        if (!reason.trim()) {
            alert('El motivo del rechazo es obligatorio.');
            return;
        }

        const msg = `Solicitud rechazada. Motivo: ${reason}`;
        await handleUpdateStatus('rejected', msg);
    }

    async function handleCancelRequest() {
        if (!request || updatingStatus) return;
        
        const reason = prompt('Especifica el motivo de la cancelación de la solicitud:');
        if (reason === null) return; // Cancelado
        
        if (!reason.trim()) {
            alert('El motivo de la cancelación es obligatorio.');
            return;
        }

        const msg = `Solicitud cancelada. Motivo: ${reason}`;
        await handleUpdateStatus('cancelled', msg);
    }

    async function handleMarkAsPaid() {
        if (!request || updatingStatus) return;
        if (!confirm('¿Estás seguro de marcar esta solicitud como Reembolsada / Pagada?')) return;
        
        await handleUpdateStatus('paid', 'El reembolso ha sido procesado y pagado.');
    }

    async function handleScheduleAppointment() {
        if (!request || updatingStatus) return;
        if (!confirm('¿Estás seguro de marcar esta solicitud de cita como Agendada?')) return;
        
        await handleUpdateStatus('scheduled', 'Tu cita en el centro aliado ha sido agendada.');
    }

    async function handleCompleteRequest() {
        if (!request || updatingStatus) return;
        if (!confirm('¿Estás seguro de marcar esta solicitud como Finalizada y cerrar el caso?')) return;
        
        await handleUpdateStatus('completed', 'El caso de apoyo solidario ha sido finalizado.');
    }

    const openDocument = (doc: any) => {
        setSelectedDocument(doc);
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
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
            console.error('❌ Error downloading file:', error);
            // Fallback: abrir en pestaña nueva si falla el fetch (CORS u otros)
            window.open(url, '_blank');
        }
    };

    if (loading) return <div className={styles.loading}>Cargando detalle...</div>;
    if (!request) return <div className={styles.error}>No se encontró la solicitud.</div>;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button onClick={onClose} className={styles.backBtn}>←</button>
                        <div>
                            <h2 className={styles.title}>{request.case_title || `Solicitud #${request.id.slice(0,8)}`}</h2>
                            <span className={styles.subtitle}>ID: {request.id}</span>
                        </div>
                    </div>
                    <div className={styles.statusActions}>
                        <span className={styles.statusDisplay}>
                            Estado: <strong className={styles.statusTextBadge}>{SOLIDARITY_STATUS_LABELS[request.status as SolidarityRequestStatus] || request.status}</strong>
                        </span>
                    </div>
                </header>

                <div className={styles.body}>
                    <section className={styles.infoSection}>
                        <div className={styles.petCard}>
                            <img src={request.pet?.primary_photo_url || request.pet?.photo_url || ''} className={styles.petPhoto} />
                            <div>
                                <div className={styles.petName}>{request.pet?.name}</div>
                                <div className={styles.ownerName}>Dueño: {request.user?.first_name} {request.user?.paternal_last_name}</div>
                            </div>
                        </div>

                        <div className={styles.detailsList}>
                            <div className={styles.detailItem}>
                                <label>Tipo de Apoyo</label>
                                <span>{(SOLIDARITY_BENEFIT_LABELS as any)[request.benefit_type] || request.benefit_type}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <label>Monto Solicitado</label>
                                <span>${request.requested_amount}</span>
                            </div>
                            {request.approved_amount !== undefined && request.approved_amount !== null && (
                                <div className={styles.detailItem}>
                                    <label>Monto Aprobado</label>
                                    <span className={styles.approvedAmountText}>${request.approved_amount}</span>
                                </div>
                            )}
                            <div className={styles.detailItem}>
                                <label>Clínica</label>
                                <span>{request.clinic_name || 'N/A'}</span>
                            </div>
                        </div>
                        
                        {request.bank_clabe && (
                            <div className={styles.bankInfoBox}>
                                <label>Información Bancaria (Reembolso)</label>
                                <div className={styles.bankGrid}>
                                    <div className={styles.bankItem}>
                                        <label>Banco</label>
                                        <span>{request.bank_name}</span>
                                    </div>
                                    <div className={styles.bankItem}>
                                        <label>Titular</label>
                                        <span>{request.bank_holder}</span>
                                    </div>
                                    <div className={styles.bankItem}>
                                        <label>CLABE</label>
                                        <div className={styles.clabeWrap}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '15px' }}>{request.bank_clabe}</span>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(request.bank_clabe!);
                                                    alert('CLABE copiada al portapapeles');
                                                }}
                                                className={styles.copyBtn}
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.descriptionBox}>
                            <label>Descripción del caso</label>
                            <p>{request.case_description}</p>
                        </div>

                        {(request as any).documents && (request as any).documents.length > 0 && (
                            <div className={styles.documentsBox}>
                                <label>Documentos Adjuntos</label>
                                <div className={styles.docGrid}>
                                    {(request as any).documents.map((doc: any) => (
                                        <div key={doc.id} onClick={() => openDocument(doc)} className={styles.docItem} style={{ cursor: 'pointer' }}>
                                            <div className={styles.docIcon}>
                                                {doc.document_type === 'senior_certificate' ? '📜' : 
                                                 doc.document_type === 'evidence_photo' ? '📸' : 
                                                 doc.document_type === 'prescription' ? '💊' : '📄'}
                                            </div>
                                            <div className={styles.docInfo}>
                                                <div className={styles.docType}>
                                                    {doc.document_type === 'senior_certificate' ? 'Certificado Senior' : 
                                                     doc.document_type === 'evidence_photo' ? 'Evidencia' : 
                                                     doc.document_type === 'prescription' ? 'Receta' : 
                                                     doc.document_type === 'receipt' ? 'Comprobante' : 'Documento'}
                                                </div>
                                                <div className={styles.docName}>{doc.file_name || 'Ver archivo'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Panel de Acciones del Administrador */}
                        <div className={styles.adminActionsCard}>
                            <label className={styles.adminActionsLabel}>Panel de Control Administrativo</label>
                            <div className={styles.actionButtonGroup}>
                                {request.status === 'new' && (
                                    <>
                                        <button onClick={handleStartReview} className={styles.btnStartReview} disabled={updatingStatus}>
                                            🔍 Iniciar Revisión
                                        </button>
                                        <button onClick={handleRejectRequest} className={styles.btnReject} disabled={updatingStatus}>
                                            ❌ Rechazar
                                        </button>
                                        <button onClick={handleCancelRequest} className={styles.btnCancel} disabled={updatingStatus}>
                                            🚫 Cancelar
                                        </button>
                                    </>
                                )}

                                {(request.status === 'in_review' || request.status === 'needs_info') && (
                                    <>
                                        <button onClick={handleRequestMoreInfo} className={styles.btnRequestInfo} disabled={updatingStatus}>
                                            ❓ Solicitar Info
                                        </button>
                                        <button onClick={handleApproveRequest} className={styles.btnApprove} disabled={updatingStatus}>
                                            ✅ Aprobar Apoyo
                                        </button>
                                        <button onClick={handleRejectRequest} className={styles.btnReject} disabled={updatingStatus}>
                                            ❌ Rechazar
                                        </button>
                                        <button onClick={handleCancelRequest} className={styles.btnCancel} disabled={updatingStatus}>
                                            🚫 Cancelar
                                        </button>
                                    </>
                                )}

                                {request.status === 'approved' && (
                                    <>
                                        {request.type === 'allied_center_appointment' ? (
                                            <button onClick={handleScheduleAppointment} className={styles.btnSchedule} disabled={updatingStatus}>
                                                📅 Agendar Cita
                                            </button>
                                        ) : (
                                            <button onClick={handleMarkAsPaid} className={styles.btnPaid} disabled={updatingStatus}>
                                                💵 Registrar Reembolso
                                            </button>
                                        )}
                                        <button onClick={handleCompleteRequest} className={styles.btnComplete} disabled={updatingStatus}>
                                            ✓ Finalizar Caso
                                        </button>
                                        <button onClick={handleCancelRequest} className={styles.btnCancel} disabled={updatingStatus}>
                                            🚫 Cancelar
                                        </button>
                                    </>
                                )}

                                {(request.status === 'paid' || request.status === 'scheduled') && (
                                    <>
                                        <button onClick={handleCompleteRequest} className={styles.btnComplete} disabled={updatingStatus}>
                                            ✓ Finalizar Caso
                                        </button>
                                        <button onClick={handleCancelRequest} className={styles.btnCancel} disabled={updatingStatus}>
                                            🚫 Cancelar
                                        </button>
                                    </>
                                )}

                                {['completed', 'rejected', 'cancelled'].includes(request.status) && (
                                    <div className={styles.closedRequestMsg}>
                                        🔒 Caso cerrado (<strong>{SOLIDARITY_STATUS_LABELS[request.status as SolidarityRequestStatus] || request.status}</strong>)
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className={styles.chatSection}>
                        <div className={styles.chatHeader}>
                            <h3 className={styles.chatTitle}>Chat</h3>
                        </div>
                        <div className={styles.chatHistory} ref={chatRef}>
                            {messages.map(m => (
                                <div key={m.id} className={`${styles.message} ${styles[m.sender_role]}`}>
                                    <div className={styles.messageContent}>
                                        {m.message}
                                        {m.attachments?.map((a, i) => (
                                            <div key={i} onClick={() => openDocument(a)} className={styles.attachment} style={{ cursor: 'pointer' }}>
                                                📄 {a.name}
                                            </div>
                                        ))}
                                    </div>
                                    <span className={styles.timestamp}>
                                        {new Date(m.created_at).toLocaleTimeString('es-MX', {
                                            timeZone: 'America/Mexico_City',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.inputArea}>
                            {selectedFile && (
                                <div className={styles.fileIndicatorRow}>
                                    <span className={styles.fileIndicator}>
                                        📄 {selectedFile.name} (Listo para enviar)
                                    </span>
                                    <button onClick={() => setSelectedFile(null)} className={styles.removeFileBtn}>✕</button>
                                </div>
                            )}
                            <div className={styles.inputRow}>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleFileChange}
                            />
                            <button 
                                className={`${styles.attachBtn} ${selectedFile ? styles.hasFile : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                title="Adjuntar archivo"
                                disabled={sending || uploading}
                            >
                                📎
                            </button>

                            <textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje al usuario..."
                                className={styles.textarea}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />

                            <button 
                                onClick={handleSendMessage}
                                disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
                                className={styles.sendBtn}
                            >
                                {sending || uploading ? '...' : 'Enviar'}
                            </button>
                        </div>
                    </div>
                </section>
                </div>
            </div>

            {selectedDocument && (
                <div className={styles.viewerOverlay}>
                    <div className={styles.viewerHeader}>
                        <a 
                            href={selectedDocument.file_url || selectedDocument.url} 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDownload(selectedDocument.file_url || selectedDocument.url, selectedDocument.file_name || selectedDocument.name);
                            }}
                            className={styles.downloadBtn}
                        >
                            Descargar
                        </a>
                        <button onClick={() => setSelectedDocument(null)} className={styles.closeViewerBtn}>
                            Cerrar
                        </button>
                    </div>
                    <div className={styles.viewerContent}>
                        {(() => {
                            const url = selectedDocument.file_url || selectedDocument.url || selectedDocument.file_path || '';
                            const name = selectedDocument.file_name || selectedDocument.name || '';
                            const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
                            const isPDF = url.toLowerCase().includes('.pdf') || name.toLowerCase().endsWith('.pdf');
                            const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(url) || /\.(mp4|webm|mov)(\?.*)?$/i.test(name);

                            if (isImage) {
                                return <img src={url} alt="Vista previa" className={styles.viewerImage} />;
                            }
                            if (isPDF) {
                                return <iframe src={url} className={styles.pdfFrame} title="PDF Viewer" />;
                            }
                            if (isVideo) {
                                return (
                                    <video controls autoPlay className={styles.viewerVideo} style={{ maxWidth: '100%', maxHeight: '70vh' }}>
                                        <source src={url} />
                                        Tu navegador no soporta la reproducción de video.
                                    </video>
                                );
                            }
                            return (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <p>Este archivo no tiene vista previa disponible.</p>
                                    <a 
                                        href={url} 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDownload(url, name);
                                        }}
                                        className={styles.downloadBtn} 
                                        style={{ marginTop: '20px', display: 'inline-block' }}
                                    >
                                        Descargar para ver
                                    </a>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
