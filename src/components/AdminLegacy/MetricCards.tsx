'use client';

import React from 'react';
import styles from './MetricCards.module.css';
import type { DashboardMetrics } from '@/types/admin.types';

interface MetricCardsProps {
    metrics: DashboardMetrics;
    activeFilter?: string;
}

export default function MetricCards({ metrics, activeFilter }: MetricCardsProps) {
    return (
        <div className={styles.metricCards}>
            {/* Fondo Solidario */}
            <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                    <div className={`${styles.metricIcon} ${styles.yellow}`}>
                        💰
                    </div>
                </div>
                <div className={styles.metricValue}>
                    ${metrics.totalRefunds.toLocaleString()}
                </div>
                <div className={styles.metricLabel}>
                    Apoyo Económico
                </div>
            </div>

            {/* Centros Activos */}
            <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                    <div className={`${styles.metricIcon} ${styles.blue}`}>
                        🏥
                    </div>
                </div>
                <div className={styles.metricValue}>
                    {metrics.activeWellnessCenters}
                </div>
                <div className={styles.metricLabel}>
                    Centros Activos
                </div>
            </div>

            {/* Miembros */}
            <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                    <div className={`${styles.metricIcon} ${styles.green}`}>
                        👥
                    </div>
                </div>
                <div className={styles.metricValue}>
                    {activeFilter === 'solidarity-fund' ? metrics.totalRefunds : metrics.totalMembers}
                </div>
                <div className={styles.metricLabel}>
                    {activeFilter === 'solidarity-fund' ? 'Total Solicitudes' : 'Miembros'}
                </div>
            </div>

            {/* Embajadores */}
            <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                    <div className={`${styles.metricIcon} ${styles.orange}`}>
                        🎯
                    </div>
                </div>
                <div className={styles.metricValue}>
                    {metrics.totalAmbassadors}
                </div>
                <div className={styles.metricLabel}>
                    Embajadores
                </div>
            </div>
        </div>
    );
}
