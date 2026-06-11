'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './WellnessLeadsTable.module.css';
import { adminFetch } from '@/utils/admin-fetch';

interface WellnessLead {
    id: string;
    establishment_name: string;
    contact_name: string | null;
    contact_role: string | null;
    email: string;
    phone: string | null;
    whatsapp: string | null;
    services: string[] | string;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    description: string | null;
    monthly_pets_estimate: number | null;
    has_vet: boolean;
    has_grooming: boolean;
    has_hotel: boolean;
    has_shop: boolean;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'duplicate';
    lead_score: number;
    assigned_to: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface WellnessLeadsTableProps {
    refreshKey?: number;
}

export default function WellnessLeadsTable({ refreshKey }: WellnessLeadsTableProps) {
    const [leads, setLeads] = useState<WellnessLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [assignedFilter, setAssignedFilter] = useState<string>('all');
    const [cityFilter, setCityFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [sources, setSources] = useState<string[]>([]);
    const [assignedAdmins, setAssignedAdmins] = useState<string[]>([]);

    const LIMIT = 50;

    const fetchLeads = async (exportFormat?: 'csv' | 'json') => {
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
            if (assignedFilter !== 'all') params.append('assignedTo', assignedFilter);
            if (cityFilter) params.append('city', cityFilter);
            if (exportFormat) params.append('export', exportFormat);

            const response = await adminFetch(`/api/admin/wellness-leads?${params}`);

            if (exportFormat) {
                // Handle file download - API returns blob, not JSON
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `wellness-leads-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setExporting(false);
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setLeads(data.data);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
                
                const uniqueSources: string[] = [...new Set(data.data.map((l: WellnessLead) => l.source))].filter(Boolean) as string[];
                setSources(uniqueSources);
                
                const uniqueAdmins = Array.from(new Set(data.data.map((l: WellnessLead) => l.assigned_to))).filter(Boolean) as string[];
                setAssignedAdmins(uniqueAdmins);
            } else {
                setError(data.error || 'Error al cargar leads');
            }
        } catch (err) {
            console.error('Error fetching wellness leads:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [refreshKey, page, statusFilter, sourceFilter, assignedFilter, cityFilter, search]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleExport = (format: 'csv' | 'json') => {
        setExporting(true);
        fetchLeads(format);
    };

    const handleStatusChange = async (leadId: string, newStatus: WellnessLead['status']) => {
        try {
            const response = await adminFetch('/api/admin/wellness-leads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId, status: newStatus })
            });
            const data = await response.json();
            if (data.success) {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            } else {
                alert('Error al actualizar: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        }
    };

    const handleAssignChange = async (leadId: string, adminName: string | null) => {
        try {
            const response = await adminFetch('/api/admin/wellness-leads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId, assigned_to: adminName })
            });
            const data = await response.json();
            if (data.success) {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_to: adminName } : l));
            }
        } catch (err) {
            console.error(err);
        }
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
            case 'new': return styles.badgeNew;
            case 'contacted': return styles.badgeContacted;
            case 'qualified': return styles.badgeQualified;
            case 'converted': return styles.badgeConverted;
            case 'lost': return styles.badgeLost;
            case 'duplicate': return styles.badgeDuplicate;
            default: return styles.badgeDefault;
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'new': '🆕 Nuevo',
            'contacted': '📞 Contactado',
            'qualified': '✅ Calificado',
            'converted': '🎉 Convertido',
            'lost': '❌ Perdido',
            'duplicate': '🔄 Duplicado'
        };
        return labels[status] || status;
    };

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            'webflow': '🌐 Webflow',
            'landing': '📄 Landing',
            'referral': '👥 Referido',
            'manual': '✏️ Manual',
            'social': '📱 Social Media',
            'google': '🔍 Google'
        };
        return labels[source] || source;
    };

    const renderServices = (services: string[] | string) => {
        if (Array.isArray(services)) {
            return services.join(', ');
        }
        return services || '-';
    };

    const renderStatusSelect = (lead: WellnessLead) => (
        <select
            className={styles.statusSelect}
            value={lead.status}
            onChange={(e) => handleStatusChange(lead.id, e.target.value as WellnessLead['status'])}
        >
            <option value="new">🆕 Nuevo</option>
            <option value="contacted">📞 Contactado</option>
            <option value="qualified">✅ Calificado</option>
            <option value="converted">🎉 Convertido</option>
            <option value="lost">❌ Perdido</option>
            <option value="duplicate">🔄 Duplicado</option>
        </select>
    );

    const renderAssignedSelect = (lead: WellnessLead) => (
        <select
            className={styles.assignedSelect}
            value={lead.assigned_to || ''}
            onChange={(e) => handleAssignChange(lead.id, e.target.value || null)}
        >
            <option value="">— Sin asignar —</option>
            {assignedAdmins.map(admin => (
                <option key={admin} value={admin}>{admin}</option>
            ))}
        </select>
    );

    return (
        <div className={styles.container}>
            {/* Header with controls */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>🏥 Leads Centros de Bienestar</h2>
                    <span className={styles.count}>{total} leads</span>
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
                        placeholder="Buscar establecimiento, contacto, email, ciudad..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterSelect}
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="new">🆕 Nuevo</option>
                        <option value="contacted">📞 Contactado</option>
                        <option value="qualified">✅ Calificado</option>
                        <option value="converted">🎉 Convertido</option>
                        <option value="lost">❌ Perdido</option>
                        <option value="duplicate">🔄 Duplicado</option>
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
                <div className={styles.filterGroup}>
                    <select
                        className={styles.filterSelect}
                        value={assignedFilter}
                        onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
                    >
                        <option value="all">Todos los asignados</option>
                        <option value="">— Sin asignar —</option>
                        {assignedAdmins.map(admin => (
                            <option key={admin} value={admin}>{admin}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Filtrar por ciudad..."
                        value={cityFilter}
                        onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className={styles.error}>{error}</div>
            )}

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>Cargando leads...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{width: '200px'}}>Establecimiento</th>
                                <th style={{width: '150px'}}>Contacto</th>
                                <th style={{width: '180px'}}>Email / Tel</th>
                                <th style={{width: '120px'}}>Servicios</th>
                                <th style={{width: '100px'}}>Ciudad / Estado</th>
                                <th style={{width: '80px'}}>Pets/Est</th>
                                <th style={{width: '100px'}}>Fuente</th>
                                <th style={{width: '140px'}}>Estado Lead</th>
                                <th style={{width: '60px'}}>Score</th>
                                <th style={{width: '120px'}}>Asignado</th>
                                <th style={{width: '130px'}}>Creado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className={styles.emptyState}>
                                        No se encontraron leads
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className={lead.status === 'new' ? styles.rowNew : ''}>
                                        <td className={styles.nameCell}>
                                            <div className={styles.establishmentName}>{lead.establishment_name}</div>
                                            {lead.description && (
                                                <div className={styles.description}>{lead.description.substring(0, 80)}...</div>
                                            )}
                                        </td>
                                        <td>
                                            <div>{lead.contact_name || '—'}</div>
                                            {lead.contact_role && (
                                                <div className={styles.contactRole}>{lead.contact_role}</div>
                                            )}
                                        </td>
                                        <td className={styles.contactCell}>
                                            <div className={styles.email}>{lead.email}</div>
                                            {lead.phone && <div className={styles.phone}>📞 {lead.phone}</div>}
                                            {lead.whatsapp && <div className={styles.phone}>💬 {lead.whatsapp}</div>}
                                        </td>
                                        <td className={styles.servicesCell}>
                                            {renderServices(lead.services)}
                                        </td>
                                        <td>
                                            <div>{lead.city || '—'}</div>
                                            {lead.state && <div className={styles.state}>{lead.state}</div>}
                                        </td>
                                        <td className={styles.scoreCell}>
                                            {lead.monthly_pets_estimate ? lead.monthly_pets_estimate.toLocaleString() : '—'}
                                        </td>
                                        <td>
                                            <span className={styles.sourceBadge}>{getSourceLabel(lead.source)}</span>
                                        </td>
                                        <td>
                                            {renderStatusSelect(lead)}
                                        </td>
                                        <td className={styles.scoreBadge}>{lead.lead_score}</td>
                                        <td>
                                            {renderAssignedSelect(lead)}
                                        </td>
                                        <td className={styles.dateCell}>{formatDate(lead.created_at)}</td>
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