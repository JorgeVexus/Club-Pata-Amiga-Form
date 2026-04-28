'use client';

import React from 'react';
import styles from './Finance.module.css';

interface BillingManagementProps {
    view: 'records' | 'billing' | 'status' | 'retries';
}

export default function BillingManagement({ view }: BillingManagementProps) {
    const titles = {
        records: 'Registros de Pagos (Stripe)',
        billing: 'Datos de Facturación de Miembros',
        status: 'Estado de Pagos Global',
        retries: 'Reintentos de Cobro Automático'
    };

    return (
        <div className={styles.ledgerContainer}>
            <div className={styles.ledgerHeader}>
                <h2 className={styles.ledgerTitle}>{titles[view]}</h2>
            </div>

            <div className={styles.tablePlaceholder}>
                {view === 'billing' ? (
                    <p>Aquí se mostrarán los RFC y datos fiscales vinculados a las cuentas de Memberstack.</p>
                ) : (
                    <p>Sincronizando registros con el Dashboard de Stripe...</p>
                )}
                <div className={styles.emptyIllustration}>💳</div>
            </div>
        </div>
    );
}
