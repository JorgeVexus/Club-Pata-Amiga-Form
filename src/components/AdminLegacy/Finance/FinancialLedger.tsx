'use client';

import React, { useState } from 'react';
import styles from './Finance.module.css';

interface FinancialLedgerProps {
    type: 'memberships' | 'refunds' | 'wellness' | 'commissions';
}

export default function FinancialLedger({ type }: FinancialLedgerProps) {
    const titles = {
        memberships: 'Ingresos por Membresías',
        refunds: 'Reembolsos de Apoyos (Gastos Médicos)',
        wellness: 'Pagos a Centros de Bienestar',
        commissions: 'Comisiones de Embajadores'
    };

    return (
        <div className={styles.ledgerContainer}>
            <div className={styles.ledgerHeader}>
                <h2 className={styles.ledgerTitle}>{titles[type]}</h2>
                <div className={styles.syncStatus}>
                    <span className={styles.syncDot}></span>
                    Monitor de transacciones en vivo
                </div>
            </div>

            <div className={styles.statsOverview}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Acumulado (30 días)</span>
                    <span className={styles.statValue}>$0.00 MXN</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Volumen de Operaciones</span>
                    <span className={styles.statValue}>0</span>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>ID Transacción</th>
                            <th>Concepto</th>
                            <th>Beneficiario / Miembro</th>
                            <th>Estado</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={6} className={styles.empty}>
                                <div style={{ padding: '2rem' }}>
                                    <p>No se encontraron transacciones recientes en este módulo.</p>
                                    <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                                        Los datos se actualizan automáticamente cada 5 minutos.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className={styles.stripeButton} style={{ background: '#000' }}>
                    Exportar Historial Completo
                </button>
            </div>
        </div>
    );
}
