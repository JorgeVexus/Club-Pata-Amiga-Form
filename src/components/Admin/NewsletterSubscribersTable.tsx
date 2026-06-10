'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './NewsletterSubscribersTable.module.css';
import { adminFetch } from '@/utils/admin-fetch';

interface NewsletterSubscriber {
    id: string;
    email: string;
    first_name: string | null;
    source: string;
    status: 'active' | 'unsubscribed' | 'bounced';
    subscribed_at: string | null;
    unsubscribed_at: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    page_url: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    updated_at: string;
}

interface NewsletterSubscribersTableProps {
    refreshKey?: number;
}

export default function NewsletterSubscribersTable({ refreshKey }: NewsletterSubscribersTableProps) {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed' | 'bounced'>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [sources, setSources] = useState<string[]>([]);

    const LIMIT = 50;

    const fetchSubscribers = async (exportFormat?: 'csv' | 'json') => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: LIMIT.toString(),
                status: statusFilter,
                search: search
            });

            if (sourceFilter !== 'all') params.append('source', sourceFilter);
            if (exportFormat) params.append('export', exportFormat);

            const response = await adminFetch(`/api/admin/newsletter?${params}`);
            const data = await response.json();

            if (exportFormat) {
                // Handle file download
                const blob = new Blob([JSON.stringify(data)], { type: exportFormat === 'csv' ? 'text/csv' : 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setExporting(false);
                return;
            }

            if (data.success) {
                setSubscribers(data.data);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
                
                // Extract unique sources
                const uniqueSources: string[] = [...new Set(data.data.map((s: NewsletterSubscriber) => s.source))].filter(Boolean) as string[];
                setSources(uniqueSources);
            } else {
                setError(data.error || 'Error al cargar suscriptores');
            }
        } catch (err) {
            console.error('Error fetching subscribers:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, [refreshKey, page, statusFilter, sourceFilter, search]);

    const debouncedSearch = useMemo(() => search, [search]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleExport = (format: 'csv' | 'json') => {
        setExporting(true);
        fetchSubscribers(format);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active': return styles.badgeActive;
            case 'unsubscribed': return styles.badgeInactive;
            case 'bounced': return styles.badgeBounced;
            default: return styles.badgeDefault;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'unsubscribed': return 'Desuscrito';
            case 'bounced': return 'Rebotado';
            default: return status;
        }
    };

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            'webflow': 'Webflow',
            'widget': 'Widget',
            'manual': 'Manual',
            'landing': 'Landing Page'
        };
        return labels[source] || source;
    };

    return (
        <div className={styles.container}>
            {/* Header with controls */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>📧 Suscriptores Newsletter</h2>
                    <span className={styles.count}>{total} suscriptores</span>
                </div>
                <div className={styles.headerRight}>
                    <button 
                        className={`${styles.exportBtn} ${exporting ? styles.loading : ''}`}
                        onClick={() => handleExport('csv')}
                        disabled={exporting || loading}
                    >
                        📥 CSV
                    </button>
                    <button 
                        className={`${styles.exportBtn} ${exporting ? styles.loading : ''}`}
                        onClick={() => handleExport('json')}
                        disabled={exporting || loading}
                    >
                        📥 JSON
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Buscar por email o nombre..."
                        value={debouncedSearch}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterSelect}
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">✅ Activos</option>
                        <option value="unsubscribed">❌ Desuscritos</option>
                        <option value="bounced">⚠️ Rebotados</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterSelect}
                        value={sourceFilter}
                        onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                    >
                        <option value="all">Todas las fuentes</option>
                        {sources.map(src => (
                            <option key={src} value={src}>{getSourceLabel(src)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className={styles.error}>{error}</div>
            )}

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>Cargando suscriptores...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Nombre</th>
                                <th>Fuente</th>
                                <th>Estado</th>
                                <th>Fecha Suscripción</th>
                                <th>UTM Source</th>
                                <th>UTM Campaign</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={styles.emptyState}>
                                        No se encontraron suscriptores
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((sub) => (
                                    <tr key={sub.id}>
                                        <td className={styles.emailCell}>{sub.email}</td>
                                        <td>{sub.first_name || '-'}</td>
                                        <td>
                                            <span className={styles.sourceBadge}>{getSourceLabel(sub.source)}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${getStatusBadgeClass(sub.status)}`}>
                                                {getStatusLabel(sub.status)}
                                            </span>
                                        </td>
                                        <td>{formatDate(sub.subscribed_at)}</td>
                                        <td className={styles.utmCell}>{sub.utm_source || '-'}</td>
                                        <td className={styles.utmCell}>{sub.utm_campaign || '-'}</td>
                                        <td className={styles.ipCell}>{sub.ip_address || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ← Anterior
                    </button>
                    <span className={styles.pageInfo}>
                        Página {page} de {totalPages} ({total} total)
                    </span>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}