'use client';

import React, { useState, useEffect } from 'react';
import styles from './TermsModal.module.css';

interface Document {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_name: string;
    target_audience: 'members' | 'ambassadors' | 'both';
}

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDocuments();
        }
    }, [isOpen]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch documents for ambassadors (includes 'ambassadors' and 'both')
            const response = await fetch('/api/legal-documents?audience=ambassadors');
            const data = await response.json();

            if (data.success) {
                setDocuments(data.documents || []);
            } else {
                setError('Error al cargar los documentos');
            }
        } catch (error) {
            console.error('Error fetching legal documents:', error);
            setError('Error de conexión al cargar documentos');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>📋 Documentos Legales</h2>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.modalDescription}>
                        Descarga y revisa los siguientes documentos antes de enviar tu solicitud como embajador.
                        Es importante que conozcas todos los términos, condiciones y políticas del programa.
                    </p>

                    {loading ? (
                        <div className={styles.loadingDocs}>
                            <div className={styles.spinner} />
                            <p>Cargando documentos...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorState}>
                            <p>⚠️ {error}</p>
                            <button onClick={fetchDocuments} className={styles.retryBtn}>
                                Reintentar
                            </button>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className={styles.noDocs}>
                            <p>📄 No hay documentos disponibles en este momento.</p>
                            <p style={{ fontSize: '0.85rem', color: '#999' }}>
                                Los documentos serán publicados próximamente.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.docsList}>
                            {documents.map((doc) => (
                                <div key={doc.id} className={styles.docItem}>
                                    <div className={styles.docInfo}>
                                        <span className={styles.docIcon}>📄</span>
                                        <div>
                                            <div className={styles.docTitle}>{doc.title}</div>
                                            {doc.description && (
                                                <div className={styles.docDesc}>{doc.description}</div>
                                            )}
                                        </div>
                                    </div>
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={doc.file_name}
                                        className={styles.downloadBtn}
                                    >
                                        ⬇️ Descargar
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
