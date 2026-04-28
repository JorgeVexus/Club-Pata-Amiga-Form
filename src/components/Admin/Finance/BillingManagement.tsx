'use client';

import React, { useState, useEffect } from 'react';
import styles from './Finance.module.css';

interface StripePayment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    customerEmail: string;
    customerName: string;
}

interface StripeSubscription {
    id: string;
    status: string;
    plan: string;
    amount: number;
    customerEmail: string;
    nextBilling: string;
}

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
    const [stripePayments, setStripePayments] = useState<StripePayment[]>([]);
    const [stripeSubscriptions, setStripeSubscriptions] = useState<StripeSubscription[]>([]);
    const [stripeFailed, setStripeFailed] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
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
        } else {
            loadStripeData();
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

    async function loadStripeData() {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/finance/stripe-data?type=${view === 'records' ? 'records' : view === 'status' ? 'status' : 'retries'}`);
            const data = await response.json();
            if (data.success) {
                if (view === 'records') setStripePayments(data.data.payments || []);
                if (view === 'status') setStripeSubscriptions(data.data.subscriptions || []);
                if (view === 'retries') setStripeFailed(data.data.failed || []);
                
                // Fetch metrics if available
                const metricsRes = await fetch('/api/admin/finance/stripe-data?type=metrics');
                const metricsData = await metricsRes.json();
                if (metricsData.success) setMetrics(metricsData.data.balance);
            }
        } catch (error) {
            console.error('Error loading stripe data:', error);
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

    const renderStripePayments = () => {
        if (loading) return <div className={styles.loading}>Consultando Stripe...</div>;
        if (stripePayments.length === 0) return <div className={styles.empty}>No hay pagos registrados recientemente.</div>;

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>ID Transacción</th>
                            <th>Monto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stripePayments.map(p => (
                            <tr key={p.id}>
                                <td className={styles.dateText}>{new Date(p.date).toLocaleString()}</td>
                                <td>
                                    <div className={styles.userName}>{p.customerName !== 'N/A' ? p.customerName : 'Cliente Web'}</div>
                                    <div className={styles.userEmail}>{p.customerEmail}</div>
                                </td>
                                <td className={styles.smallText}>{p.id}</td>
                                <td className={styles.amount}>${p.amount.toFixed(2)} {p.currency}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${p.status === 'succeeded' ? styles.statusSucceeded : styles.statusPending}`}>
                                        {p.status === 'succeeded' ? 'Completado' : p.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderStripeStatus = () => {
        if (loading) return <div className={styles.loading}>Cargando estados de suscripción...</div>;
        if (stripeSubscriptions.length === 0) return <div className={styles.empty}>No hay suscripciones activas.</div>;

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Suscripción</th>
                            <th>Cliente</th>
                            <th>Estado</th>
                            <th>Siguiente Cobro</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stripeSubscriptions.map(s => (
                            <tr key={s.id}>
                                <td className={styles.smallText}>{s.id}</td>
                                <td>{s.customerEmail}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${s.status === 'active' ? styles.statusSucceeded : styles.statusWarning}`}>
                                        {s.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className={styles.dateText}>{new Date(s.nextBilling).toLocaleDateString()}</td>
                                <td className={styles.amount}>${s.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderStripeRetries = () => {
        if (loading) return <div className={styles.loading}>Buscando pagos fallidos...</div>;
        if (stripeFailed.length === 0) return <div className={styles.empty}>No hay reintentos pendientes de cobro.</div>;

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha de Falla</th>
                            <th>Cliente</th>
                            <th>Monto Pendiente</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stripeFailed.map(f => (
                            <tr key={f.id}>
                                <td className={styles.dateText}>{new Date(f.date).toLocaleString()}</td>
                                <td>{f.customerEmail}</td>
                                <td className={styles.amount} style={{ color: 'var(--color-error)' }}>${f.amount.toFixed(2)}</td>
                                <td>
                                    <button className={styles.smallButton}>Notificar Cliente</button>
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
                <div className={styles.syncStatus}>
                    <span className={styles.syncDot}></span>
                    Stripe Live API
                </div>
            </div>

            {view !== 'billing' && metrics && (
                <div className={styles.stripeInfo} style={{ maxWidth: 'none', marginBottom: '2rem' }}>
                    <div className={styles.stripeCard}>
                        <span>Disponible en Stripe</span>
                        <strong>${metrics.available.toFixed(2)} {metrics.currency}</strong>
                    </div>
                    <div className={styles.stripeCard}>
                        <span>Pendiente de Liquidar</span>
                        <strong style={{ color: '#666' }}>${metrics.pending.toFixed(2)} {metrics.currency}</strong>
                    </div>
                </div>
            )}

            {view === 'billing' && renderBillingTable()}
            {view === 'records' && renderStripePayments()}
            {view === 'status' && renderStripeStatus()}
            {view === 'retries' && renderStripeRetries()}

            {view !== 'billing' && (
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button 
                        className={styles.stripeButton}
                        onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                    >
                        Abrir Stripe Full Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}
