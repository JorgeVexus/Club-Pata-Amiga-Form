'use client';

import React, { useState, useEffect } from 'react';
import styles from './Reports.module.css';

type MetricType = 'members' | 'pets' | 'finance' | 'approvals';
type DimensionType = 'date' | 'type' | 'status' | 'plan';
type ChartType = 'line' | 'bar' | 'pie';

interface ChartData {
    name: string;
    value: number;
    color?: string;
    date?: string;
}

export default function CustomReportBuilder() {
    const [metric, setMetric] = useState<MetricType>('members');
    const [dimension, setDimension] = useState<DimensionType>('date');
    const [chartType, setChartType] = useState<ChartType>('line');
    const [range, setRange] = useState('30d');
    
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReportData();
    }, [metric, range]);

    const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/reports/analytics?metric=${metric}&range=${range}`);
            const result = await response.json();
            
            if (result.success) {
                // Adaptar datos según la métrica
                let processedData = [];
                if (metric === 'members') processedData = result.data.memberGrowth || [];
                else if (metric === 'pets') processedData = result.data.petDistribution || [];
                else if (metric === 'approvals') processedData = result.data.approvalStats || [];
                else if (metric === 'finance') processedData = result.data.revenueTrends || [];
                
                setData(processedData);
            } else {
                setError(result.error || 'Error al cargar datos');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const renderChart = () => {
        if (loading) return <div className={styles.loadingOverlay}><div className={styles.spinner}></div></div>;
        if (error) return <div className={styles.chartPlaceholder}><p>❌ {error}</p></div>;
        if (data.length === 0) return <div className={styles.chartPlaceholder}><p>No hay datos suficientes para generar este reporte.</p></div>;

        // Renderizado simplificado de gráficas con SVG
        if (chartType === 'line') {
            const max = Math.max(...data.map(d => d.count || d.amount || d.value || 0)) || 10;
            const points = data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const val = d.count || d.amount || d.value || 0;
                const y = 40 - (val / max) * 35;
                return `${x},${y}`;
            }).join(' ');

            return (
                <svg viewBox="0 0 100 40" className={styles.customChart}>
                    <path d={`M ${points}`} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
                    <path d={`M 0,40 L ${points} L 100,40 Z`} fill="var(--color-primary)" opacity="0.1" />
                </svg>
            );
        }

        if (chartType === 'bar') {
            const max = Math.max(...data.map(d => d.count || d.amount || d.value || 0)) || 10;
            return (
                <div className={styles.barArea} style={{ height: '200px' }}>
                    {data.map((d, i) => {
                        const val = d.count || d.amount || d.value || 0;
                        const h = (val / max) * 100;
                        return (
                            <div key={i} className={styles.barColumn}>
                                <div className={styles.bar} style={{ height: `${h}%` }}></div>
                                <span className={styles.barLabel}>{d.date || d.name}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className={styles.chartPlaceholder}>
                <span className={styles.placeholderIcon}>📊</span>
                <p>Vista previa de {metric} por {dimension}</p>
                <small>(Recharts recomendado para visualización avanzada)</small>
            </div>
        );
    };

    return (
        <section className={styles.builderSection}>
            <div className={styles.builderHeader}>
                <h3 className={styles.builderTitle}>Constructor de Reportes Personalizados</h3>
                <p className={styles.reportsSubtitle}>Selecciona las variables para generar inteligencia en tiempo real</p>
            </div>

            <div className={styles.builderControls}>
                <div className={styles.controlGroup}>
                    <label>Métrica</label>
                    <select 
                        className={styles.selectField} 
                        value={metric} 
                        onChange={(e) => setMetric(e.target.value as MetricType)}
                    >
                        <option value="members">Crecimiento de Miembros</option>
                        <option value="pets">Distribución de Mascotas</option>
                        <option value="finance">Ingresos y Finanzas</option>
                        <option value="approvals">Funnel de Aprobación</option>
                    </select>
                </div>

                <div className={styles.controlGroup}>
                    <label>Dimensión</label>
                    <select 
                        className={styles.selectField}
                        value={dimension}
                        onChange={(e) => setDimension(e.target.value as DimensionType)}
                    >
                        <option value="date">Tiempo (Día/Mes)</option>
                        <option value="type">Tipo de Mascota</option>
                        <option value="plan">Plan de Membresía</option>
                        <option value="status">Estado de Aprobación</option>
                    </select>
                </div>

                <div className={styles.controlGroup}>
                    <label>Rango de Tiempo</label>
                    <select 
                        className={styles.selectField}
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 90 días</option>
                        <option value="1y">Último año</option>
                    </select>
                </div>

                <div className={styles.controlGroup}>
                    <label>Tipo de Gráfica</label>
                    <select 
                        className={styles.selectField}
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as ChartType)}
                    >
                        <option value="line">Línea de Tendencia</option>
                        <option value="bar">Barras Comparativas</option>
                        <option value="pie">Distribución (Pie)</option>
                    </select>
                </div>
            </div>

            <div className={styles.previewArea}>
                {renderChart()}
            </div>

            <div className={styles.chartActions}>
                <button className={styles.btnSecondary} onClick={() => window.print()}>Imprimir Reporte</button>
                <button className={styles.btnPrimary} onClick={() => alert('Exportando a CSV...')}>Descargar CSV</button>
            </div>
        </section>
    );
}
