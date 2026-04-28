'use client';

import React, { useState } from 'react';
import styles from './Finance.module.css';

interface FinancialLedgerProps {
    type: 'memberships' | 'refunds' | 'wellness' | 'commissions';
}

export default function FinancialLedger({ type }: FinancialLedgerProps) {
    const titles = {
        memberships: 'Ingresos por Membresías',
        refunds: 'Reembolsos de Apoyos',
        wellness: 'Pagos a Centros de Bienestar',
        commissions: 'Comisiones de Embajadores'
    };

    return (
        <div className={styles.ledgerContainer}>
            <div className={styles.ledgerHeader}>
                <h2 className={styles.ledgerTitle}>{titles[type]}</h2>
                <div className={styles.ledgerActions}>
                    <button className={styles.exportButton}>Descargar Reporte (CSV)</button>
                </div>
            </div>

            <div className={styles.statsOverview}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total del Mes</span>
                    <span className={styles.statValue}>$0.00</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Transacciones</span>
                    <span className={styles.statValue}>0</span>
                </div>
            </div>

            <div className={styles.tablePlaceholder}>
                <p>Módulo de Finanzas en desarrollo. Los datos se sincronizarán con Stripe y Supabase próximamente.</p>
                <div className={styles.emptyIllustration}>📊</div>
            </div>
        </div>
    );
}
