'use client';

import React, { useState, useEffect } from 'react';
import { commService, CommTemplate } from '@/services/comm.service';
import styles from './TemplateManager.module.css';

interface TemplateManagerProps {
    audience?: 'member' | 'ambassador' | 'wellness-center' | 'general';
}

export default function TemplateManager({ audience = 'general' }: TemplateManagerProps) {
    const [templates, setTemplates] = useState<CommTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Partial<CommTemplate> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        setIsLoading(true);
        const result = await commService.getTemplates();
        if (result.success) {
            setTemplates(result.data || []);
        } else {
            alert('Error al cargar plantillas: ' + result.error);
        }
        setIsLoading(false);
    }

    // Filtrar plantillas por audiencia
    const filteredTemplates = templates.filter(t => {
        if (audience === 'general') return true;
        return t.audience === audience || t.audience === 'general' || !t.audience;
    });

    async function handleSave() {
        if (!editingTemplate?.name || !editingTemplate?.content) {
            alert('Por favor completa el nombre y el contenido');
            return;
        }

        setIsSaving(true);
        const result = await commService.saveTemplate(editingTemplate);
        if (result.success) {
            setEditingTemplate(null);
            loadTemplates();
        } else {
            alert('Error al guardar: ' + result.error);
        }
        setIsSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

        const result = await commService.deleteTemplate(id);
        if (result.success) {
            loadTemplates();
        } else {
            alert('Error al eliminar: ' + result.error);
        }
    }

    if (isLoading) return <div className={styles.loading}>Cargando plantillas...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Gestión de Plantillas ({audience})</h3>
                <button
                    className={styles.createButton}
                    onClick={() => setEditingTemplate({ 
                        type: 'email', 
                        name: '', 
                        content: '', 
                        subject: '', 
                        audience: audience 
                    })}
                >
                    + Nueva Plantilla
                </button>
            </div>

            <div className={styles.templateList}>
                {filteredTemplates.length === 0 ? (
                    <div className={styles.noData}>No hay plantillas para esta audiencia.</div>
                ) : (
                    filteredTemplates.map(template => (
                        <div key={template.id} className={styles.templateCard}>
                            <div className={styles.templateIcon}>
                                {template.type === 'email' ? '📧' : '💬'}
                            </div>
                            <div className={styles.templateInfo}>
                                <h4>{template.name}</h4>
                                <div className={styles.badgeGroup}>
                                    <span className={styles.badge}>{template.type}</span>
                                    <span className={`${styles.audienceBadge} ${styles[template.audience || 'general']}`}>
                                        {template.audience || 'general'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.templateActions}>
                                <button onClick={() => setEditingTemplate(template)}>✏️ Editar</button>
                                <button className={styles.deleteBtn} onClick={() => handleDelete(template.id)}>🗑️</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Edición */}
            {editingTemplate && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>{editingTemplate.id ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Nombre de la plantilla</label>
                                <input
                                    type="text"
                                    value={editingTemplate.name}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    placeholder="Ej: Bienvenida"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Audiencia</label>
                                <select
                                    value={editingTemplate.audience || 'general'}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, audience: e.target.value as any })}
                                >
                                    <option value="general">General</option>
                                    <option value="member">Miembros</option>
                                    <option value="ambassador">Embajadores</option>
                                    <option value="wellness-center">Centros de Bienestar</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Tipo</label>
                                <select
                                    value={editingTemplate.type}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, type: e.target.value as any })}
                                >
                                    <option value="email">Email</option>
                                    <option value="whatsapp">WhatsApp</option>
                                </select>
                            </div>
                        </div>

                        {editingTemplate.type === 'email' && (
                            <div className={styles.formGroup}>
                                <label>Asunto (Email)</label>
                                <input
                                    type="text"
                                    value={editingTemplate.subject || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    placeholder="¡Hola {{name}}!"
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Contenido</label>
                            <div className={styles.help}>
                                Usa variables entre llaves: <code>{`{{name}}`}</code>, <code>{`{{pet_name}}`}</code>, <code>{`{{date}}`}</code>
                            </div>
                            <textarea
                                rows={8}
                                value={editingTemplate.content}
                                onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                placeholder="Escribe tu mensaje aquí..."
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setEditingTemplate(null)}>Cancelar</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
