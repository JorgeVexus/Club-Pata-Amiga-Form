'use client';

import React, { useState, useEffect } from 'react';
import styles from './RequestsTable.module.css'; // Usamos las clases del RequestsTable para consistencia visual absoluta
import { adminFetch } from '@/utils/admin-fetch';

interface CampaignLead {
    id: string;
    campaign: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    gift_email_status: 'pending' | 'sent' | 'failed';
    gift_email_sent_at: string | null;
    created_at: string;
}

interface CampaignLeadsManagerProps {
    refreshKey?: number;
}

export default function CampaignLeadsManager({ refreshKey }: CampaignLeadsManagerProps) {
    const [leads, setLeads] = useState<CampaignLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Estados de configuración de campaña
    const [coupon, setCoupon] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [savingCoupon, setSavingCoupon] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const LIMIT = 50;

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: LIMIT.toString(),
                search: search,
                campaign: 'regalo'
            });

            const res = await adminFetch(`/api/admin/campaign-leads?${params}`);
            const data = await res.json();

            if (data.success) {
                setLeads(data.leads);
                setTotal(data.total);
                setTotalPages(data.totalPages);
                if (data.config) {
                    setCoupon(data.config.coupon || '');
                    setPdfUrl(data.config.pdfUrl || '');
                }
            } else {
                setError(data.error || 'Error al cargar datos');
            }
        } catch (err) {
            console.error('Error fetching campaign data:', err);
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, search, refreshKey]);

    const handleSaveCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingCoupon(true);
        try {
            const res = await adminFetch('/api/admin/campaign-leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coupon })
            });
            const data = await res.json();
            if (data.success) {
                alert('✨ ¡Cupón guardado correctamente!');
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (err) {
            alert('❌ Error de conexión al guardar el cupón');
        } finally {
            setSavingCoupon(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                alert('Solo se permiten archivos PDF.');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUploadPdf = async () => {
        if (!selectedFile) {
            alert('Por favor selecciona un archivo PDF primero.');
            return;
        }

        setUploadingPdf(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('campaign', 'regalo');

        try {
            const res = await adminFetch('/api/upload/campaign-pdf', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setPdfUrl(data.url);
                setSelectedFile(null);
                alert('✨ ¡PDF del regalo subido y configurado correctamente!');
            } else {
                alert('❌ Error al subir: ' + data.error);
            }
        } catch (err) {
            alert('❌ Error de conexión al subir el PDF');
        } finally {
            setUploadingPdf(false);
        }
    };

    return (
        <div className={styles.requestsContainer}>
            {/* Sección de Configuración de Campaña */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                
                {/* Caja de Cupón */}
                <div className={styles.requestsSection} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🏷️ Cupón de Descuento (Campaña Regalo)
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5, marginBottom: '20px' }}>
                            Ingresa el código del cupón de Stripe que se enviará automáticamente en el correo electrónico de regalo de la membresía.
                        </p>
                    </div>
                    <form onSubmit={handleSaveCoupon} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Ej. REGALOPATA10"
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value)}
                            style={{
                                flex: 1,
                                height: '40px',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '0 12px',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                            required
                        />
                        <button
                            type="submit"
                            disabled={savingCoupon}
                            style={{
                                background: '#fe8f15',
                                color: 'white',
                                border: '1px solid #000000',
                                borderRadius: '50px',
                                fontWeight: 'bold',
                                padding: '0 20px',
                                cursor: 'pointer',
                                height: '40px',
                                fontSize: '0.85rem',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                            {savingCoupon ? 'Guardando...' : 'Guardar'}
                        </button>
                    </form>
                </div>

                {/* Caja de PDF */}
                <div className={styles.requestsSection} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📘 PDF del Regalo (Guía de Cuidado)
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5, marginBottom: '20px' }}>
                            Sube el archivo PDF que el usuario descargará al presionar el botón de descarga en el correo de regalo.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* File Input Estilizado */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '40px',
                                background: '#F3F4F6',
                                border: '1px dashed #9CA3AF',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                padding: '0 12px',
                                fontSize: '0.8rem',
                                color: '#4B5563',
                                fontWeight: 500,
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                            }}>
                                📁 {selectedFile ? selectedFile.name : 'Seleccionar PDF...'}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            
                            {selectedFile && (
                                <button
                                    onClick={handleUploadPdf}
                                    disabled={uploadingPdf}
                                    style={{
                                        background: '#00BBB4',
                                        color: 'white',
                                        border: '1px solid #000000',
                                        borderRadius: '50px',
                                        fontWeight: 'bold',
                                        padding: '0 16px',
                                        cursor: 'pointer',
                                        height: '40px',
                                        fontSize: '0.85rem',
                                        transition: 'opacity 0.2s'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                                    onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                                >
                                    {uploadingPdf ? 'Subiendo...' : 'Subir'}
                                </button>
                            )}
                        </div>

                        {pdfUrl ? (
                            <div style={{ fontSize: '0.8rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <span>✅ Archivo en storage:</span>
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#008B85', textDecoration: 'underline' }}
                                >
                                    Descargar PDF actual
                                </a>
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>
                                ⚠️ Ningún PDF cargado aún.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla de Leads Registrados estilo RequestsTable */}
            <div className={styles.requestsSection}>
                <div className={styles.requestsHeader}>
                    <div className={styles.requestsTitle}>
                        👥 Leads Registrados ({total})
                    </div>

                    <div className={styles.requestsControls}>
                        <div className={styles.searchBox}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className={styles.searchInput}
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>
                </div>

                {error && <div className={styles.emptyState} style={{ color: '#ef4444' }}>⚠️ {error}</div>}

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>UTM Source</th>
                                <th>UTM Medium</th>
                                <th>UTM Campaign</th>
                                <th>Estatus Correo</th>
                                <th>Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className={styles.emptyState}>
                                        Cargando leads de regalo...
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={styles.emptyState}>
                                        No se encontraron registrados en esta campaña
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id}>
                                        <td style={{ fontWeight: 'bold', color: '#111827' }}>
                                            {lead.first_name} {lead.last_name}
                                        </td>
                                        <td>{lead.email}</td>
                                        <td>{lead.phone}</td>
                                        <td>
                                            {lead.utm_source ? (
                                                <span className={styles.infoStatusBadge} style={{ background: '#E5E7EB', color: '#374151' }}>
                                                    {lead.utm_source}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>{lead.utm_medium || '-'}</td>
                                        <td>{lead.utm_campaign || '-'}</td>
                                        <td>
                                            <span
                                                className={styles.statusBadge}
                                                style={{
                                                    background:
                                                        lead.gift_email_status === 'sent'
                                                            ? '#D1FAE5'
                                                            : lead.gift_email_status === 'failed'
                                                            ? '#FEE2E2'
                                                            : '#FEF3C7',
                                                    color:
                                                        lead.gift_email_status === 'sent'
                                                            ? '#065F46'
                                                            : lead.gift_email_status === 'failed'
                                                            ? '#991B1B'
                                                            : '#92400E'
                                                }}
                                            >
                                                <span className={styles.statusDot}></span>
                                                {lead.gift_email_status === 'sent'
                                                    ? 'Enviado'
                                                    : lead.gift_email_status === 'failed'
                                                    ? 'Fallido'
                                                    : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td>{new Date(lead.created_at).toLocaleString('es-MX')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={styles.tabBtn}
                            style={{ opacity: page === 1 ? 0.5 : 1 }}
                        >
                            Anterior
                        </button>
                        <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={styles.tabBtn}
                            style={{ opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
