'use client';

import React from 'react';
import styles from './Reports.module.css';

export default function InteractiveReports() {
    // Mocked data for visual representation
    const memberGrowth = [30, 45, 42, 60, 75, 90, 110];
    const planDistribution = [
        { name: 'Plan Básico', value: 45, color: '#7DD8D5' },
        { name: 'Plan Estándar', value: 35, color: '#00BBB4' },
        { name: 'Plan Premium', value: 20, color: '#FE8F15' },
    ];

    return (
        <div className={styles.reportsContainer}>
            <div className={styles.reportsHeader}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.reportsTitle}>Gráficas e Inteligencia de Datos</h2>
                    <p className={styles.reportsSubtitle}>Visualización en tiempo real de la salud del Club</p>
                </div>
                <div className={styles.reportActions}>
                    <div className={styles.dateRange}>
                        <span>Últimos 30 días</span>
                        <span className={styles.arrow}>▼</span>
                    </div>
                    <button className={styles.exportButton}>Exportar PDF</button>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Crecimiento de Miembros (Line Chart) */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Crecimiento de Miembros</h3>
                        <span className={styles.growthBadge}>+15% ↑</span>
                    </div>
                    <div className={styles.chartArea}>
                        <svg viewBox="0 0 100 40" className={styles.lineChart}>
                            <path
                                d="M0,35 Q15,30 30,28 T60,15 T100,5"
                                fill="none"
                                stroke="#7DD8D5"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M0,35 Q15,30 30,28 T60,15 T100,5 L100,40 L0,40 Z"
                                fill="url(#gradient)"
                                opacity="0.2"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7DD8D5" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Distribución de Planes (Donut Chart) */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Distribución de Planes</h3>
                    </div>
                    <div className={styles.donutArea}>
                        <svg viewBox="0 0 36 36" className={styles.donutChart}>
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f3f4f6" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#7DD8D5" strokeWidth="3" strokeDasharray="45 100" strokeDashoffset="25" />
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#00BBB4" strokeWidth="3" strokeDasharray="35 100" strokeDashoffset="80" />
                            <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#FE8F15" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="115" />
                            <text x="18" y="20.5" className={styles.donutCenter}>100%</text>
                        </svg>
                        <div className={styles.legend}>
                            {planDistribution.map(plan => (
                                <div key={plan.name} className={styles.legendItem}>
                                    <span className={styles.dot} style={{ backgroundColor: plan.color }}></span>
                                    <span>{plan.name} ({plan.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Salud del Fondo Solidario (Bar Chart) */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Salud del Fondo Solidario</h3>
                        <span className={styles.amount}>$45,200 MXN</span>
                    </div>
                    <div className={styles.barArea}>
                        {[60, 80, 45, 90, 70, 85].map((h, i) => (
                            <div key={i} className={styles.barColumn}>
                                <div className={styles.bar} style={{ height: `${h}%` }}></div>
                                <span className={styles.barLabel}>S{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Efectividad de Embajadores (Mini Stats) */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Efectividad de Embajadores</h3>
                    </div>
                    <div className={styles.statsGrid}>
                        <div className={styles.miniStat}>
                            <span className={styles.miniLabel}>Conversión</span>
                            <span className={styles.miniValue}>24%</span>
                        </div>
                        <div className={styles.miniStat}>
                            <span className={styles.miniLabel}>Alcance</span>
                            <span className={styles.miniValue}>1.2k</span>
                        </div>
                        <div className={styles.miniStat}>
                            <span className={styles.miniLabel}>Códigos Activos</span>
                            <span className={styles.miniValue}>18</span>
                        </div>
                        <div className={styles.miniStat}>
                            <span className={styles.miniLabel}>Nuevos Hoy</span>
                            <span className={styles.miniValue}>+3</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
