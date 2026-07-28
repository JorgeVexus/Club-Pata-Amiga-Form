'use client';

import React, { useState } from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import { useAdminSession } from '../Shell/useAdminSession';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import FilterChips from '../ui/FilterChips';
import BillingManagement from '../Finance/BillingManagement';
import FinancialLedger from '../Finance/FinancialLedger';
import CancellationsTable from '../CancellationsTable';
import MemberDetailModal from '../MemberDetailModal';

const TABS = [
    { id: 'records', label: 'Registros de pago' },
    { id: 'billing', label: 'Facturación' },
    { id: 'status', label: 'Estado de pago' },
    { id: 'retries', label: 'Cobros automáticos' },
    { id: 'cancellations', label: 'Cancelaciones' },
    { id: 'memberships', label: 'Ingresos' },
    { id: 'refunds', label: 'Reembolsos' },
    { id: 'wellness', label: 'Pagos a centros' },
    { id: 'commissions', label: 'Comisiones' },
];

const BILLING_VIEWS = new Set(['records', 'billing', 'status', 'retries']);
const LEDGER_VIEWS = new Set(['memberships', 'refunds', 'wellness', 'commissions']);

export default function FinanzasPage() {
    const session = useAdminSession();
    const [activeTab, setActiveTab] = useState('records');
    const [selectedMember, setSelectedMember] = useState<any>(null);

    const fetchMemberDetails = async (memberstackId: string) => {
        try {
            const response = await adminFetch(`/api/admin/members/${memberstackId}?refresh=true`);
            const data = await response.json();
            if (data.success && data.member) {
                setSelectedMember(data.member);
            } else {
                alert('No se pudo cargar la información del miembro.');
            }
        } catch (error) {
            console.error('❌ Error cargando miembro:', error);
        }
    };

    return (
        <PageContainer>
            <PageHeader title="Finanzas" />
            <FilterChips options={TABS} activeId={activeTab} onChange={setActiveTab} />

            {BILLING_VIEWS.has(activeTab) && (
                <BillingManagement view={activeTab as 'records' | 'billing' | 'status' | 'retries'} />
            )}
            {LEDGER_VIEWS.has(activeTab) && (
                <FinancialLedger type={activeTab as 'memberships' | 'refunds' | 'wellness' | 'commissions'} />
            )}
            {activeTab === 'cancellations' && (
                <CancellationsTable onViewMember={fetchMemberDetails} />
            )}

            <MemberDetailModal
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                member={selectedMember}
                isSuperAdmin={session.isSuperAdmin}
                onApprove={async () => {}}
                onReject={() => {}}
            />
        </PageContainer>
    );
}
