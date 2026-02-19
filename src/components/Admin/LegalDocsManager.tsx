'use client';

import React, { useState, useEffect, useRef } from 'react';

type TargetAudience = 'members' | 'ambassadors' | 'both';

interface LegalDocument {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_name: string;
    display_order: number;
    is_active: boolean;
    target_audience: TargetAudience;
    created_at: string;
    updated_at: string;
}

const AUDIENCE_LABELS: Record<TargetAudience, string> = {
    members: '👤 Miembros',
    ambassadors: '⭐ Embajadores',
    both: '🌐 Ambos'
};

const AUDIENCE_BADGES: Record<TargetAudience, { bg: string; color: string }> = {
    members: { bg: '#e3f2fd', color: '#1565c0' },
    ambassadors: { bg: '#fff3e0', color: '#ef6c00' },
    both: { bg: '#f3e5f5', color: '#7b1fa2' }
};

export default function LegalDocsManager() {
    const [documents, setDocuments] = useState<LegalDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newAudience, setNewAudience] = useState<TargetAudience>('both');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editingDoc, setEditingDoc] = useState<string | null>(null);
    const [editAudience, setEditAudience] = useState<TargetAudience>('both');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await fetch('/api/legal-documents?audience=both');
            const data = await response.json();
            if (data.success) {
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file || !newTitle.trim()) {
            alert('Ingresa un título y selecciona un archivo PDF.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', newTitle.trim());
            formData.append('description', newDescription.trim());
            formData.append('target_audience', newAudience);

            const response = await fetch('/api/legal-documents', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setDocuments(prev => [...prev, data.document]);
                setNewTitle('');
                setNewDescription('');
                setNewAudience('both');
                setShowUploadForm(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                alert('✅ Documento subido exitosamente.');
            } else {
                alert('Error: ' + (data.error || 'Intenta de nuevo'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir el documento.');
        } finally {
            setUploading(false);
        }
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const response = await fetch(`/api/legal-documents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentActive }),
            });
            if (response.ok) {
                setDocuments(prev =>
                    prev.map(doc => doc.id === id ? { ...doc, is_active: !currentActive } : doc)
                );
            }
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const handleUpdateAudience = async (id: string) => {
        try {
            const response = await fetch(`/api/legal-documents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_audience: editAudience }),
            });
            if (response.ok) {
                setDocuments(prev =>
                    prev.map(doc => doc.id === id ? { ...doc, target_audience: editAudience } : doc)
                );
                setEditingDoc(null);
            }
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;

        try {
            const response = await fetch(`/api/legal-documents/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setDocuments(prev => prev.filter(doc => doc.id !== id));
                alert('Documento eliminado.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error al eliminar.');
        }
    };

    const containerStyle: React.CSSProperties = {
        padding: '0',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.4rem',
        fontWeight: 700,
        color: '#333',
    };

    const addBtnStyle: React.CSSProperties = {
        background: '#FF8C00',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '12px',
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    const formContainerStyle: React.CSSProperties = {
        background: '#f9f9f9',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid #eee',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid #ddd',
        fontSize: '0.95rem',
        marginBottom: '0.8rem',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    };

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid #ddd',
        fontSize: '0.95rem',
        marginBottom: '0.8rem',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        backgroundColor: 'white',
        cursor: 'pointer',
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse' as const,
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    };

    const thStyle: React.CSSProperties = {
        padding: '14px 16px',
        textAlign: 'left' as const,
        background: '#f5f5f5',
        fontWeight: 600,
        fontSize: '0.85rem',
        color: '#666',
        borderBottom: '1px solid #eee',
    };

    const tdStyle: React.CSSProperties = {
        padding: '14px 16px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '0.9rem',
        color: '#333',
    };

    const statusBadge = (active: boolean): React.CSSProperties => ({
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 600,
        background: active ? '#e7f9e7' : '#f5f5f5',
        color: active ? '#2e7d32' : '#999',
    });

    const audienceBadge = (audience: TargetAudience): React.CSSProperties => ({
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: AUDIENCE_BADGES[audience].bg,
        color: AUDIENCE_BADGES[audience].color,
    });

    const actionBtn = (variant: 'toggle' | 'delete' | 'view' | 'edit'): React.CSSProperties => ({
        padding: '6px 12px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        marginRight: '6px',
        marginBottom: '4px',
        background: variant === 'delete' ? '#ffebee' : variant === 'toggle' ? '#e3f2fd' : variant === 'edit' ? '#fff3e0' : '#f0f0f0',
        color: variant === 'delete' ? '#c62828' : variant === 'toggle' ? '#1565c0' : variant === 'edit' ? '#ef6c00' : '#555',
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                Cargando documentos...
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2 style={titleStyle}>📄 Documentos Legales</h2>
                <button
                    style={addBtnStyle}
                    onClick={() => setShowUploadForm(!showUploadForm)}
                >
                    {showUploadForm ? '✕ Cancelar' : '+ Subir Documento'}
                </button>
            </div>

            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Administra los documentos legales que se muestran a miembros y embajadores.
                Selecciona la audiencia para cada documento.
            </p>

            {/* Upload Form */}
            {showUploadForm && (
                <div style={formContainerStyle}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>
                        Subir nuevo documento
                    </h3>
                    <input
                        style={inputStyle}
                        type="text"
                        placeholder="Título del documento (ej: Términos y Condiciones)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <input
                        style={inputStyle}
                        type="text"
                        placeholder="Descripción breve (opcional)"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                    />
                    <select
                        style={selectStyle}
                        value={newAudience}
                        onChange={(e) => setNewAudience(e.target.value as TargetAudience)}
                    >
                        <option value="both">🌐 Ambos (Miembros y Embajadores)</option>
                        <option value="members">👤 Solo Miembros</option>
                        <option value="ambassadors">⭐ Solo Embajadores</option>
                    </select>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        style={{ ...inputStyle, padding: '8px' }}
                    />
                    <button
                        style={{ ...addBtnStyle, marginTop: '0.5rem', opacity: uploading ? 0.7 : 1 }}
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? '⏳ Subiendo...' : '📤 Subir Documento'}
                    </button>
                </div>
            )}

            {/* Documents Table */}
            {documents.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: '#f9f9f9',
                    borderRadius: '16px',
                    color: '#999',
                }}>
                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</p>
                    <p>No hay documentos legales aún.</p>
                    <p style={{ fontSize: '0.85rem' }}>
                        Sube tu primer documento usando el botón de arriba.
                    </p>
                </div>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>#</th>
                            <th style={thStyle}>Título</th>
                            <th style={thStyle}>Audiencia</th>
                            <th style={thStyle}>Archivo</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}>Fecha</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc, index) => (
                            <tr key={doc.id}>
                                <td style={tdStyle}>{index + 1}</td>
                                <td style={tdStyle}>
                                    <strong>{doc.title}</strong>
                                    {doc.description && (
                                        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '2px' }}>
                                            {doc.description}
                                        </div>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    {editingDoc === doc.id ? (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            <select
                                                style={{ ...selectStyle, marginBottom: '4px', fontSize: '0.8rem' }}
                                                value={editAudience}
                                                onChange={(e) => setEditAudience(e.target.value as TargetAudience)}
                                            >
                                                <option value="both">Ambos</option>
                                                <option value="members">Miembros</option>
                                                <option value="ambassadors">Embajadores</option>
                                            </select>
                                            <button
                                                style={{ ...actionBtn('toggle'), padding: '4px 8px', fontSize: '0.75rem' }}
                                                onClick={() => handleUpdateAudience(doc.id)}
                                            >
                                                ✓ Guardar
                                            </button>
                                            <button
                                                style={{ ...actionBtn('view'), padding: '4px 8px', fontSize: '0.75rem' }}
                                                onClick={() => setEditingDoc(null)}
                                            >
                                                ✕ Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <span
                                            style={audienceBadge(doc.target_audience)}
                                            onClick={() => {
                                                setEditingDoc(doc.id);
                                                setEditAudience(doc.target_audience);
                                            }}
                                            title="Click para cambiar"
                                        >
                                            {AUDIENCE_LABELS[doc.target_audience]}
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {doc.file_name}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={statusBadge(doc.is_active)}>
                                        {doc.is_active ? '✅ Activo' : '⏸️ Inactivo'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '0.85rem', color: '#888' }}>
                                        {new Date(doc.created_at).toLocaleDateString('es-MX')}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ ...actionBtn('view'), textDecoration: 'none', display: 'inline-block' }}
                                    >
                                        👁️ Ver
                                    </a>
                                    <button
                                        style={actionBtn('toggle')}
                                        onClick={() => handleToggleActive(doc.id, doc.is_active)}
                                    >
                                        {doc.is_active ? '⏸️ Desactivar' : '▶️ Activar'}
                                    </button>
                                    <button
                                        style={actionBtn('edit')}
                                        onClick={() => {
                                            setEditingDoc(doc.id);
                                            setEditAudience(doc.target_audience);
                                        }}
                                    >
                                        🎯 Audiencia
                                    </button>
                                    <button
                                        style={actionBtn('delete')}
                                        onClick={() => handleDelete(doc.id, doc.title)}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
