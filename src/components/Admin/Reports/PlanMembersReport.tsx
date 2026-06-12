'use client';

import React, { useState, useEffect } from 'react';
import styles from './Reports.module.css';
import { adminFetch } from '@/utils/admin-fetch';

interface CancellationDetails {
    cancellationDate: string;
    endDate: string;
    reason: string;
    comments: string;
}

interface MemberReportData {
    id: string;
    email: string;
    name: string;
    registeredAt: string;
    status: 'active' | 'canceled' | 'past_due' | 'none';
    costText: string;
    amount: number;
    isAnnual: boolean;
    petCount: number;
    origin: 'Miembro' | 'Embajador';
    channel: 'Directo' | 'Referido';
    ambassadorCode: string | null;
    ambassadorName: string | null;
    isTest: boolean;
    crmContactId: string | null;
    cancellationDetails: CancellationDetails | null;
}

interface ReportMetrics {
    totalMembers: number;
    activeCount: number;
    cancelledCount: number;
    requiresPaymentCount: number;
    mrr: number;
    arr: number;
    testCount: number;
    productionCount: number;
}

export default function PlanMembersReport() {
    const [rawMembers, setRawMembers] = useState<MemberReportData[]>([]);
    const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // States for filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterOrigin, setFilterOrigin] = useState<string>('all');
    const [filterChannel, setFilterChannel] = useState<string>('all');
    const [filterMode, setFilterMode] = useState<string>('production'); // Default to show production accounts only
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [filterPets, setFilterPets] = useState<string>('all');
    const [syncingIds, setSyncingIds] = useState<string[]>([]);

    // Dynamic month list
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);

    useEffect(() => {
        fetchReportData();
    }, []);

    const handleSyncCRM = async (member: MemberReportData) => {
        if (syncingIds.includes(member.id)) return;
        setSyncingIds(prev => [...prev, member.id]);
        try {
            const planType = member.isAnnual ? 'Anual' : 'Mensual';
            const planCost = member.isAnnual ? '$1,699' : '$159';

            const payload = {
                membershipType: planType,
                membershipCost: planCost
            };

            const response = await adminFetch(`/api/admin/members/${member.id}/sync-crm?email=${encodeURIComponent(member.email)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                alert(`✅ CRM Sincronizado correctamente para ${member.name}`);
                setRawMembers(prev => prev.map(m => {
                    if (m.id === member.id) {
                        return {
                            ...m,
                            crmContactId: result.data?.crmContactId || 'Sincronizado'
                        };
                    }
                    return m;
                }));
            } else {
                alert(`❌ Error al sincronizar: ${result.error || 'Desconocido'}`);
            }
        } catch (err) {
            console.error('Error syncing CRM:', err);
            alert('❌ Error de red al sincronizar con CRM');
        } finally {
            setSyncingIds(prev => prev.filter(id => id !== member.id));
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminFetch('/api/admin/reports/plan-members');
            const data = await response.json();
            
            if (data.success) {
                setRawMembers(data.members || []);
                setMetrics(data.metrics || null);
                
                // Extract distinct registration months (YYYY-MM)
                const monthsSet = new Set<string>();
                data.members?.forEach((m: MemberReportData) => {
                    if (m.registeredAt) {
                        try {
                            const date = new Date(m.registeredAt);
                            if (!isNaN(date.getTime())) {
                                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                monthsSet.add(key);
                            }
                        } catch (e) {
                            // Ignorar fechas mal formateadas
                        }
                    }
                });
                
                setAvailableMonths(Array.from(monthsSet).sort().reverse());
            } else {
                setError(data.error || 'No se pudieron cargar los datos del reporte.');
            }
        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Error de comunicación con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    // Helper: format currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(val);
    };

    // Helper: format date (DD/MM/AAAA)
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return 'N/A';
        }
    };

    // Helper: get cancellation reason label in Spanish
    const getCancellationReasonLabel = (reason: string) => {
        const reasons: Record<string, string> = {
            no_longer_needed: 'Ya no la necesita',
            price_too_high: 'Precio muy alto',
            found_alternative: 'Encontró alternativa',
            service_issues: 'Problemas de servicio',
            other: 'Otro'
        };
        return reasons[reason] || reason;
    };

    // Apply filters to member list
    const filteredMembers = rawMembers.filter(m => {
        // Search filter (name, email)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const nameMatch = m.name.toLowerCase().includes(query);
            const emailMatch = m.email.toLowerCase().includes(query);
            if (!nameMatch && !emailMatch) return false;
        }

        // Mode filter (production, test, all)
        if (filterMode === 'production' && m.isTest) return false;
        if (filterMode === 'test' && !m.isTest) return false;

        // Plan status filter
        if (filterStatus !== 'all' && m.status !== filterStatus) return false;

        // Registration origin filter (Miembro vs Embajador)
        if (filterOrigin !== 'all' && m.origin !== filterOrigin) return false;

        // Capture channel filter (Directo vs Referido)
        if (filterChannel !== 'all' && m.channel !== filterChannel) return false;

        // Pet count filter
        if (filterPets === 'has_pets' && m.petCount === 0) return false;
        if (filterPets === 'no_pets' && m.petCount > 0) return false;

        // Month filter (YYYY-MM)
        if (filterMonth !== 'all') {
            try {
                const date = new Date(m.registeredAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (monthKey !== filterMonth) return false;
            } catch (e) {
                return false;
            }
        }

        return true;
    });

    // Handle CSV Export
    const handleExportCSV = () => {
        if (filteredMembers.length === 0) {
            alert('No hay miembros filtrados para exportar.');
            return;
        }

        // CSV Headers
        const headers = [
            'ID Memberstack',
            'Nombre',
            'Correo',
            'Fecha Registro',
            'Estatus Plan',
            'Costo',
            'Periodicidad',
            'Origen de Registro',
            'Canal de Captacion',
            'Codigo de Embajador',
            'Nombre de Embajador',
            'Modo de Datos',
            'ID Contacto CRM',
            'Mascotas Registradas',
            'Fecha Cancelacion',
            'Motivo Cancelacion',
            'Comentarios Cancelacion'
        ];

        // Format rows
        const rows = filteredMembers.map(m => [
            m.id,
            `"${m.name.replace(/"/g, '""')}"`,
            m.email,
            formatDate(m.registeredAt),
            m.status === 'active' ? 'Activo' : m.status === 'canceled' ? 'Cancelado' : m.status === 'past_due' ? 'Moroso / Requiere Pago' : 'Desconocido',
            m.amount,
            m.isAnnual ? 'Anual' : 'Mensual',
            m.origin,
            m.channel,
            m.ambassadorCode || '',
            m.ambassadorName ? `"${m.ambassadorName.replace(/"/g, '""')}"` : '',
            m.isTest ? 'Pruebas (Test Mode)' : 'Produccion (Live)',
            m.crmContactId || '',
            m.petCount,
            m.cancellationDetails ? formatDate(m.cancellationDetails.cancellationDate) : '',
            m.cancellationDetails ? getCancellationReasonLabel(m.cancellationDetails.reason) : '',
            m.cancellationDetails ? `"${(m.cancellationDetails.comments || '').replace(/\r?\n|\r/g, ' ').replace(/"/g, '""')}"` : ''
        ]);

        // Build CSV string with UTF-8 BOM for Excel compatibility
        const csvContent = '\uFEFF' + [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Dynamic file name
        const dateTag = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte-miembros-club-pata-amiga-${dateTag}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className={styles.loadingOverlay} style={{ position: 'relative', minHeight: '400px' }}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.chartPlaceholder} style={{ minHeight: '300px' }}>
                <p>❌ {error}</p>
                <button className={styles.btnSecondary} onClick={fetchReportData} style={{ marginTop: '1rem' }}>
                    Reintentar cargar datos
                </button>
            </div>
        );
    }

    // Helper: translate status in table
    const getStatusBadgeClass = (status: string) => {
        if (status === 'active') return styles.active;
        if (status === 'canceled') return styles.canceled;
        return styles.past_due; // past_due
    };

    const getStatusLabel = (status: string) => {
        if (status === 'active') return 'Activo';
        if (status === 'canceled') return 'Cancelado';
        return 'Requiere Pago';
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            {/* KPI Metrics Cards */}
            {metrics && (
                <div className={styles.kpisGrid}>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>👥</div>
                        <div className={styles.kpiInfo}>
                            <div className={styles.kpiValue}>
                                {filterMode === 'production' ? metrics.productionCount : filterMode === 'test' ? metrics.testCount : metrics.totalMembers}
                            </div>
                            <div className={styles.kpiLabel}>Miembros Registrados</div>
                        </div>
                    </div>
                    
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{ background: '#d1fae5' }}>✅</div>
                        <div className={styles.kpiInfo}>
                            <div className={styles.kpiValue}>
                                {filteredMembers.filter(m => m.status === 'active').length}
                            </div>
                            <div className={styles.kpiLabel}>Suscripciones Activas</div>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{ background: '#fee2e2' }}>⚠️</div>
                        <div className={styles.kpiInfo}>
                            <div className={styles.kpiValue}>
                                {filteredMembers.filter(m => m.status === 'past_due').length}
                            </div>
                            <div className={styles.kpiLabel}>Requieren Pago (Mora)</div>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{ background: '#f1f5f9' }}>🚫</div>
                        <div className={styles.kpiInfo}>
                            <div className={styles.kpiValue}>
                                {filteredMembers.filter(m => m.status === 'canceled').length}
                            </div>
                            <div className={styles.kpiLabel}>Membresías Canceladas</div>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon} style={{ background: '#e0f7fa' }}>📈</div>
                        <div className={styles.kpiInfo}>
                            <div className={styles.kpiValue}>
                                {formatCurrency(metrics.mrr)}
                            </div>
                            <div className={styles.kpiLabel}>MRR Estimado (Plan)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Filters Section */}
            <div className={styles.filtersGrid}>
                {/* Search */}
                <div className={styles.searchWrapper}>
                    <div className={styles.filterGroup}>
                        <label>Buscar Miembro</label>
                        <div className={styles.searchBox}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Nombre o correo electrónico..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Mode (Production / Test) */}
                <div className={styles.filterGroup}>
                    <label>Modo de Datos</label>
                    <select
                        className={styles.selectField}
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                    >
                        <option value="all">Ver Todos (Prod & Pruebas)</option>
                        <option value="production">Solo Producción (Reales)</option>
                        <option value="test">Solo Pruebas (Test Mode)</option>
                    </select>
                </div>

                {/* Status */}
                <div className={styles.filterGroup}>
                    <label>Estatus del Plan</label>
                    <select
                        className={styles.selectField}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los Estatus</option>
                        <option value="active">Activo</option>
                        <option value="past_due">Requiere Pago (Mora)</option>
                        <option value="canceled">Cancelado</option>
                    </select>
                </div>

                {/* Origin (Member vs Ambassador) */}
                <div className={styles.filterGroup}>
                    <label>Origen de Registro</label>
                    <select
                        className={styles.selectField}
                        value={filterOrigin}
                        onChange={(e) => setFilterOrigin(e.target.value)}
                    >
                        <option value="all">Todos los Orígenes</option>
                        <option value="Miembro">Solicitud de Miembro</option>
                        <option value="Embajador">Embajadores</option>
                    </select>
                </div>

                {/* Channel (Direct vs Referred) */}
                <div className={styles.filterGroup}>
                    <label>Método de Captación</label>
                    <select
                        className={styles.selectField}
                        value={filterChannel}
                        onChange={(e) => setFilterChannel(e.target.value)}
                    >
                        <option value="all">Todos los Canales</option>
                        <option value="Directo">Registro Directo</option>
                        <option value="Referido">Referido por Embajador</option>
                    </select>
                </div>

                {/* Month */}
                <div className={styles.filterGroup}>
                    <label>Mes de Registro</label>
                    <select
                        className={styles.selectField}
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    >
                        <option value="all">Todos los Meses</option>
                        {availableMonths.map(month => {
                            const [year, monthNum] = month.split('-');
                            const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                            const label = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
                            return (
                                <option key={month} value={month}>
                                    {label.charAt(0).toUpperCase() + label.slice(1)}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Pets */}
                <div className={styles.filterGroup}>
                    <label>Registro de Mascotas</label>
                    <select
                        className={styles.selectField}
                        value={filterPets}
                        onChange={(e) => setFilterPets(e.target.value)}
                    >
                        <option value="all">Todos</option>
                        <option value="has_pets">Con mascotas registradas</option>
                        <option value="no_pets">Sin mascotas registradas</option>
                    </select>
                </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                    Mostrando <strong>{filteredMembers.length}</strong> de {rawMembers.length} miembros.
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={styles.btnSecondary} onClick={fetchReportData}>
                        🔄 Refrescar
                    </button>
                    <button className={styles.btnPrimary} onClick={handleExportCSV}>
                        📥 Exportar a CSV
                    </button>
                </div>
            </div>

            {/* Members Table */}
            {filteredMembers.length === 0 ? (
                <div className={styles.chartPlaceholder} style={{ minHeight: '200px' }}>
                    <p>No se encontraron miembros para los filtros seleccionados.</p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th>Miembro</th>
                                <th>F. Registro</th>
                                <th>Origen</th>
                                <th>Canal</th>
                                <th>Estatus Plan</th>
                                <th>Costo / Ciclo</th>
                                <th>Mascotas</th>
                                <th>Modo</th>
                                <th>LynSales CRM</th>
                                <th>Detalle</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className={member.isTest ? styles.testRow : ''}>
                                    {/* Member Info */}
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{member.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.email}</span>
                                        </div>
                                    </td>
                                    
                                    {/* F. Registro */}
                                    <td>{formatDate(member.registeredAt)}</td>
                                    
                                    {/* Origen */}
                                    <td>
                                        <span className={`${styles.badge} ${member.origin === 'Embajador' ? styles.ambassador : styles.member}`}>
                                            {member.origin}
                                        </span>
                                    </td>
                                    
                                    {/* Canal */}
                                    <td>
                                        {member.channel === 'Referido' ? (
                                            <div className={`${styles.badge} ${styles.referred}`} title={`Referido por: ${member.ambassadorName || 'N/A'}`}>
                                                Referido ({member.ambassadorCode})
                                            </div>
                                        ) : (
                                            <span className={`${styles.badge} ${styles.direct}`}>
                                                Directo
                                            </span>
                                        )}
                                    </td>
                                    
                                    {/* Estatus */}
                                    <td>
                                        <span className={`${styles.badge} ${getStatusBadgeClass(member.status)}`}>
                                            {getStatusLabel(member.status)}
                                        </span>
                                    </td>
                                    
                                    {/* Costo / Ciclo */}
                                    <td>
                                        <span style={{ fontWeight: 500 }}>{member.costText}</span>
                                    </td>
                                    
                                    {/* Mascotas */}
                                    <td style={{ textAlign: 'center' }}>
                                        <strong style={{ fontSize: '1rem', color: member.petCount > 0 ? '#10b981' : '#f59e0b' }}>
                                            {member.petCount}
                                        </strong>
                                    </td>
                                    
                                    {/* Modo */}
                                    <td>
                                        <span className={`${styles.badge} ${member.isTest ? styles.testMode : styles.prodMode}`}>
                                            {member.isTest ? 'Prueba' : 'Producción'}
                                        </span>
                                    </td>
                                    
                                    {/* CRM */}
                                    <td>
                                        {member.crmContactId ? (
                                            <span className={styles.crmIdText} title={member.crmContactId}>
                                                ✅ {member.crmContactId.substring(0, 8)}...
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                                    ⚠️ Pendiente
                                                </span>
                                                {!member.isTest && (
                                                    <button 
                                                        className={styles.syncBtnSmall}
                                                        onClick={() => handleSyncCRM(member)}
                                                        disabled={syncingIds.includes(member.id)}
                                                    >
                                                        {syncingIds.includes(member.id) ? '⏳' : '🔄 Sincronizar'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    
                                    {/* Cancellation Details Tooltip */}
                                    <td>
                                        {member.status === 'canceled' && member.cancellationDetails ? (
                                            <div className={styles.tooltipContainer}>
                                                <span className={styles.infoIcon}>ℹ️</span>
                                                <div className={styles.tooltipText}>
                                                    <strong>F. Cancelación:</strong> {formatDate(member.cancellationDetails.cancellationDate)}<br/>
                                                    <strong>F. Fin Membresía:</strong> {formatDate(member.cancellationDetails.endDate)}<br/>
                                                    <strong>Motivo:</strong> {getCancellationReasonLabel(member.cancellationDetails.reason)}<br/>
                                                    {member.cancellationDetails.comments && (
                                                        <>
                                                            <strong>Comentarios:</strong> "{member.cancellationDetails.comments}"
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#cbd5e1' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
