'use client';

import React, { useState, useEffect } from 'react';
import { commService, CommTemplate } from '@/services/comm.service';
import { sendAdminEmail } from '@/app/actions/comm.actions';
import styles from './MessageSender.module.css';

interface Member {
    id: string;
    auth?: {
        email: string;
    };
    customFields: {
        'first-name'?: string;
        'paternal-last-name'?: string;
        'phone'?: string;
        'pet-1-name'?: string;
        'pet-2-name'?: string;
        'pet-3-name'?: string;
        [key: string]: any;
    };
}

interface MessageSenderProps {
    adminName: string;
}

export default function MessageSender({ adminName }: MessageSenderProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [templates, setTemplates] = useState<CommTemplate[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<CommTemplate | null>(null);
    const [processedContent, setProcessedContent] = useState('');
    const [processedSubject, setProcessedSubject] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        setIsLoading(true);
        try {
            // Cargar plantillas
            const tRes = await commService.getTemplates();
            if (tRes.success) setTemplates(tRes.data || []);

            // Cargar miembros (usando el endpoint existente de admin)
            const mRes = await fetch('/api/admin/members?status=all');
            const mData = await mRes.json();
            if (mData.success) setMembers(mData.members || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Al seleccionar miembro o plantilla, procesamos los placeholders
    useEffect(() => {
        if (selectedTemplate) {
            // Recolectar nombres de mascotas (aquellas que tengan valor)
            const petNames = [
                selectedMember?.customFields?.['pet-1-name'],
                selectedMember?.customFields?.['pet-2-name'],
                selectedMember?.customFields?.['pet-3-name']
            ].filter(Boolean) as string[];

            const vars = {
                name: selectedMember?.customFields?.['first-name'] || 'Usuario',
                pet_name: petNames.length > 0 ? petNames.join(' y ') : 'tu mascota',
                'pet-1-name': selectedMember?.customFields?.['pet-1-name'] || '',
                'pet-2-name': selectedMember?.customFields?.['pet-2-name'] || '',
                'pet-3-name': selectedMember?.customFields?.['pet-3-name'] || '',
                date: new Date().toLocaleDateString(),
            };

            setProcessedContent(commService.processPlaceholders(selectedTemplate.content, vars));
            if (selectedTemplate.subject) {
                setProcessedSubject(commService.processPlaceholders(selectedTemplate.subject, vars));
            }
        }
    }, [selectedMember, selectedTemplate]);

    const filteredMembers = members.filter(m => {
        const full = `${m.customFields?.['first-name']} ${m.customFields?.['paternal-last-name']}`.toLowerCase();
        const email = m.auth?.email?.toLowerCase() || '';
        return full.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    }).slice(0, 5);

    async function handleSendEmail() {
        if (!selectedMember || !selectedTemplate) return;
        const email = selectedMember.auth?.email;
        if (!email) {
            alert('El usuario no tiene email registrado en su cuenta (auth)');
            return;
        }

        setIsSending(true);
        const res = await sendAdminEmail({
            userId: selectedMember.id,
            adminId: adminName,
            to: email,
            subject: processedSubject || 'Notificación de Club Pata Amiga',
            content: processedContent,
            templateId: selectedTemplate.id
        });

        if (res.success) {
            alert('✅ Email enviado y registrado correctamente');
        } else {
            alert('❌ Error: ' + res.error);
        }
        setIsSending(false);
    }

    function handleWhatsApp() {
        if (!selectedMember) return;
        const phone = selectedMember.customFields.phone;
        if (!phone) {
            alert('El usuario no tiene teléfono registrado');
            return;
        }

        // Limpiar teléfono (solo números)
        const cleanPhone = phone.replace(/\D/g, '');
        const text = encodeURIComponent(processedContent);

        // Abrir WhatsApp
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');

        // Registrar log manual
        commService.logCommunication({
            user_id: selectedMember.id,
            admin_id: adminName,
            type: 'whatsapp',
            template_id: selectedTemplate?.id,
            status: 'sent',
            content: processedContent,
            metadata: { method: 'click-to-chat' }
        });
    }

    if (isLoading) return <div className={styles.loading}>Cargando datos...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                {/* Lado Izquierdo: Configuración */}
                <div className={styles.configSection}>
                    <div className={styles.formGroup}>
                        <label>1. Buscar Miembro</label>
                        <input
                            type="text"
                            placeholder="Nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.input}
                        />
                        {searchTerm && !selectedMember && (
                            <div className={styles.results}>
                                {filteredMembers.map(m => (
                                    <div
                                        key={m.id}
                                        className={styles.resultItem}
                                        onClick={() => {
                                            setSelectedMember(m);
                                            setSearchTerm(`${m.customFields?.['first-name']} ${m.customFields?.['paternal-last-name']}`);
                                        }}
                                    >
                                        {m.customFields?.['first-name']} {m.customFields?.['paternal-last-name']}
                                        <small>{m.auth?.email}</small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedMember && (
                        <div className={styles.selectedInfo}>
                            <span>👤 Destinatario: <strong>{selectedMember.customFields['first-name']}</strong></span>
                            <button onClick={() => { setSelectedMember(null); setSearchTerm(''); }}>Cambiar</button>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>2. Seleccionar Plantilla</label>
                        <select
                            className={styles.select}
                            onChange={(e) => {
                                const t = templates.find(t => t.id === e.target.value);
                                setSelectedTemplate(t || null);
                            }}
                            value={selectedTemplate?.id || ''}
                        >
                            <option value="">-- Elige una plantilla --</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>[{t.type.toUpperCase()}] {t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.emailBtn}
                            disabled={!selectedMember || !selectedTemplate || isSending || adminName === 'Cargando...'}
                            onClick={handleSendEmail}
                        >
                            {isSending ? 'Enviando...' : adminName === 'Cargando...' ? 'Identificando...' : '📧 Enviar Email'}
                        </button>
                        <button
                            className={styles.waBtn}
                            disabled={!selectedMember || !selectedTemplate || adminName === 'Cargando...'}
                            onClick={handleWhatsApp}
                        >
                            {adminName === 'Cargando...' ? 'Identificando...' : '💬 Abrir WhatsApp'}
                        </button>
                    </div>
                </div>

                {/* Lado Derecho: Preview */}
                <div className={styles.previewSection}>
                    <label>Vista Previa</label>
                    <div className={styles.previewCard}>
                        {selectedTemplate ? (
                            <>
                                {selectedTemplate.type === 'email' && (
                                    <div className={styles.previewSubject}>
                                        <strong>Asunto:</strong> {processedSubject}
                                    </div>
                                )}
                                <div className={styles.previewBody}>
                                    {processedContent.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>{line}<br /></React.Fragment>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className={styles.noPreview}>
                                Selecciona un miembro y una plantilla para ver la previsualización aquí.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
