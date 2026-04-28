'use client';

import React, { useState, useEffect } from 'react';
import styles from './Reports.module.css';
import CustomReportBuilder from './CustomReportBuilder';

export default function InteractiveReports() {
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30d');

    useEffect(() => {
        fetchAnalytics();
    }, [range]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/reports/analytics?range=${range}`);
            const result = await response.json();
            if (result.success) {
                setAnalyticsData(result.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    // Placeholder data while loading
    const memberGrowth = analyticsData?.memberGrowth?.map((d: any) => d.count) || [0, 0, 0, 0, 0];
    const planDistribution = analyticsData?.planDistribution || [
        { name: 'Plan Básico', value: 0, color: '#7DD8D5' },
        { name: 'Plan Estándar', value: 0, color: '#00BBB4' },
        { name: 'Plan Premium', value: 0, color: '#FE8F15' },
    ];
    const petDistribution = analyticsData?.petDistribution || [];
    const revenueTotal = analyticsData?.revenueTrends?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

    return (
        <div className={styles.reportsContainer}>
            <div className={styles.reportsHeader}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.reportsTitle}>Gráficas e Inteligencia de Datos</h2>
                    <p className={styles.reportsSubtitle}>Visualización en tiempo real de la salud del Club</p>
                </div>
                <div className={styles.reportActions}>
                    <select 
                        className={styles.selectField} 
                        style={{ width: 'auto', borderRadius: '50px' }}
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 90 días</option>
                        <option value="1y">Último año</option>
                    </select>
                    <button className={styles.exportButton} onClick={() => window.print()}>Exportar PDF</button>
                </div>
            </div>

            {loading ? (
                <div className={styles.loadingOverlay} style={{ position: 'relative', minHeight: '300px' }}>
                    <div className={styles.spinner}></div>
                </div>
            ) : (
                <div className={styles.grid}>
                    {/* Crecimiento de Miembros (Line Chart) */}
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3>Crecimiento de Miembros</h3>
                            <span className={styles.growthBadge}>Real Time</span>
                        </div>
                        <div className={styles.chartArea}>
                            <svg viewBox="0 0 100 40" className={styles.lineChart}>
                                <path
                                    d={memberGrowth.length > 1 
                                        ? `M ${memberGrowth.map((v: number, i: number) => `${(i / (memberGrowth.length - 1)) * 100},${40 - (v * 2)}`).join(' L ')}`
                                        : "M 0,35 L 100,35"}
                                    fill="none"
                                    stroke="#7DD8D5"
                                    strokeWidth="2"
                                    strokeLinecap="round"
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
                                {planDistribution.map((plan: any, i: number) => {
                                    const offset = planDistribution.slice(0, i).reduce((acc: number, p: any) => acc + p.value, 0);
                                    return (
                                        <circle 
                                            key={plan.name}
                                            cx="18" cy="18" r="15.9" 
                                            fill="transparent" 
                                            stroke={plan.color || (i === 0 ? '#7DD8D5' : i === 1 ? '#00BBB4' : '#FE8F15')} 
                                            strokeWidth="3" 
                                            strokeDasharray={`${plan.value} 100`} 
                                            strokeDashoffset={-offset + 25} 
                                        />
                                    );
                                })}
                                <text x="18" y="20.5" className={styles.donutCenter}>Data</text>
                            </svg>
                            <div className={styles.legend}>
                                {planDistribution.map((plan: any) => (
                                    <div key={plan.name} className={styles.legendItem}>
                                        <span className={styles.dot} style={{ backgroundColor: plan.color || '#ccc' }}></span>
                                        <span>{plan.name} ({plan.value}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ingresos (Bar Chart) */}
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3>Ingresos del Periodo</h3>
                            <span className={styles.amount}>{formatCurrency(revenueTotal)}</span>
                        </div>
                        <div className={styles.barArea}>
                            {(analyticsData?.revenueTrends || []).slice(-7).map((d: any, i: number) => (
                                <div key={i} className={styles.barColumn}>
                                    <div className={styles.bar} style={{ height: `${Math.min(100, (d.amount / 1000) * 100)}%` }}></div>
                                    <span className={styles.barLabel}>{d.date.split('-')[2]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Especies (Stats) */}
                    <div className={styles.chartCard}>
                        <div className={styles.chartHeader}>
                            <h3>Distribución de Especies</h3>
                        </div>
                        <div className={styles.statsGrid}>
                            {petDistribution.map((pet: any) => (
                                <div key={pet.name} className={styles.miniStat}>
                                    <span className={styles.miniLabel}>{pet.name}</span>
                                    <span className={styles.miniValue}>{pet.value}</span>
                                </div>
                            ))}
                            {petDistribution.length === 0 && <p>Cargando datos...</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Constructor de Reportes Personalizados */}
            <CustomReportBuilder />
        </div>
    );
}
