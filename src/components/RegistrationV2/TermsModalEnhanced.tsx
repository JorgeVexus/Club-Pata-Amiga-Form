/**
 * Modal de Términos Mejorado - Versión Solo Lectura
 * Muestra los documentos y términos ya aceptados (modo revisión)
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from './TermsModalEnhanced.module.css';

interface Document {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_name: string;
    target_audience: 'members' | 'ambassadors' | 'both';
}

interface TermsAcceptance {
    termsAndConditions: boolean;
    privacyPolicy: boolean;
    marketingConsent: boolean;
    clickwrap: boolean;
}

interface TermsModalEnhancedProps {
    isOpen: boolean;
    onClose: (accepted: boolean, acceptance: TermsAcceptance) => void;
    initialAcceptance?: TermsAcceptance;
}

export default function TermsModalEnhanced({ isOpen, onClose, initialAcceptance }: TermsModalEnhancedProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estado de aceptación (solo informativo, no editable)
    const [acceptance] = useState<TermsAcceptance>({
        termsAndConditions: true,
        privacyPolicy: true,
        marketingConsent: true,
        clickwrap: true,
        ...initialAcceptance
    });

    useEffect(() => {
        if (isOpen) {
            fetchDocuments();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/legal-documents?audience=members');
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

    const handleClose = () => {
        onClose(true, acceptance);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>📋 Términos y Condiciones</h2>
                    <button className={styles.modalClose} onClick={handleClose}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    {/* Banner de términos ya aceptados */}
                    <div className={styles.acceptedBanner}>
                        <span className={styles.checkIcon}>✓</span>
                        <p>
                            <strong>Has aceptado los siguientes términos</strong><br />
                            Estos son los documentos y consentimientos que aceptaste para continuar.
                        </p>
                    </div>

                    {/* Sección de Documentos */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Documentos Legales</h3>
                        <p className={styles.sectionDescription}>
                            Descarga y revisa los siguientes documentos cuando lo necesites.
                        </p>

                        {loading ? (
                            <div className={styles.loadingState}>
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
                                <p>📄 No hay documentos disponibles.</p>
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

                    {/* Separador */}
                    <div className={styles.divider} />

                    {/* Sección de Consentimientos Aceptados */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Aceptaciones y Consentimientos</h3>
                        
                        <div className={styles.acceptedList}>
                            {/* Términos y Condiciones */}
                            <div className={styles.acceptedItem}>
                                <span className={styles.acceptedCheck}>✓</span>
                                <div className={styles.acceptedText}>
                                    <strong>Términos y Condiciones</strong>
                                    <span className={styles.required}>*</span>
                                    <small>
                                        He leído y acepto los términos y condiciones del servicio, 
                                        incluyendo las políticas de membresía, pagos y cancelación.
                                    </small>
                                </div>
                            </div>

                            {/* Aviso de Privacidad */}
                            <div className={styles.acceptedItem}>
                                <span className={styles.acceptedCheck}>✓</span>
                                <div className={styles.acceptedText}>
                                    <strong>Aviso de Privacidad</strong>
                                    <span className={styles.required}>*</span>
                                    <small>
                                        He leído el aviso de privacidad y autorizo el tratamiento de 
                                        mis datos personales conforme a la Ley Federal de Protección 
                                        de Datos Personales en Posesión de los Particulares.
                                    </small>
                                </div>
                            </div>

                            {/* Contrato de Membresía */}
                            <div className={styles.acceptedItem}>
                                <span className={styles.acceptedCheck}>✓</span>
                                <div className={styles.acceptedText}>
                                    <strong>Contrato de Membresía</strong>
                                    <span className={styles.required}>*</span>
                                    <small>
                                        Acepto que al hacer clic en &quot;Continuar al pago&quot; estoy firmando 
                                        electrónicamente el contrato de membresía y autorizo los cargos 
                                        recurrentes a mi método de pago seleccionado.
                                    </small>
                                </div>
                            </div>

                            {/* Marketing */}
                            <div className={`${styles.acceptedItem} ${styles.optional}`}>
                                <span className={styles.acceptedCheck}>✓</span>
                                <div className={styles.acceptedText}>
                                    <strong>Comunicaciones y Promociones</strong>
                                    <span className={styles.optionalBadge}>(Opcional)</span>
                                    <small>
                                        Acepto recibir comunicaciones, newsletters, promociones especiales 
                                        y novedades sobre productos y servicios.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button 
                        className={styles.understoodBtn}
                        onClick={handleClose}
                    >
                        Entendido ✓
                    </button>
                </div>
            </div>
        </div>
    );
}
