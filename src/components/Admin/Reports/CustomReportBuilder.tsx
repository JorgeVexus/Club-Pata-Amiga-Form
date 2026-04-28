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

        const max = Math.max(...data.map(d => d.count || d.amount || d.value || 0)) || 10;
        const padding = 40;
        const width = 800;
        const height = 300;

        // Renderizado de Gráfica de Líneas
        if (chartType === 'line') {
            const points = data.map((d, i) => {
                const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
                const val = d.count || d.amount || d.value || 0;
                const y = height - padding - (val / max) * (height - padding * 2);
                return `${x},${y}`;
            }).join(' ');

            return (
                <div className={styles.chartWrapper}>
                    <svg viewBox={`0 0 ${width} ${height}`} className={styles.customChartExtended}>
                        {/* Grids and Axes */}
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                        
                        {/* Labels Y */}
                        {[0, 0.5, 1].map((p, i) => (
                            <text key={i} x={padding - 10} y={height - padding - p * (height - padding * 2)} textAnchor="end" fontSize="10" fill="#94a3b8">
                                {Math.round(p * max)}
                            </text>
                        ))}

                        {/* Area Gradient */}
                        <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`} fill="url(#lineGradient)" />
                        
                        {/* Line */}
                        <path d={`M ${points}`} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        
                        {/* Data Points */}
                        {data.map((d, i) => {
                            const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
                            const val = d.count || d.amount || d.value || 0;
                            const y = height - padding - (val / max) * (height - padding * 2);
                            return (
                                <g key={i} className={styles.dataPointGroup}>
                                    <circle cx={x} cy={y} r="4" fill="white" stroke="var(--color-primary)" strokeWidth="2" />
                                    <title>{`${d.date || d.name}: ${val}`}</title>
                                    {i % Math.ceil(data.length / 6) === 0 && (
                                        <text x={x} y={height - padding + 20} textAnchor="middle" fontSize="10" fill="#94a3b8">
                                            {(d.date || d.name || '').split('-').slice(-2).join('/')}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            );
        }

        // Renderizado de Gráfica de Barras
        if (chartType === 'bar') {
            const barWidth = ((width - padding * 2) / data.length) * 0.8;
            return (
                <div className={styles.chartWrapper}>
                    <svg viewBox={`0 0 ${width} ${height}`} className={styles.customChartExtended}>
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                        
                        {data.map((d, i) => {
                            const x = padding + (i / data.length) * (width - padding * 2) + (barWidth * 0.1);
                            const val = d.count || d.amount || d.value || 0;
                            const h = (val / max) * (height - padding * 2);
                            const y = height - padding - h;
                            
                            return (
                                <g key={i} className={styles.barGroup}>
                                    <rect 
                                        x={x} y={y} width={barWidth} height={h} 
                                        fill="var(--color-primary)" rx="4" opacity="0.8"
                                    />
                                    <title>{`${d.date || d.name}: ${val}`}</title>
                                    {i % Math.ceil(data.length / 8) === 0 && (
                                        <text x={x + barWidth / 2} y={height - padding + 20} textAnchor="middle" fontSize="10" fill="#94a3b8">
                                            {(d.date || d.name || '').split('-').slice(-2).join('/')}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            );
        }

        // Renderizado de Gráfica de Pie (Donut)
        if (chartType === 'pie') {
            let total = data.reduce((acc, d) => acc + (d.count || d.value || 0), 0);
            let currentAngle = 0;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 80;

            return (
                <div className={styles.chartWrapper}>
                    <svg viewBox={`0 0 ${width} ${height}`} className={styles.customChartExtended}>
                        <g transform={`translate(${centerX - 100}, 0)`}>
                            {data.map((d, i) => {
                                const val = d.count || d.value || 0;
                                const percentage = (val / total) * 100;
                                const angle = (val / total) * 360;
                                
                                // SVG Arc calculation
                                const x1 = centerX + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
                                const y1 = centerY + radius * Math.sin((currentAngle - 90) * Math.PI / 180);
                                currentAngle += angle;
                                const x2 = centerX + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
                                const y2 = centerY + radius * Math.sin((currentAngle - 90) * Math.PI / 180);
                                
                                const largeArc = angle > 180 ? 1 : 0;
                                const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                
                                const colors = ['#7DD8D5', '#00BBB4', '#FE8F15', '#2D3748', '#718096'];
                                const color = colors[i % colors.length];

                                return (
                                    <g key={i}>
                                        <path d={pathData} fill={color} stroke="white" strokeWidth="2">
                                            <title>{`${d.name || d.date}: ${val} (${percentage.toFixed(1)}%)`}</title>
                                        </path>
                                        {/* Legend in SVG */}
                                        <rect x={centerX + radius + 40} y={centerY - radius + i * 25} width="12" height="12" fill={color} rx="2" />
                                        <text x={centerX + radius + 60} y={centerY - radius + i * 25 + 10} fontSize="12" fill="#2d3748">
                                            {`${d.name || d.date}: ${val}`}
                                        </text>
                                    </g>
                                );
                            })}
                            <circle cx={centerX} cy={centerY} r={radius * 0.6} fill="white" />
                            <text x={centerX} y={centerY + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2d3748">Total: {total}</text>
                        </g>
                    </svg>
                </div>
            );
        }

        return null;
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
