'use client';

import type { DashboardMetrics } from '@/types/admin.types';
import type { ActivityLog } from '../ActivityFeed';
import styles from './AdminOverview.module.css';

type AdminFilter = string | { id: string; subStatus: string };

interface AdminOverviewProps {
    metrics: DashboardMetrics;
    pendingCounts: Record<string, number>;
    recentActivityLogs: ActivityLog[];
    isSuperAdmin: boolean;
    onNavigate: (filter: AdminFilter) => void;
}

const money = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
});

export default function AdminOverview({
    metrics,
    pendingCounts,
    recentActivityLogs,
    isSuperAdmin,
    onNavigate,
}: AdminOverviewProps) {
    const queues = [
        { label: 'Mascotas por revisar', value: pendingCounts.member || 0, filter: 'member' },
        { label: 'Reintegros nuevos', value: pendingCounts['solidarity-fund'] || 0, filter: { id: 'solidarity-fund', subStatus: 'new' } },
        { label: 'Embajadores pendientes', value: pendingCounts.ambassador || 0, filter: 'ambassador' },
        { label: 'Centros pendientes', value: pendingCounts['wellness-center'] || 0, filter: 'wellness-center' },
        ...(isSuperAdmin ? [{ label: 'Apelaciones pendientes', value: pendingCounts.appeals || 0, filter: 'appeals' }] : []),
    ];

    const cards = [
        { eyebrow: 'Miembros activos', value: String(metrics.totalMembers), note: 'membresías vigentes' },
        { eyebrow: 'Reintegros aprobados', value: money.format(metrics.totalRefunds), note: 'monto aprobado acumulado' },
        { eyebrow: 'Embajadores', value: String(metrics.totalAmbassadors), note: 'embajadores aprobados' },
        { eyebrow: 'Centros aliados', value: String(metrics.activeWellnessCenters), note: 'activos en el directorio' },
    ];

    return (
        <section className={styles.overview} aria-label="Resumen administrativo">
            <div className={styles.metricGrid}>
                {cards.map((card) => (
                    <article className={styles.metricCard} key={card.eyebrow}>
                        <span>{card.eyebrow}</span>
                        <strong>{card.value}</strong>
                        <small>{card.note}</small>
                    </article>
                ))}
            </div>

            <div className={styles.workspaceGrid}>
                <section className={styles.panel}>
                    <div className={styles.panelHeading}>
                        <div>
                            <span className={styles.kicker}>Operación</span>
                            <h2>Colas pendientes</h2>
                        </div>
                        <span className={styles.totalPending}>
                            {queues.reduce((total, queue) => total + queue.value, 0)} pendientes
                        </span>
                    </div>
                    <div className={styles.queueList}>
                        {queues.map((queue) => (
                            <button type="button" key={queue.label} onClick={() => onNavigate(queue.filter)}>
                                <span>{queue.label}</span>
                                <strong>{queue.value}</strong>
                                <span className={styles.arrow} aria-hidden="true">→</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelHeading}>
                        <div>
                            <span className={styles.kicker}>Seguimiento</span>
                            <h2>Actividad reciente</h2>
                        </div>
                    </div>
                    {recentActivityLogs.length === 0 ? (
                        <p className={styles.empty}>Sin actividad reciente.</p>
                    ) : (
                        <div className={styles.activityList}>
                            {recentActivityLogs.slice(0, 5).map((log) => (
                                <article key={log.id}>
                                    <span className={styles.activityMark} data-type={log.type} />
                                    <div>
                                        <strong>{log.description || log.detail || `${log.type === 'approved' ? 'Aprobación' : 'Actualización'} de ${log.targetName}`}</strong>
                                        <small>{log.adminName} · {new Date(log.timestamp).toLocaleDateString('es-MX')}</small>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </section>
    );
}
