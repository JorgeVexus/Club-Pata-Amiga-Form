'use client';

import React, { useState, useEffect } from 'react';
import styles from './WellnessLeadsTable.module.css'; // Reutilizamos estilos del directorio de tablas de leads
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
                campaign: 'regalo' // Por defecto para la campaña regalo
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
                body: formData // Form data handles headers dynamically
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
        <div className={styles.container}>
            {/* Sección de Configuración de Campaña */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Caja de Cupón */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '2px solid #000', boxShadow: '4px 4px 0px #000' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏷️ Cupón de Descuento (Campaña Regalo)
                    </h3>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                        Ingresa el código del cupón de Stripe que se enviará automáticamente en el correo electrónico.
                    </p>
                    <form onSubmit={handleSaveCoupon} style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            placeholder="Ej. REGALOPATA10"
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value)}
                            style={{
                                flex: 1,
                                height: '42px',
                                border: '2px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '0 12px',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                            required
                        />
                        <button
                            type="submit"
                            disabled={savingCoupon}
                            style={{
                                background: '#fe8f15',
                                color: '#white',
                                border: '2px solid #000',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                padding: '0 16px',
                                cursor: 'pointer',
                                height: '42px',
                                boxShadow: '2px 2px 0px #000'
                            }}
                        >
                            {savingCoupon ? 'Guardando...' : 'Guardar'}
                        </button>
                    </form>
                </div>

                {/* Caja de PDF */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '2px solid #000', boxShadow: '4px 4px 0px #000' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📘 PDF del Regalo (Guía de Cuidado)
                    </h3>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                        Sube el archivo PDF que el usuario descargará al presionar el botón de descarga en el correo de regalo.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                style={{ fontSize: '13px' }}
                            />
                            {selectedFile && (
                                <button
                                    onClick={handleUploadPdf}
                                    disabled={uploadingPdf}
                                    style={{
                                        background: '#00BBB4',
                                        color: 'white',
                                        border: '2px solid #000',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        padding: '0 16px',
                                        cursor: 'pointer',
                                        height: '36px',
                                        boxShadow: '2px 2px 0px #000'
                                    }}
                                >
                                    {uploadingPdf ? 'Subiendo...' : 'Subir PDF'}
                                </button>
                            )}
                        </div>
                        {pdfUrl ? (
                            <div style={{ fontSize: '13px', color: '#2d3748' }}>
                                ✅ Archivo cargado en storage.{' '}
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#00BBB4', fontWeight: 'bold', textDecoration: 'underline' }}
                                >
                                    Descargar / Ver PDF actual
                                </a>
                            </div>
                        ) : (
                            <div style={{ fontSize: '13px', color: '#e53e3e', fontWeight: 'semibold' }}>
                                ⚠️ Ningún PDF cargado aún.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Panel de Filtros y Tabla */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className={styles.headerTitleContainer}>
                        <h2>👥 Leads Registrados</h2>
                        <span className={styles.tableSubtitle}>Total: {total} leads</span>
                    </div>

                    <div className={styles.headerActions}>
                        <div className={styles.searchWrapper}>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className={styles.searchInput}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className={styles.clearSearchBtn}>
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

                <div className={styles.tableContainer}>
                    <table className={styles.leadsTable}>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>UTM Source</th>
                                <th>UTM Medium</th>
                                <th>UTM Campaign</th>
                                <th>Estatus Correo</th>
                                <th>Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody>
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
                                        <td style={{ fontWeight: 'bold' }}>
                                            {lead.first_name} {lead.last_name}
                                        </td>
                                        <td>{lead.email}</td>
                                        <td>{lead.phone}</td>
                                        <td>
                                            <span className={styles.badge} style={{ background: lead.utm_source ? '#E2E8F0' : 'none' }}>
                                                {lead.utm_source || '-'}
                                            </span>
                                        </td>
                                        <td>{lead.utm_medium || '-'}</td>
                                        <td>{lead.utm_campaign || '-'}</td>
                                        <td>
                                            <span
                                                className={styles.statusBadge}
                                                style={{
                                                    background:
                                                        lead.gift_email_status === 'sent'
                                                            ? '#DEF7EC'
                                                            : lead.gift_email_status === 'failed'
                                                            ? '#FDE8E8'
                                                            : '#FEF08A',
                                                    color:
                                                        lead.gift_email_status === 'sent'
                                                            ? '#03543F'
                                                            : lead.gift_email_status === 'failed'
                                                            ? '#9B1C1C'
                                                            : '#713F12'
                                                }}
                                            >
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
                    <div className={styles.pagination}>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={styles.pageBtn}
                        >
                            Anterior
                        </button>
                        <span className={styles.pageIndicator}>
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={styles.pageBtn}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
