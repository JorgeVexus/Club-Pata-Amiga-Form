'use client';

import React, { useState, useEffect } from 'react';
import styles from './Finance.module.css';
import { formatMXN } from '@/utils/format';

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
    interval?: string;
    customerEmail: string;
    customerName?: string;
    nextBilling: string;
    startDate?: string;
    source?: string;
}

interface StripeInvoice {
    id: string;
    number: string;
    amount: number;
    amountPaid: number;
    currency: string;
    status: string;
    date: string;
    dueDate: string | null;
    customerEmail: string;
    customerName: string;
    invoicePdf: string | null;
    hostedUrl: string | null;
    attemptCount: number;
    nextAttempt: string | null;
    subscriptionId: string | null;
    periodStart: string | null;
    periodEnd: string | null;
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

const INVOICE_STATUS_LABELS: Record<string, string> = {
    paid: 'Pagado',
    open: 'Pendiente',
    draft: 'Borrador',
    uncollectible: 'Incobrable',
    void: 'Anulado',
};

const INVOICE_STATUS_STYLE: Record<string, string> = {
    paid: 'statusSucceeded',
    open: 'statusOpen',
    draft: 'statusPending',
    uncollectible: 'statusWarning',
    void: 'statusVoid',
};

const SUB_STATUS_LABELS: Record<string, string> = {
    active: 'Activa',
    trialing: 'Prueba',
    past_due: 'Atrasada',
    canceled: 'Cancelada',
    incomplete: 'Incompleta',
};

export default function BillingManagement({ view }: BillingManagementProps) {
    const [records, setRecords] = useState<BillingRecord[]>([]);
    const [stripePayments, setStripePayments] = useState<StripePayment[]>([]);
    const [stripeSubscriptions, setStripeSubscriptions] = useState<StripeSubscription[]>([]);
    const [stripeInvoices, setStripeInvoices] = useState<StripeInvoice[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const titles: Record<string, string> = {
        records: 'Registros de Pagos (Stripe)',
        billing: 'Datos de Facturación de Miembros',
        status: 'Estado de Pagos Global',
        retries: 'Cobros Automáticos e Historial de Facturas'
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
            const queryType = view === 'records' ? 'records' : view === 'status' ? 'status' : 'retries';
            const response = await fetch(`/api/admin/finance/stripe-data?type=${queryType}`);
            const data = await response.json();
            if (data.success) {
                if (view === 'records') setStripePayments(data.data.payments || []);
                if (view === 'status') setStripeSubscriptions(data.data.subscriptions || []);
                if (view === 'retries') setStripeInvoices(data.data.invoices || []);
                
                // Fetch metrics
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

    function handleRefresh() {
        if (view === 'billing') loadBillingData();
        else loadStripeData();
    }


    // ── Billing Table ──
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

    // ── Payment Records ──
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
                                <td className={styles.amount}>{formatMXN(p.amount)}</td>
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

    // ── Subscription Status (Enhanced) ──
    const renderStripeStatus = () => {
        if (loading) return <div className={styles.loading}>Cargando estados de suscripción...</div>;
        if (stripeSubscriptions.length === 0) return <div className={styles.empty}>No hay suscripciones registradas.</div>;

        // Compute stats
        const totalActive = stripeSubscriptions.filter(s => s.status === 'active').length;
        const totalTrialing = stripeSubscriptions.filter(s => s.status === 'trialing').length;
        const totalPastDue = stripeSubscriptions.filter(s => s.status === 'past_due').length;
        const fromStripe = stripeSubscriptions.filter(s => s.source === 'stripe').length;
        const fromMs = stripeSubscriptions.filter(s => s.source === 'memberstack').length;

        return (
            <>
                <div className={styles.statsSummary}>
                    <div className={styles.statItem}>
                        <span>Total</span>
                        <strong>{stripeSubscriptions.length}</strong>
                    </div>
                    <div className={styles.statItem}>
                        <span>Activas</span>
                        <strong style={{ color: '#2e7d32' }}>{totalActive}</strong>
                    </div>
                    {totalTrialing > 0 && (
                        <div className={styles.statItem}>
                            <span>En Prueba</span>
                            <strong style={{ color: '#1565c0' }}>{totalTrialing}</strong>
                        </div>
                    )}
                    {totalPastDue > 0 && (
                        <div className={styles.statItem}>
                            <span>Atrasadas</span>
                            <strong style={{ color: '#e65100' }}>{totalPastDue}</strong>
                        </div>
                    )}
                    <div className={styles.statItem}>
                        <span>Stripe</span>
                        <strong style={{ color: '#635bff' }}>{fromStripe}</strong>
                    </div>
                    {fromMs > 0 && (
                        <div className={styles.statItem}>
                            <span>Memberstack</span>
                            <strong style={{ color: '#1565c0' }}>{fromMs}</strong>
                        </div>
                    )}
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Plan</th>
                                <th>Estado</th>
                                <th>Frecuencia</th>
                                <th>Siguiente Cobro</th>
                                <th>Monto</th>
                                <th>Fuente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stripeSubscriptions.map(s => {
                                const statusLabel = SUB_STATUS_LABELS[s.status] || s.status;
                                const statusClass = s.status === 'active' ? styles.statusSucceeded
                                    : s.status === 'trialing' ? styles.statusOpen
                                    : s.status === 'past_due' ? styles.statusPastDue
                                    : styles.statusWarning;
                                
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div className={styles.userName}>{s.customerName || 'Cliente'}</div>
                                            <div className={styles.userEmail}>{s.customerEmail}</div>
                                        </td>
                                        <td className={styles.smallText}>{typeof s.plan === 'string' && s.plan.startsWith('prod_') ? 'Plan Membresía' : s.plan}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${statusClass}`}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.intervalTag}>
                                                {s.interval === 'year' ? '📅 Anual' : '📆 Mensual'}
                                            </span>
                                        </td>
                                        <td className={styles.dateText}>
                                            {new Date(s.nextBilling).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className={styles.amount}>{formatMXN(s.amount)}</td>
                                        <td>
                                            <span className={`${styles.sourceBadge} ${s.source === 'stripe' ? styles.sourceStripe : styles.sourceMemberstack}`}>
                                                {s.source === 'stripe' ? '⚡ Stripe' : '🔗 MS'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    // ── Invoices / Auto-Billing ──
    const renderInvoices = () => {
        if (loading) return <div className={styles.loading}>Consultando historial de facturas...</div>;
        if (stripeInvoices.length === 0) return <div className={styles.empty}>No hay facturas recientes en Stripe.</div>;

        // Compute stats
        const paid = stripeInvoices.filter(i => i.status === 'paid').length;
        const open = stripeInvoices.filter(i => i.status === 'open').length;
        const uncollectible = stripeInvoices.filter(i => i.status === 'uncollectible').length;
        const voided = stripeInvoices.filter(i => i.status === 'void').length;

        return (
            <>
                <div className={styles.statsSummary}>
                    <div className={styles.statItem}>
                        <span>Facturas</span>
                        <strong>{stripeInvoices.length}</strong>
                    </div>
                    <div className={styles.statItem}>
                        <span>Pagadas</span>
                        <strong style={{ color: '#2e7d32' }}>{paid}</strong>
                    </div>
                    {open > 0 && (
                        <div className={styles.statItem}>
                            <span>Pendientes</span>
                            <strong style={{ color: '#1565c0' }}>{open}</strong>
                        </div>
                    )}
                    {uncollectible > 0 && (
                        <div className={styles.statItem}>
                            <span>Incobrables</span>
                            <strong style={{ color: '#c62828' }}>{uncollectible}</strong>
                        </div>
                    )}
                    {voided > 0 && (
                        <div className={styles.statItem}>
                            <span>Anuladas</span>
                            <strong style={{ color: '#546e7a' }}>{voided}</strong>
                        </div>
                    )}
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Nº Factura</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Intentos</th>
                                <th>Factura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stripeInvoices.map(inv => {
                                const statusLabel = INVOICE_STATUS_LABELS[inv.status] || inv.status;
                                const statusStyleKey = INVOICE_STATUS_STYLE[inv.status] || 'statusPending';
                                
                                return (
                                    <tr key={inv.id}>
                                        <td className={styles.dateText}>
                                            {new Date(inv.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td>
                                            <div className={styles.userName}>{inv.customerName !== 'N/A' ? inv.customerName : 'Cliente'}</div>
                                            <div className={styles.userEmail}>{inv.customerEmail}</div>
                                        </td>
                                        <td className={styles.smallText}>{inv.number}</td>
                                        <td className={styles.amount}>{formatMXN(inv.amount)}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[statusStyleKey]}`}>
                                                {statusLabel}
                                            </span>
                                            {inv.nextAttempt && (
                                                <div className={styles.dateText} style={{ marginTop: '4px', fontSize: '0.65rem' }}>
                                                    Reintento: {new Date(inv.nextAttempt).toLocaleDateString('es-MX')}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.attemptBadge}>
                                                🔄 {inv.attemptCount}
                                            </span>
                                        </td>
                                        <td>
                                            {inv.invoicePdf ? (
                                                <a href={inv.invoicePdf} target="_blank" rel="noopener noreferrer" className={styles.invoiceLink}>
                                                    📄 PDF
                                                </a>
                                            ) : inv.hostedUrl ? (
                                                <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer" className={styles.invoiceLink}>
                                                    🔗 Ver
                                                </a>
                                            ) : (
                                                <span className={styles.dateText}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    return (
        <div className={styles.ledgerContainer}>
            <div className={styles.ledgerHeader}>
                <h2 className={styles.ledgerTitle}>{titles[view]}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className={styles.refreshBtn} onClick={handleRefresh} disabled={loading}>
                        🔄 {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                    <div className={styles.syncStatus}>
                        <span className={styles.syncDot}></span>
                        Stripe Live API
                    </div>
                </div>
            </div>

            {view !== 'billing' && metrics && (
                <div className={styles.stripeInfo} style={{ maxWidth: 'none', marginBottom: '2rem' }}>
                    <div className={styles.stripeCard}>
                        <span>Disponible en Stripe</span>
                        <strong>{formatMXN(metrics.available)}</strong>
                    </div>
                    <div className={styles.stripeCard}>
                        <span>Pendiente de Liquidar</span>
                        <strong style={{ color: '#666' }}>{formatMXN(metrics.pending)}</strong>
                    </div>
                </div>
            )}

            {view === 'billing' && renderBillingTable()}
            {view === 'records' && renderStripePayments()}
            {view === 'status' && renderStripeStatus()}
            {view === 'retries' && renderInvoices()}

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
