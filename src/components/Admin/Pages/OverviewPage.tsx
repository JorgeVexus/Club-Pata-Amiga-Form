'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import { formatMXN } from '@/utils/format';
import { useAdminSession } from '../Shell/useAdminSession';
import { usePendingCounts } from '../Shell/usePendingCounts';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import KpiCard from '../ui/KpiCard';
import PageContainer from '../ui/PageContainer';
import styles from './OverviewPage.module.css';
import type { DashboardMetrics } from '@/types/admin.types';

interface SolidarityRow {
    id: string;
    created_at: string;
    user_name: string;
    pet_name: string;
    requested_amount: number;
    benefit_type: string;
}

const BENEFIT_LABELS: Record<string, string> = {
    medical_emergency: 'Emergencia',
    death: 'Fallecimiento',
    vaccine: 'Vacuna',
};

export default function OverviewPage() {
    const session = useAdminSession();
    const counts = usePendingCounts(session.isSuperAdmin, !session.isLoading);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [queue, setQueue] = useState<SolidarityRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (session.isLoading) return;

        const load = async () => {
            try {
                const [metricsRes, queueRes] = await Promise.all([
                    adminFetch('/api/admin/metrics'),
                    adminFetch('/api/admin/solidarity/list?status=new&limit=5'),
                ]);
                const metricsData = await metricsRes.json();
                const queueData = await queueRes.json();
                if (metricsData.success) setMetrics(metricsData.metrics);
                if (queueData.success) setQueue(queueData.requests || []);
            } catch (error) {
                console.error('❌ Error cargando resumen:', error);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [session.isLoading]);

    if (isLoading || !metrics) {
        return <div className={styles.loading}>Cargando resumen…</div>;
    }

    return (
        <PageContainer>
            <PageHeader
                title={`Buenos días${session.adminName ? `, ${session.adminName}` : ''}`}
            />

            <div className={styles.kpiGrid}>
                <KpiCard
                    href="/admin/miembros"
                    label="Miembros activos"
                    value={metrics.totalMembers.toLocaleString('es-MX')}
                    note="con membresía vigente"
                />
                <KpiCard
                    href="/admin/reintegros"
                    label="Reintegros pendientes"
                    value={counts['solidarity-fund'].toLocaleString('es-MX')}
                    note="en cola de revisión"
                />
                <KpiCard
                    href="/admin/embajadores"
                    label="Embajadores"
                    value={metrics.totalAmbassadors.toLocaleString('es-MX')}
                    note="activos"
                    noteVariant="success"
                />
                <KpiCard
                    href="/admin/centros"
                    label="Centros aliados"
                    value={metrics.activeWellnessCenters.toLocaleString('es-MX')}
                    note="en el directorio"
                />
            </div>

            <div className={styles.growthGrid}>
                <KpiCard href="/admin/miembros" label="Miembros" value={counts.member} note="con mascotas pendientes" />
                <KpiCard href="/admin/mascotas" label="Bajas de mascotas" value={counts['pet-unsubscriptions']} note="por revisar" />
                <KpiCard href="/admin/embajadores" label="Embajadores" value={counts.ambassador} note="solicitudes pendientes" />
                <KpiCard href="/admin/centros" label="Centros" value={counts['wellness-center']} note="solicitudes pendientes" />
                <KpiCard href="/admin/reintegros" label="Reintegros" value={counts['solidarity-fund']} note="nuevas solicitudes" />
                {session.isSuperAdmin && (
                    <KpiCard href="/admin/apelaciones" label="Apelaciones" value={counts.appeals} note="por resolver" />
                )}
            </div>

            <div className={styles.queueGrid}>
                <Card>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Cola de reintegros</h2>
                        <a href="/admin/reintegros" className={styles.viewAll}>Ver todos →</a>
                    </div>
                    {queue.length === 0 && (
                        <span style={{ color: 'var(--panel-ink-secondary)', fontSize: 13 }}>
                            Sin solicitudes pendientes. 🎉
                        </span>
                    )}
                    {queue.map((req) => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '8px 0', borderBottom: '1px solid var(--panel-border-divider)' }}>
                            <span>{req.user_name} · {req.pet_name}</span>
                            <span>{BENEFIT_LABELS[req.benefit_type] ?? req.benefit_type}</span>
                            <strong>{formatMXN(Number(req.requested_amount || 0))}</strong>
                        </div>
                    ))}
                </Card>

                <Card>
                    <h2 className={styles.cardTitle}>Accesos rápidos</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <a href="/admin/mascotas" style={{ color: 'var(--panel-teal-deep)', fontWeight: 700 }}>🐾 Mascotas por aprobar</a>
                        <a href="/admin/embajadores" style={{ color: 'var(--panel-teal-deep)', fontWeight: 700 }}>🤝 Embajadores por aprobar</a>
                        <a href="/admin/centros" style={{ color: 'var(--panel-teal-deep)', fontWeight: 700 }}>📍 Centros por aprobar</a>
                        <a href="/admin/finanzas" style={{ color: 'var(--panel-teal-deep)', fontWeight: 700 }}>💰 Finanzas</a>
                    </div>
                </Card>
            </div>
        </PageContainer>
    );
}
