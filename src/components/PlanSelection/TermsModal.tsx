'use client';

import React, { useState, useEffect } from 'react';
import styles from './PlanSelection.module.css';

interface Document {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_name: string;
}

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchDocuments();
        }
    }, [isOpen]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/legal-documents');
            const data = await response.json();

            const hardcodedDoc: Document = {
                id: 'hardcoded-reglamento',
                title: 'Reglamento del fondo solidario "Club Pata Amiga"',
                description: 'Consulta las reglas y condiciones del fondo de apoyo.',
                file_url: 'https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6990f61b8bccea76df450705_REGLAMENTO%20DEL%20FONDO%20SOLIDARIO%20CLUB%20PATA%20AMIGA.zip',
                file_name: 'REGLAMENTO_CLUB_PATA_AMIGA.zip'
            };

            if (data.success) {
                setDocuments([hardcodedDoc, ...(data.documents || [])]);
            } else {
                setDocuments([hardcodedDoc]);
            }
        } catch (error) {
            console.error('Error fetching legal documents:', error);
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
                        Descarga y revisa los siguientes documentos antes de continuar con tu membresía.
                    </p>

                    {loading ? (
                        <div className={styles.loadingDocs}>
                            <div className={styles.spinner} />
                            <p>Cargando documentos...</p>
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
