'use client';

import React, { useState } from 'react';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import FilterChips from '../ui/FilterChips';
import BillingManagement from '../Finance/BillingManagement';
import FinancialLedger from '../Finance/FinancialLedger';

const TABS = [
    { id: 'records', label: 'Registros de pago' },
    { id: 'billing', label: 'Facturación' },
    { id: 'status', label: 'Estado de pago' },
    { id: 'retries', label: 'Cobros automáticos' },
    { id: 'memberships', label: 'Ingresos' },
    { id: 'refunds', label: 'Reembolsos' },
    { id: 'wellness', label: 'Pagos a centros' },
    { id: 'commissions', label: 'Comisiones' },
];

const BILLING_VIEWS = new Set(['records', 'billing', 'status', 'retries']);

export default function FinanzasPage() {
    const [activeTab, setActiveTab] = useState('records');

    return (
        <PageContainer>
            <PageHeader title="Finanzas" />
            <FilterChips options={TABS} activeId={activeTab} onChange={setActiveTab} />

            {BILLING_VIEWS.has(activeTab) ? (
                <BillingManagement view={activeTab as 'records' | 'billing' | 'status' | 'retries'} />
            ) : (
                <FinancialLedger type={activeTab as 'memberships' | 'refunds' | 'wellness' | 'commissions'} />
            )}
        </PageContainer>
    );
}
