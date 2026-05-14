'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import styles from './CancellationsTable.module.css';

interface Cancellation {
    id: string;
    memberstack_id: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    cancellation_date: string;
    membership_end_date: string;
    cancellation_reason: string;
    reason_other_text: string | null;
    comments: string | null;
    days_remaining_at_cancellation: number;
    subscription_interval: string | null;
}

interface CancellationStats {
    total_cancellations: number;
    last_7_days: number;
    last_30_days: number;
    avg_days_remaining: number;
    by_reason: Record<string, number>;
}

const REASON_LABELS: Record<string, string> = {
    no_longer_needed: 'Ya no necesita el servicio',
    price_too_high: 'Precio muy alto',
    found_alternative: 'Encontro alternativa',
    service_issues: 'Problemas con el servicio',
    other: 'Otro',
};

function formatDate(value: string) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function CancellationsTable() {
    const [cancellations, setCancellations] = useState<Cancellation[]>([]);
    const [stats, setStats] = useState<CancellationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        reason: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        loadCancellations();
    }, [filters.reason, filters.startDate, filters.endDate]);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const response = await adminFetch('/api/admin/cancellations/stats');
            const data = await response.json();
            if (data.success) setStats(data.stats);
        } catch (error) {
            console.error('[CancellationsTable] Error loading stats:', error);
        }
    }

    async function loadCancellations() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (filters.reason) params.set('reason', filters.reason);
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);

            const response = await adminFetch(`/api/admin/cancellations?${params.toString()}`);
            const data = await response.json();
            if (data.success) setCancellations(data.cancellations || []);
        } catch (error) {
            console.error('[CancellationsTable] Error loading cancellations:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <p className={styles.statValue}>{stats?.total_cancellations ?? '-'}</p>
                    <p className={styles.statLabel}>Cancelaciones totales</p>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statValue}>{stats?.last_7_days ?? '-'}</p>
                    <p className={styles.statLabel}>Ultimos 7 dias</p>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statValue}>{stats?.last_30_days ?? '-'}</p>
                    <p className={styles.statLabel}>Ultimos 30 dias</p>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statValue}>{stats?.avg_days_remaining ?? '-'}</p>
                    <p className={styles.statLabel}>Dias promedio restantes</p>
                </div>
            </div>

            <section className={styles.panel}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Membresias canceladas</h2>
                        <p className={styles.subtitle}>Historial auditable de cancelaciones solicitadas por usuarios.</p>
                    </div>
                    <div className={styles.filters}>
                        <select
                            className={styles.select}
                            value={filters.reason}
                            onChange={event => setFilters(prev => ({ ...prev, reason: event.target.value }))}
                        >
                            <option value="">Todas las razones</option>
                            {Object.entries(REASON_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <input
                            className={styles.input}
                            type="date"
                            value={filters.startDate}
                            onChange={event => setFilters(prev => ({ ...prev, startDate: event.target.value }))}
                        />
                        <input
                            className={styles.input}
                            type="date"
                            value={filters.endDate}
                            onChange={event => setFilters(prev => ({ ...prev, endDate: event.target.value }))}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>Cargando cancelaciones...</div>
                ) : cancellations.length === 0 ? (
                    <div className={styles.empty}>No hay cancelaciones con estos filtros.</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Miembro</th>
                                    <th>Fecha cancelacion</th>
                                    <th>Razon</th>
                                    <th>Comentarios</th>
                                    <th>Dias restantes</th>
                                    <th>Fin membresia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cancellations.map(item => {
                                    const fullName = `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() || 'Sin nombre';
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div className={styles.memberName}>{fullName}</div>
                                                <div className={styles.muted}>{item.user.email || item.memberstack_id}</div>
                                            </td>
                                            <td>{formatDate(item.cancellation_date)}</td>
                                            <td>
                                                <span className={styles.reasonBadge}>
                                                    {REASON_LABELS[item.cancellation_reason] || item.cancellation_reason}
                                                </span>
                                                {item.reason_other_text && (
                                                    <div className={styles.muted}>{item.reason_other_text}</div>
                                                )}
                                            </td>
                                            <td>{item.comments || <span className={styles.muted}>Sin comentarios</span>}</td>
                                            <td>{item.days_remaining_at_cancellation} dias</td>
                                            <td>{formatDate(item.membership_end_date)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
