'use client';

import React, { useState, useEffect } from 'react';
import { commService, CommTemplate } from '@/services/comm.service';
import { sendAdminEmail, sendCustomNotification } from '@/app/actions/comm.actions';
import { buildEmailPreview } from '@/utils/email-preview.utils';
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
    prefill?: { recipientId?: string; templateSearch?: string; isTermination?: boolean } | null;
    audience?: 'member' | 'ambassador' | 'wellness-center' | 'general';
}

export default function MessageSender({ adminName, prefill, audience = 'general' }: MessageSenderProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [templates, setTemplates] = useState<CommTemplate[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<CommTemplate | null>(null);
    const [processedContent, setProcessedContent] = useState('');
    const [processedSubject, setProcessedSubject] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [previewMode, setPreviewMode] = useState<'text' | 'html'>('text');

    useEffect(() => {
        loadInitialData();
    }, [audience]);

    async function loadInitialData() {
        setIsLoading(true);
        try {
            // 1. Cargar plantillas filtradas por audiencia
            const tRes = await commService.getTemplates();
            if (tRes.success) {
                const allTemplates = tRes.data || [];
                // Filtrar por audiencia exacta o por 'general'
                const filteredTemplates = allTemplates.filter(t => 
                    t.audience === audience || (!t.audience && audience === 'general')
                );
                setTemplates(filteredTemplates);
            }

            // 2. Cargar destinatarios según la audiencia
            if (audience === 'wellness-center') {
                setMembers([]); // Placeholder para Fase 2
            } else if (audience === 'ambassador') {
                // Fetch from ambassadors API
                const aRes = await fetch('/api/ambassadors?status=approved&limit=1000');
                const aData = await aRes.json();
                if (aData.success) {
                    // Mapear embajadores a la estructura de Member
                    const mappedAmbassadors: Member[] = (aData.data || []).map((amb: any) => ({
                        id: amb.id,
                        auth: { email: amb.email },
                        customFields: {
                            'first-name': amb.first_name,
                            'paternal-last-name': amb.paternal_surname,
                            'phone': amb.phone
                        }
                    }));
                    setMembers(mappedAmbassadors);
                }
            } else {
                // Fetch members (standard members)
                const mRes = await fetch('/api/admin/members?status=all');
                const mData = await mRes.json();
                if (mData.success) {
                    setMembers(mData.members || []);
                }
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Efecto para manejar el prefill una vez cargados los datos
    useEffect(() => {
        if (!isLoading && prefill) {
            if (prefill.recipientId) {
                const member = members.find(m => m.id === prefill.recipientId);
                if (member) {
                    setSelectedMember(member);
                    setSearchTerm(`${member.customFields?.['first-name']} ${member.customFields?.['paternal-last-name']}`);
                }
            }

            if (prefill.templateSearch) {
                const template = templates.find(t => 
                    t.name.toLowerCase().includes(prefill.templateSearch!.toLowerCase())
                );
                
                if (template) {
                    setSelectedTemplate(template);
                } else if (prefill.isTermination) {
                    // Fallback si no existe la plantilla en la DB
                    setSelectedTemplate({
                        id: 'default-baja',
                        name: 'Plantilla de Baja (Sistema)',
                        type: 'email',
                        subject: 'Notificación de Baja de Membresía',
                        content: 'Incumplimiento de las políticas de convivencia y bienestar animal de Club Pata Amiga.',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        audience: 'member'
                    });
                }
            }
        }
    }, [isLoading, prefill, members, templates]);

    // Al seleccionar miembro o plantilla, procesamos los placeholders
    useEffect(() => {
        if (selectedTemplate) {
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
        const first = m.customFields?.['first-name'] || '';
        const paternal = m.customFields?.['paternal-last-name'] || '';
        const full = `${first} ${paternal}`.toLowerCase();
        const email = m.auth?.email?.toLowerCase() || '';
        return full.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    }).slice(0, 5);

    async function handleSendEmail() {
        if (!selectedMember || !selectedTemplate) return;
        const email = selectedMember.auth?.email;
        if (!email) {
            alert('El usuario no tiene email registrado');
            return;
        }

        setIsSending(true);

        const res = await sendAdminEmail({
            userId: selectedMember.id,
            adminId: adminName,
            to: email,
            subject: processedSubject || 'Notificación de Club Pata Amiga',
            content: processedContent,
            templateId: selectedTemplate.id,
            audience: audience,
            memberName: selectedMember.customFields?.['first-name'] || 'Miembro'
        });

        if (res.success) {
            alert('✅ Email enviado y registrado correctamente');
        } else {
            alert('❌ Error: ' + res.error);
        }
        setIsSending(false);
    }

    async function handleFinalTermination() {
        if (!selectedMember) return;
        if (!window.confirm(`¿Estás seguro de ELIMINAR COMPLETAMENTE a ${selectedMember.customFields['first-name']}? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch(`/api/admin/members/${selectedMember.id}/delete`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert('✅ Usuario eliminado correctamente de Memberstack y Supabase');
                window.location.reload(); 
            } else {
                alert('❌ Error eliminando: ' + data.error);
            }
        } catch (e) {
            alert('❌ Error de conexión');
        } finally {
            setIsSending(false);
        }
    }

    async function handleSendCustom() {
        if (!selectedMember || !customTitle || !customMessage) return;

        setIsSending(true);
        const res = await sendCustomNotification({
            userId: selectedMember.id,
            adminId: adminName,
            title: customTitle,
            message: customMessage,
        });

        if (res.success) {
            alert('✅ Notificación personalizada enviada');
            setCustomTitle('');
            setCustomMessage('');
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

        const cleanPhone = phone.replace(/\D/g, '');
        const text = encodeURIComponent(processedContent);

        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');

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

    // Generar Preview Branded
    const emailHtmlPreview = buildEmailPreview({
        memberName: selectedMember?.customFields?.['first-name'] || 'Nombre del Miembro',
        subject: processedSubject || 'Asunto del Mensaje',
        content: processedContent || 'Contenido del mensaje seleccionado...',
        audience: audience
    });

    if (isLoading) return <div className={styles.loading}>Cargando datos...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                {/* Lado Izquierdo: Configuración */}
                <div className={styles.configSection}>
                    {audience === 'wellness-center' ? (
                        <div className={styles.placeholderBox}>
                            <h3>📍 Centros de Bienestar</h3>
                            <p>Esta funcionalidad estará disponible en la Fase 2 del proyecto.</p>
                            <span className={styles.soonBadge}>Próximamente</span>
                        </div>
                    ) : (
                        <>
                            <div className={styles.formGroup}>
                                <label>1. Buscar Destinatario ({
                                    audience === 'ambassador' ? 'Embajador' : 
                                    audience === 'member' ? 'Miembro' : 'General'
                                })</label>
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

                            <div className={styles.modeToggle} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <button
                                    className={`${styles.modeBtn} ${!isManualMode ? styles.activeMode : ''}`}
                                    onClick={() => setIsManualMode(false)}
                                >
                                    Usar Plantilla
                                </button>
                                <button
                                    className={`${styles.modeBtn} ${isManualMode ? styles.activeMode : ''}`}
                                    onClick={() => setIsManualMode(true)}
                                >
                                    Mensaje Libre (App)
                                </button>
                            </div>

                            {!isManualMode ? (
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
                                    {templates.length === 0 && (
                                        <p className={styles.emptyHint}>No hay plantillas específicas para esta audiencia.</p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={styles.formGroup}>
                                        <label>Título de la Alerta</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Ej: ¡Nuevo beneficio disponible!"
                                            value={customTitle}
                                            onChange={(e) => setCustomTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Mensaje (App)</label>
                                        <textarea
                                            className={styles.input}
                                            placeholder="Escribe el mensaje que el usuario verá en la app..."
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            rows={4}
                                            style={{ borderRadius: '10px', resize: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            <div className={styles.actions}>
                                {!isManualMode ? (
                                    <>
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
                                    </>
                                ) : (
                                    <button
                                        className={styles.emailBtn}
                                        style={{ gridColumn: 'span 2' }}
                                        disabled={!selectedMember || !customTitle || !customMessage || isSending || adminName === 'Cargando...'}
                                        onClick={handleSendCustom}
                                    >
                                        {isSending ? 'Enviando...' : '🔔 Enviar Notificación App'}
                                    </button>
                                )}
                            </div>

                            {prefill?.isTermination && selectedMember && (
                                <div className={styles.terminationWarning}>
                                    <h4 style={{ color: '#c53030', marginTop: 0 }}>⚠️ Flujo de Baja</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#742a2a' }}>
                                        Primero envía el aviso de baja al usuario. Una vez notificado, presiona el botón inferior para eliminarlo definitivamente.
                                    </p>
                                    <button
                                        className={styles.deleteBtn}
                                        disabled={isSending}
                                        onClick={handleFinalTermination}
                                    >
                                        {isSending ? 'Procesando...' : '🔥 Confirmar Baja Definitiva'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Lado Derecho: Preview */}
                <div className={styles.previewSection}>
                    <div className={styles.previewHeader}>
                        <label>Vista Previa</label>
                        {!isManualMode && selectedTemplate?.type === 'email' && (
                            <div className={styles.toggleGroup}>
                                <button 
                                    className={`${styles.toggleBtn} ${previewMode === 'text' ? styles.active : ''}`}
                                    onClick={() => setPreviewMode('text')}
                                >
                                    Texto
                                </button>
                                <button 
                                    className={`${styles.toggleBtn} ${previewMode === 'html' ? styles.active : ''}`}
                                    onClick={() => setPreviewMode('html')}
                                >
                                    Marca
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.previewCard}>
                        {isManualMode ? (
                            <div className={styles.pushPreview}>
                                <div className={styles.pushHeader}>
                                    <span className={styles.pushIcon}>🔔</span>
                                    <span className={styles.pushAppName}>Club Pata Amiga</span>
                                    <span className={styles.pushTime}>ahora</span>
                                </div>
                                <div className={styles.pushContent}>
                                    <div className={styles.pushTitle}>{customTitle || 'Título del mensaje'}</div>
                                    <div className={styles.pushMessage}>{customMessage || 'Contenido de la notificación...'}</div>
                                </div>
                            </div>
                        ) : selectedTemplate ? (
                            <>
                                {previewMode === 'html' && selectedTemplate.type === 'email' ? (
                                    <iframe 
                                        srcDoc={emailHtmlPreview}
                                        title="Email Preview"
                                        className={styles.htmlPreviewFrame}
                                    />
                                ) : (
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
                                )}
                            </>
                        ) : (
                            <div className={styles.noPreview}>
                                Selecciona un destinatario y una plantilla para ver la previsualización aquí.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

