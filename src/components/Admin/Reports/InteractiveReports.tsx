'use client';

import React from 'react';
import styles from './Reports.module.css';

export default function InteractiveReports() {
    return (
        <div className={styles.reportsContainer}>
            <div className={styles.reportsHeader}>
                <h2 className={styles.reportsTitle}>Gráficas e Inteligencia de Datos</h2>
                <div className={styles.dateRange}>
                    <span>Últimos 30 días</span>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.chartPlaceholder}>
                    <h3>Crecimiento de Miembros</h3>
                    <div className={styles.visual}>📈</div>
                </div>
                <div className={styles.chartPlaceholder}>
                    <h3>Distribución de Planes</h3>
                    <div className={styles.visual}>📊</div>
                </div>
                <div className={styles.chartPlaceholder}>
                    <h3>Salud del Fondo Solidario</h3>
                    <div className={styles.visual}>💰</div>
                </div>
                <div className={styles.chartPlaceholder}>
                    <h3>Efectividad de Embajadores</h3>
                    <div className={styles.visual}>🎯</div>
                </div>
            </div>

            <div className={styles.emptyNote}>
                <p>Las gráficas interactivas se habilitarán una vez que el histórico de datos sea suficiente para generar tendencias.</p>
            </div>
        </div>
    );
}
