'use client';

import React, { useState, useEffect, useRef } from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import { supabase } from '@/lib/supabase';

type FileType = 'image' | 'pdf' | 'video' | 'other';

interface AmbassadorMaterial {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_name: string;
    file_type: FileType;
    file_size: number | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

const TYPE_LABELS: Record<FileType, string> = {
    image: '🖼️ Imagen',
    pdf: '📄 PDF',
    video: '🎬 Video',
    other: '📎 Otro',
};

const TYPE_BADGES: Record<FileType, { bg: string; color: string }> = {
    image: { bg: '#e3f2fd', color: '#1565c0' },
    pdf: { bg: '#ffebee', color: '#c62828' },
    video: { bg: '#f3e5f5', color: '#7b1fa2' },
    other: { bg: '#f5f5f5', color: '#666' },
};

function detectFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    return 'other';
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB (suficiente para video, sube directo a Storage)

export default function AmbassadorMaterialsManager() {
    const [materials, setMaterials] = useState<AmbassadorMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const response = await adminFetch('/api/admin/ambassador-materials');
            const data = await response.json();
            if (data.success) {
                setMaterials(data.materials || []);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file || !newTitle.trim()) {
            alert('Ingresa un título y selecciona un archivo.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert(`El archivo excede el límite de ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
            return;
        }

        if (!supabase) {
            alert('Supabase no está configurado en este entorno.');
            return;
        }

        setUploading(true);
        try {
            setUploadProgress('Preparando subida...');
            const urlRes = await adminFetch('/api/admin/ambassador-materials/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name }),
            });
            const urlData = await urlRes.json();
            if (!urlData.success) {
                throw new Error(urlData.error || 'No se pudo iniciar la subida');
            }

            setUploadProgress('Subiendo archivo...');
            const { error: uploadError } = await supabase.storage
                .from('ambassador-materials')
                .uploadToSignedUrl(urlData.path, urlData.token, file, {
                    contentType: file.type || undefined,
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('ambassador-materials')
                .getPublicUrl(urlData.path);

            setUploadProgress('Guardando información...');
            const fileType = detectFileType(file.type || '');
            const metaRes = await adminFetch('/api/admin/ambassador-materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    description: newDescription.trim(),
                    file_url: publicUrlData.publicUrl,
                    file_name: file.name,
                    file_type: fileType,
                    file_size: file.size,
                }),
            });
            const metaData = await metaRes.json();
            if (!metaData.success) {
                throw new Error(metaData.error || 'No se pudo registrar el material');
            }

            setMaterials(prev => [...prev, metaData.material]);
            setNewTitle('');
            setNewDescription('');
            setShowUploadForm(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            alert('✅ Material subido exitosamente.');
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Error al subir el material: ' + (error?.message || 'Intenta de nuevo'));
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const response = await adminFetch(`/api/admin/ambassador-materials/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentActive }),
            });
            if (response.ok) {
                setMaterials(prev =>
                    prev.map(m => m.id === id ? { ...m, is_active: !currentActive } : m)
                );
            }
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const handleMove = async (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= materials.length) return;

        const current = materials[index];
        const target = materials[targetIndex];

        const reordered = [...materials];
        reordered[index] = target;
        reordered[targetIndex] = current;
        setMaterials(reordered);

        try {
            await Promise.all([
                adminFetch(`/api/admin/ambassador-materials/${current.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ display_order: target.display_order }),
                }),
                adminFetch(`/api/admin/ambassador-materials/${target.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ display_order: current.display_order }),
                }),
            ]);
        } catch (error) {
            console.error('Reorder error:', error);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;

        try {
            const response = await adminFetch(`/api/admin/ambassador-materials/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setMaterials(prev => prev.filter(m => m.id !== id));
                alert('Material eliminado.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error al eliminar.');
        }
    };

    const containerStyle: React.CSSProperties = { padding: 0 };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
    };

    const titleStyle: React.CSSProperties = { fontSize: '1.4rem', fontWeight: 700, color: '#333' };

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

    const typeBadge = (type: FileType): React.CSSProperties => ({
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: TYPE_BADGES[type].bg,
        color: TYPE_BADGES[type].color,
    });

    const actionBtn = (variant: 'toggle' | 'delete' | 'view' | 'move'): React.CSSProperties => ({
        padding: '6px 12px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        marginRight: '6px',
        marginBottom: '4px',
        background: variant === 'delete' ? '#ffebee' : variant === 'toggle' ? '#e3f2fd' : variant === 'move' ? '#fff3e0' : '#f0f0f0',
        color: variant === 'delete' ? '#c62828' : variant === 'toggle' ? '#1565c0' : variant === 'move' ? '#ef6c00' : '#555',
    });

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Cargando materiales...</div>;
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2 style={titleStyle}>🎁 Materiales Digitales para Embajadores</h2>
                <button style={addBtnStyle} onClick={() => setShowUploadForm(!showUploadForm)}>
                    {showUploadForm ? '✕ Cancelar' : '+ Subir Material'}
                </button>
            </div>

            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Sube imágenes, PDFs o videos que los embajadores podrán ver y descargar desde su dashboard para usar en sus campañas.
            </p>

            {showUploadForm && (
                <div style={formContainerStyle}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>Subir nuevo material</h3>
                    <input
                        style={inputStyle}
                        type="text"
                        placeholder="Título (ej: Flyer redes sociales)"
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
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf,video/*"
                        style={{ ...inputStyle, padding: '8px' }}
                    />
                    <button
                        style={{ ...addBtnStyle, marginTop: '0.5rem', opacity: uploading ? 0.7 : 1 }}
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? `⏳ ${uploadProgress || 'Subiendo...'}` : '📤 Subir Material'}
                    </button>
                </div>
            )}

            {materials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#f9f9f9', borderRadius: '16px', color: '#999' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎁</p>
                    <p>No hay materiales aún.</p>
                    <p style={{ fontSize: '0.85rem' }}>Sube el primero usando el botón de arriba.</p>
                </div>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Orden</th>
                            <th style={thStyle}>Título</th>
                            <th style={thStyle}>Tipo</th>
                            <th style={thStyle}>Tamaño</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}>Fecha</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map((m, index) => (
                            <tr key={m.id}>
                                <td style={tdStyle}>
                                    <button style={actionBtn('move')} disabled={index === 0} onClick={() => handleMove(index, -1)}>↑</button>
                                    <button style={actionBtn('move')} disabled={index === materials.length - 1} onClick={() => handleMove(index, 1)}>↓</button>
                                </td>
                                <td style={tdStyle}>
                                    <strong>{m.title}</strong>
                                    {m.description && (
                                        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '2px' }}>{m.description}</div>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <span style={typeBadge(m.file_type)}>{TYPE_LABELS[m.file_type]}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>{formatFileSize(m.file_size)}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={statusBadge(m.is_active)}>{m.is_active ? '✅ Activo' : '⏸️ Inactivo'}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '0.85rem', color: '#888' }}>
                                        {new Date(m.created_at).toLocaleDateString('es-MX')}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <a
                                        href={m.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ ...actionBtn('view'), textDecoration: 'none', display: 'inline-block' }}
                                    >
                                        👁️ Ver
                                    </a>
                                    <button style={actionBtn('toggle')} onClick={() => handleToggleActive(m.id, m.is_active)}>
                                        {m.is_active ? '⏸️ Desactivar' : '▶️ Activar'}
                                    </button>
                                    <button style={actionBtn('delete')} onClick={() => handleDelete(m.id, m.title)}>
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
