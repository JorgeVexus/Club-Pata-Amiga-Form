'use client';

import React, { useState, useEffect } from 'react';
import styles from './AmbassadorsTable.module.css';
import { Ambassador, AmbassadorStatus } from '@/types/ambassador.types';

interface AmbassadorsTableProps {
    onViewDetails: (ambassador: Ambassador) => void;
}

export default function AmbassadorsTable({ onViewDetails }: AmbassadorsTableProps) {
    const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<AmbassadorStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    // Cargar embajadores
    const loadAmbassadors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', currentPage.toString());
            params.append('limit', '10');

            const response = await fetch(`/api/ambassadors?${params}`);
            const data = await response.json();

            if (data.success) {
                setAmbassadors(data.data || []);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error loading ambassadors:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cargar estadísticas
    const loadStats = async () => {
        try {
            // Total
            const totalRes = await fetch('/api/ambassadors?limit=1');
            const totalData = await totalRes.json();

            // Pending
            const pendingRes = await fetch('/api/ambassadors?status=pending&limit=1');
            const pendingData = await pendingRes.json();

            // Approved
            const approvedRes = await fetch('/api/ambassadors?status=approved&limit=1');
            const approvedData = await approvedRes.json();

            setStats({
                total: totalData.total || 0,
                pending: pendingData.total || 0,
                approved: approvedData.total || 0,
                rejected: (totalData.total || 0) - (pendingData.total || 0) - (approvedData.total || 0)
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    useEffect(() => {
        loadAmbassadors();
    }, [statusFilter, searchQuery, currentPage]);

    useEffect(() => {
        loadStats();
    }, []);

    // Aprobar embajador
    const handleApprove = async (id: string) => {
        if (!confirm('¿Aprobar este embajador?')) return;

        try {
            const response = await fetch(`/api/ambassadors/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' })
            });

            const data = await response.json();
            if (data.success) {
                alert('Embajador aprobado correctamente');
                loadAmbassadors();
                loadStats();
            } else {
                alert(data.error || 'Error al aprobar');
            }
        } catch (error) {
            console.error('Error approving:', error);
            alert('Error de conexión');
        }
    };

    // Rechazar embajador
    const handleReject = async (id: string) => {
        const reason = prompt('Motivo del rechazo:');
        if (!reason) return;

        try {
            const response = await fetch(`/api/ambassadors/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
            });

            const data = await response.json();
            if (data.success) {
                alert('Solicitud rechazada');
                loadAmbassadors();
                loadStats();
            } else {
                alert(data.error || 'Error al rechazar');
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('Error de conexión');
        }
    };

    // Suspender embajador
    const handleSuspend = async (id: string) => {
        if (!confirm('¿Suspender este embajador?')) return;

        try {
            const response = await fetch(`/api/ambassadors/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'suspended' })
            });

            const data = await response.json();
            if (data.success) {
                alert('Embajador suspendido');
                loadAmbassadors();
                loadStats();
            } else {
                alert(data.error || 'Error al suspender');
            }
        } catch (error) {
            console.error('Error suspending:', error);
            alert('Error de conexión');
        }
    };

    const getStatusBadge = (status: AmbassadorStatus) => {
        const statusMap = {
            pending: { label: 'Pendiente', class: styles.statusPending },
            approved: { label: 'Aprobado', class: styles.statusApproved },
            rejected: { label: 'Rechazado', class: styles.statusRejected },
            suspended: { label: 'Suspendido', class: styles.statusSuspended }
        };
        const s = statusMap[status] || statusMap.pending;
        return <span className={`${styles.statusBadge} ${s.class}`}>{s.label}</span>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🎯</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.total}</div>
                        <div className={styles.statLabel}>Total Embajadores</div>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statPending}`}>
                    <div className={styles.statIcon}>⏳</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.pending}</div>
                        <div className={styles.statLabel}>Pendientes</div>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statApproved}`}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.approved}</div>
                        <div className={styles.statLabel}>Activos</div>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statRejected}`}>
                    <div className={styles.statIcon}>❌</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.rejected}</div>
                        <div className={styles.statLabel}>Rechazados</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.tabFilters}>
                    <button
                        className={`${styles.tabBtn} ${statusFilter === 'all' ? styles.active : ''}`}
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                    >
                        Todos
                    </button>
                    <button
                        className={`${styles.tabBtn} ${statusFilter === 'pending' ? styles.active : ''}`}
                        onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                    >
                        Pendientes
                        {stats.pending > 0 && <span className={styles.tabBadge}>{stats.pending}</span>}
                    </button>
                    <button
                        className={`${styles.tabBtn} ${statusFilter === 'approved' ? styles.active : ''}`}
                        onClick={() => { setStatusFilter('approved'); setCurrentPage(1); }}
                    >
                        Activos
                    </button>
                    <button
                        className={`${styles.tabBtn} ${statusFilter === 'rejected' ? styles.active : ''}`}
                        onClick={() => { setStatusFilter('rejected'); setCurrentPage(1); }}
                    >
                        Rechazados
                    </button>
                </div>

                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o código..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className={styles.searchInput}
                    />
                    <span className={styles.searchIcon}>🔍</span>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Cargando embajadores...</p>
                    </div>
                ) : ambassadors.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🎯</div>
                        <h3>No hay embajadores</h3>
                        <p>No se encontraron embajadores con los filtros actuales.</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Embajador</th>
                                <th>Código Referido</th>
                                <th>Referidos</th>
                                <th>Ganancias</th>
                                <th>Estado</th>
                                <th>Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ambassadors.map((amb) => (
                                <tr key={amb.id}>
                                    <td>
                                        <div className={styles.ambassadorInfo}>
                                            <div className={styles.avatar}>
                                                {amb.first_name[0]}{amb.paternal_surname[0]}
                                            </div>
                                            <div className={styles.details}>
                                                <div className={styles.name}>
                                                    {amb.first_name} {amb.paternal_surname}
                                                </div>
                                                <div className={styles.email}>{amb.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <code className={styles.referralCode}>{amb.referral_code}</code>
                                    </td>
                                    <td>
                                        <span className={styles.referralsCount}>
                                            {(amb as any).referrals_count || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.earnings}>
                                            <div className={styles.earningsTotal}>
                                                ${amb.total_earnings?.toFixed(2) || '0.00'}
                                            </div>
                                            {amb.pending_payout > 0 && (
                                                <div className={styles.earningsPending}>
                                                    Pendiente: ${amb.pending_payout.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(amb.status)}</td>
                                    <td className={styles.dateCell}>{formatDate(amb.created_at)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.btnView}
                                                onClick={() => onViewDetails(amb)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>

                                            {amb.status === 'pending' && (
                                                <>
                                                    <button
                                                        className={styles.btnApprove}
                                                        onClick={() => handleApprove(amb.id)}
                                                        title="Aprobar"
                                                    >
                                                        ✅
                                                    </button>
                                                    <button
                                                        className={styles.btnReject}
                                                        onClick={() => handleReject(amb.id)}
                                                        title="Rechazar"
                                                    >
                                                        ❌
                                                    </button>
                                                </>
                                            )}

                                            {amb.status === 'approved' && (
                                                <button
                                                    className={styles.btnSuspend}
                                                    onClick={() => handleSuspend(amb.id)}
                                                    title="Suspender"
                                                >
                                                    ⏸️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        ← Anterior
                    </button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}
