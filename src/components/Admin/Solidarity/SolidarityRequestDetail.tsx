'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './SolidarityRequestDetail.module.css';
import { adminFetch } from '@/utils/admin-fetch';

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
    benefit_type: string;
    status: string;
    requested_amount: number;
    clinic_name?: string;
    case_title: string;
    case_description: string;
    created_at: string;
    pet?: any;
    user?: any;
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
    
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [requestId]);

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

    async function handleSendMessage() {
        if (!newMessage.trim() || sending) return;
        setSending(true);

        try {
            const res = await fetch(`/api/solidarity/requests/${requestId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage,
                    senderRole: 'admin',
                    senderId: adminMemberstackId
                })
            });
            const data = await res.json();
            if (data.id) {
                setMessages([...messages, data]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    }

    async function handleUpdateStatus(newStatus: string) {
        setUpdatingStatus(true);
        try {
            const res = await adminFetch(`/api/admin/solidarity/update`, {
                method: 'POST',
                body: JSON.stringify({
                    requestId,
                    status: newStatus,
                    adminId: adminMemberstackId,
                    adminName: 'Administrador'
                })
            });
            const data = await res.json();
            if (data.success) {
                setRequest(prev => prev ? { ...prev, status: newStatus } : null);
                loadMessages();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdatingStatus(false);
        }
    }

    async function loadMessages() {
        const msgRes = await adminFetch(`/api/solidarity/requests/${requestId}/messages`);
        const msgData = await msgRes.json();
        if (Array.isArray(msgData)) setMessages(msgData);
    }

    async function handleRequestMoreInfo() {
        if (updatingStatus) return;
        
        const confirmMsg = confirm('¿Deseas marcar esta solicitud como "Acción Requerida" y solicitar más información al usuario?');
        if (!confirmMsg) return;

        await handleUpdateStatus('needs_info');
        setNewMessage('Hola, hemos revisado tu solicitud y necesitamos que nos proporciones un poco más de información sobre: ');
        // Focus textarea
    }

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
                        <button 
                            onClick={handleRequestMoreInfo}
                            className={styles.infoBtn}
                            disabled={updatingStatus}
                        >
                            Solicitar Información
                        </button>
                        <select 
                            value={request.status} 
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            disabled={updatingStatus}
                            className={styles.statusSelect}
                        >
                            <option value="new">Nuevo</option>
                            <option value="in_review">En Revisión</option>
                            <option value="needs_info">Acción Requerida</option>
                            <option value="approved">Aprobado</option>
                            <option value="rejected">Rechazado</option>
                            <option value="paid">Pagado</option>
                            <option value="completed">Completado</option>
                        </select>
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
                                <span>{request.benefit_type}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <label>Monto</label>
                                <span>${request.requested_amount}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <label>Clínica</label>
                                <span>{request.clinic_name || 'N/A'}</span>
                            </div>
                        </div>

                        <div className={styles.descriptionBox}>
                            <label>Descripción del caso</label>
                            <p>{request.case_description}</p>
                        </div>

                        {(request as any).documents && (request as any).documents.length > 0 && (
                            <div className={styles.documentsBox}>
                                <label>Documentos Adjuntos</label>
                                <div className={styles.docGrid}>
                                    {(request as any).documents.map((doc: any) => (
                                        <a key={doc.id} href={doc.file_url} target="_blank" className={styles.docItem}>
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
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className={styles.chatSection}>
                        <div className={styles.chatHistory} ref={chatRef}>
                            {messages.map(m => (
                                <div key={m.id} className={`${styles.message} ${styles[m.sender_role]}`}>
                                    <div className={styles.messageContent}>
                                        {m.message}
                                        {m.attachments?.map((a, i) => (
                                            <a key={i} href={a.url} target="_blank" className={styles.attachment}>
                                                📄 {a.name}
                                            </a>
                                        ))}
                                    </div>
                                    <span className={styles.timestamp}>
                                        {new Date(m.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.inputArea}>
                            <textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje al usuario..."
                                className={styles.textarea}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || sending}
                                className={styles.sendBtn}
                            >
                                {sending ? '...' : 'Enviar'}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
