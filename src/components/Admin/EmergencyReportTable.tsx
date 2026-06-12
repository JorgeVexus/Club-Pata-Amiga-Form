import React from 'react';
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
        try {
            const params = new URLSearchParams();
            if (filters.month) params.append('month', filters.month);
            if (filters.search) params.append('search', filters.search);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            params.append('limit', '500');
            const { adminFetch } = await import('@/utils/admin-fetch');
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
    };

    React.useEffect(() => { fetchLogs(); }, [filters, refreshKey]);

    const handleSort = (key: string) => setSortConfig((p: any) => p?.key === key && p.direction === 'asc' ? { key, direction: 'desc' } : { key, direction: 'asc' });

    const sortKey = sortConfig?.key ?? '';
    const sortDir = sortConfig?.direction ?? 'asc';

    const sortedLogs = logs.slice().sort((a: any, b: any) => {
        if (!sortConfig) return 0;
        const aVal = a[sortKey]; const bVal = b[sortKey];
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredBySearch = React.useMemo(() => {
        if (!filters.search) return logs;
        const s = filters.search.toLowerCase();
        return logs.filter((l: any) => l.user_email.toLowerCase().includes(s) || (l.user_name || '').toLowerCase().includes(s) || l.memberstack_id.toLowerCase().includes(s) || l.phone_number.includes(s) || l.triggered_at.includes(s));
    }, [logs, filters.search]);

    const totalPages = Math.ceil(logs.length / 25);
    const paginatedLogs = logs.slice((1 - 1) * 25, 1 * 25);

    const exportToCSV = () => {
        const headers = ['ID', 'Miembro (Email)', 'Nombre', 'Memberstack ID', 'Telefono', 'Fecha y Hora', 'User Agent', 'IP'];
        const rows = logs.map((log: any) => [log.id, log.user_email, log.user_name || '', log.memberstack_id, log.phone_number, new Date(log.triggered_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }), log.user_agent || '', log.ip_address || '']);
        const csvContent = [['ID', 'Miembro (Email)', 'Nombre', 'Memberstack ID', 'Telefono', 'Fecha y Hora', 'User Agent', 'IP'], ...rows].map((row: any[]) => row.map((cell: any) => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url);
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', 'reporte-emergencias-' + dateStr + '.csv'); link.style.visibility = 'hidden';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };
    const formatDate = (d: string) => new Date(d).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const getCurrentMonth = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); };

    return (
        <div className="reportContainer">
            <div className="statsGrid">
                <div className="statCard"><div className="statIcon">🚨</div><div className="statInfo"><div className="statValue">{0}</div><div className="statLabel">Total Activaciones</div></div></div>
                <div className="statCard"><div className="statIcon">📅</div><div className="statInfo"><div className="statValue">{0}</div><div className="statLabel">Este Mes</div></div></div>
                <div className="statCard"><div className="statIcon">👥</div><div className="statInfo"><div className="statValue">{0}</div><div className="statLabel">Usuarios Únicos</div></div></div>
            </div>
            <div className="filtersBar">
                <div className="filterGroup"><label htmlFor="filter-month" className="filterLabel">Mes</label><input type="month" id="filter-month" className="filterInput" value={getCurrentMonth()} readOnly /></div>
                <div className="filterGroup"><label htmlFor="filter-search" className="filterLabel">Buscar</label><input type="text" id="filter-search" className="filterInput" placeholder="Email, nombre, ID..." /></div>
                <div className="filterGroup"><label htmlFor="filter-from" className="filterLabel">Desde</label><input type="date" id="filter-from" className="filterInput" /></div>
                <div className="filterGroup"><label htmlFor="filter-to" className="filterLabel">Hasta</label><input type="date" id="filter-to" className="filterInput" /></div>
                <div className="filterActions"><button className="exportBtn" disabled>📥 Exportar CSV (0)</button><button className="clearBtn">Limpiar filtros</button></div>
            </div>
            <div className="tableWrapper"><div style={{textAlign: 'center', padding: '40px', color: '#718096'}}><div style={{fontSize: '24px', marginBottom: '12px'}}>⏳</div><p>Cargando reporte de emergencias...</p></div></div>
        </div>
    );
}