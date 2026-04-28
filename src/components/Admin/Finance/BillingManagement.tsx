'use client';

import React, { useState, useEffect } from 'react';
import styles from './Finance.module.css';

interface BillingRecord {
    id: string;
    rfc: string;
    businessName: string;
    zipCode: string;
    taxRegime: string;
    cfdiUse: string;
    updatedAt: string;
    user: {
        fullName: string;
        email: string;
        memberstackId: string;
    };
}

interface BillingManagementProps {
    view: 'records' | 'billing' | 'status' | 'retries';
}

export default function BillingManagement({ view }: BillingManagementProps) {
    const [records, setRecords] = useState<BillingRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const titles = {
        records: 'Registros de Pagos (Stripe)',
        billing: 'Datos de Facturación de Miembros',
        status: 'Estado de Pagos Global',
        retries: 'Reintentos de Cobro Automático'
    };

    useEffect(() => {
        if (view === 'billing') {
            loadBillingData();
        }
    }, [view]);

    async function loadBillingData() {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/finance/billing');
            const data = await response.json();
            if (data.success) {
                setRecords(data.data);
            }
        } catch (error) {
            console.error('Error loading billing data:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderBillingTable = () => {
        if (loading) return <div className={styles.loading}>Cargando datos fiscales...</div>;
        if (records.length === 0) return <div className={styles.empty}>No hay datos fiscales registrados aún.</div>;

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Miembro</th>
                            <th>RFC</th>
                            <th>Razón Social</th>
                            <th>CP</th>
                            <th>Régimen</th>
                            <th>Uso CFDI</th>
                            <th>Actualizado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.id}>
                                <td>
                                    <div className={styles.userName}>{record.user.fullName}</div>
                                    <div className={styles.userEmail}>{record.user.email}</div>
                                </td>
                                <td className={styles.rfcTag}>{record.rfc}</td>
                                <td>{record.businessName}</td>
                                <td>{record.zipCode}</td>
                                <td className={styles.smallText}>{record.taxRegime}</td>
                                <td className={styles.smallText}>{record.cfdiUse}</td>
                                <td className={styles.dateText}>
                                    {new Date(record.updatedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={styles.ledgerContainer}>
            <div className={styles.ledgerHeader}>
                <h2 className={styles.ledgerTitle}>{titles[view]}</h2>
                {view !== 'billing' && (
                    <div className={styles.syncStatus}>
                        <span className={styles.syncDot}></span>
                        Sincronización en vivo con Stripe activada
                    </div>
                )}
            </div>

            {view === 'billing' ? (
                renderBillingTable()
            ) : (
                <div className={styles.tablePlaceholder}>
                    <p>Accediendo a los registros del Dashboard de Stripe...</p>
                    <div className={styles.stripeInfo}>
                        <div className={styles.stripeCard}>
                            <span>Pagos Procesados</span>
                            <strong>$0.00</strong>
                        </div>
                        <div className={styles.stripeCard}>
                            <span>Próximos Cobros</span>
                            <strong>$0.00</strong>
                        </div>
                    </div>
                    <button 
                        className={styles.stripeButton}
                        onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                    >
                        Abrir Dashboard de Stripe
                    </button>
                </div>
            )}
        </div>
    );
}
