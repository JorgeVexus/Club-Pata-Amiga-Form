import React from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import styles from './EmergencyReportTable.module.css';

interface EmergencyReportTableProps { refreshKey?: number; }

export default function EmergencyReportTable({ refreshKey }: EmergencyReportTableProps) {
    const [logs, setLogs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState({ total: 0, thisMonth: 0, uniqueUsers: 0 });
    const [filters, setFilters] = React.useState({ month: '', search: '', dateFrom: '', dateTo: '' });
    const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 25;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.month) params.append('month', filters.month);
            if (filters.search) params.append('search', filters.search);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            params.append('limit', '500');
            const response = await adminFetch('/api/admin/emergency-logs?' + params.toString());
            const data = await response.json();
            if (data.success && data.logs) {
                const enrichedLogs = data.logs.map((log: any) => ({
                    ...log,
                    user_name: log.user_first_name && log.user_last_name
                        ? log.user_first_name + ' ' + log.user_last_name
                        : log.user_email.split('@')[0],
                }));
                setLogs(enrichedLogs);
                const now = new Date();
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const thisMonthLogs = enrichedLogs.filter((l: any) => new Date(l.triggered_at) >= thisMonthStart);
                const uniqueUsers = new Set(enrichedLogs.map((l: any) => l.memberstack_id)).size;
                setStats({ total: enrichedLogs.length, thisMonth: thisMonthLogs.length, uniqueUsers });
            }
        } catch (error) { console.error('Error fetching emergency logs:', error); }
        finally { setLoading(false); }
    };

    React.useEffect(() => { fetchLogs(); }, [filters, refreshKey]);

    const handleSort = (key: string) => setSortConfig((p: any) => p?.key === key && p.direction === 'asc' ? { key, direction: 'desc' } : { key, direction: 'asc' });

    const sortKey = sortConfig?.key ?? '';
    const sortDir = sortConfig?.direction ?? 'asc';

    const sortedLogs = React.useMemo(() => {
        if (!sortConfig) return logs;
        return [...logs].sort((a: any, b: any) => {
            const aVal = a[sortKey]; const bVal = b[sortKey];
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [logs, sortConfig]);

    const filteredBySearch = React.useMemo(() => {
        if (!filters.search) return sortedLogs;
        const s = filters.search.toLowerCase();
        return sortedLogs.filter((l: any) => l.user_email.toLowerCase().includes(s) || (l.user_name || '').toLowerCase().includes(s) || l.memberstack_id.toLowerCase().includes(s) || l.phone_number.includes(s) || l.triggered_at.includes(s));
    }, [sortedLogs, filters.search]);

    const totalPages = Math.ceil(filteredBySearch.length / itemsPerPage);
    const paginatedLogs = filteredBySearch.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const exportToCSV = () => {
        const headers = ['ID', 'Miembro (Email)', 'Nombre', 'Memberstack ID', 'Telefono', 'Fecha y Hora', 'User Agent', 'IP'];
        const rows = filteredBySearch.map((log: any) => [log.id, log.user_email, log.user_name || '', log.memberstack_id, log.phone_number, new Date(log.triggered_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }), log.user_agent || '', log.ip_address || '']);
        const csvContent = [headers, ...rows].map((row: any[]) => row.map((cell: any) => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url);
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', 'reporte-emergencias-' + dateStr + '.csv'); link.style.visibility = 'hidden';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };
    const formatDate = (d: string) => new Date(d).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const getCurrentMonth = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); };

    if (loading) {
        return (
            <div className={styles.tableWrapper}>
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                    <p>Cargando reporte de emergencias...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.reportContainer}>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}><div className={styles.statIcon}>🚨</div><div className={styles.statInfo}><div className={styles.statValue}>{stats.total}</div><div className={styles.statLabel}>Total Activaciones</div></div></div>
                <div className={styles.statCard}><div className={styles.statIcon}>📅</div><div className={styles.statInfo}><div className={styles.statValue}>{stats.thisMonth}</div><div className={styles.statLabel}>Este Mes</div></div></div>
                <div className={styles.statCard}><div className={styles.statIcon}>👥</div><div className={styles.statInfo}><div className={styles.statValue}>{stats.uniqueUsers}</div><div className={styles.statLabel}>Usuarios Únicos</div></div></div>
            </div>

            <div className={styles.filtersBar}>
                <div className={styles.filterGroup}><label htmlFor="filter-month" className={styles.filterLabel}>Mes</label><input type="month" id="filter-month" className={styles.filterInput} value={filters.month || getCurrentMonth()} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFilters(p => ({...p, month: e.target.value})); setCurrentPage(1); }} /></div>
                <div className={styles.filterGroup}><label htmlFor="filter-search" className={styles.filterLabel}>Buscar</label><input type="text" id="filter-search" className={styles.filterInput} placeholder="Email, nombre, ID..." value={filters.search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFilters(p => ({...p, search: e.target.value})); setCurrentPage(1); }} /></div>
                <div className={styles.filterGroup}><label htmlFor="filter-from" className={styles.filterLabel}>Desde</label><input type="date" id="filter-from" className={styles.filterInput} value={filters.dateFrom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFilters(p => ({...p, dateFrom: e.target.value})); setCurrentPage(1); }} /></div>
                <div className={styles.filterGroup}><label htmlFor="filter-to" className={styles.filterLabel}>Hasta</label><input type="date" id="filter-to" className={styles.filterInput} value={filters.dateTo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFilters(p => ({...p, dateTo: e.target.value})); setCurrentPage(1); }} /></div>
                <div className={styles.filterActions}>
                    <button className={styles.exportBtn} onClick={exportToCSV} disabled={filteredBySearch.length === 0}>📥 Exportar CSV ({filteredBySearch.length})</button>
                    <button className={styles.clearBtn} onClick={() => { setFilters({month: getCurrentMonth(), search: '', dateFrom: '', dateTo: ''}); setCurrentPage(1); }}>Limpiar filtros</button>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {filteredBySearch.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🚨</div>
                        <div className={styles.emptyText}>No hay activaciones de emergencia</div>
                        <div className={styles.emptySubtext}>{filters.month ? 'No hay datos para ' + filters.month : 'Los usuarios con membresía activa verán el botón de emergencia'}</div>
                    </div>
                ) : (
                    <div>
                        <table className={styles.table}>
                            <thead><tr>
                                <th onClick={() => { const key = 'triggered_at'; setSortConfig(p => p?.key === key && p.direction === 'asc' ? {key, direction: 'desc'} : {key, direction: 'asc'}); }} className={styles.sortable}>Fecha y Hora {sortKey === 'triggered_at' ? sortDir === 'asc' ? ' ↑' : ' ↓' : ''}</th>
                                <th onClick={() => { const key = 'user_email'; setSortConfig(p => p?.key === key && p.direction === 'asc' ? {key, direction: 'desc'} : {key, direction: 'asc'}); }} className={styles.sortable}>Miembro (Email) {sortKey === 'user_email' ? sortDir === 'asc' ? ' ↑' : ' ↓' : ''}</th>
                                <th onClick={() => { const key = 'user_name'; setSortConfig(p => p?.key === key && p.direction === 'asc' ? {key, direction: 'desc'} : {key, direction: 'asc'}); }} className={styles.sortable}>Nombre {sortKey === 'user_name' ? sortDir === 'asc' ? ' ↑' : ' ↓' : ''}</th>
                                <th onClick={() => { const key = 'memberstack_id'; setSortConfig(p => p?.key === key && p.direction === 'asc' ? {key, direction: 'desc'} : {key, direction: 'asc'}); }} className={styles.sortable}>Memberstack ID {sortKey === 'memberstack_id' ? sortDir === 'asc' ? ' ↑' : ' ↓' : ''}</th>
                                <th>Teléfono</th><th>User Agent</th><th>IP</th>
                            </tr></thead>
                            <tbody>{paginatedLogs.map((log: any) => (
                                <tr key={log.id}>
                                    <td data-label="Fecha">{formatDate(log.triggered_at)}</td>
                                    <td data-label="Email">{log.user_email}</td>
                                    <td data-label="Nombre">{log.user_name || '-'}</td>
                                    <td data-label="Memberstack ID" style={{fontFamily: 'monospace', fontSize: '12px'}}>{log.memberstack_id}</td>
                                    <td data-label="Teléfono">{log.phone_number}</td>
                                    <td data-label="User Agent" style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{log.user_agent || '-'}</td>
                                    <td data-label="IP">{log.ip_address || '-'}</td>
                                </tr>
                            ))}</tbody></table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Anterior</button>
                    <span className={styles.pageInfo}>Página {currentPage} de {totalPages} ({filteredBySearch.length} registros)</span>
                    <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente →</button>
                </div>
            )}
        </div>
    );
}

const formatDate = (d: string) => new Date(d).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const getCurrentMonth = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); };