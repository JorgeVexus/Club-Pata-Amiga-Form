'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/utils/admin-fetch';
import { useAdminSession } from '../Shell/useAdminSession';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import FilterChips from '../ui/FilterChips';
import AdminsTable from '../AdminsTable';
import CancellationsTable from '../CancellationsTable';
import SettingsPanel from '../SettingsPanel';
import RequestsTable from '../RequestsTable';
import MemberDetailModal from '../MemberDetailModal';
import RejectionModal from '../RejectionModal';

const TABS = [
    { id: 'all-members', label: 'Todos / Pruebas' },
    { id: 'admins', label: 'Administradores' },
    { id: 'cancellations', label: 'Membresías canceladas' },
    { id: 'settings', label: 'Configuración' },
];

export default function AjustesPage() {
    const session = useAdminSession();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('all-members');
    const [skipPaymentEnabled, setSkipPaymentEnabled] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberToReject, setMemberToReject] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!session.isLoading && !session.isSuperAdmin) {
            router.replace('/admin/dashboard');
        }
    }, [session.isLoading, session.isSuperAdmin, router]);

    useEffect(() => {
        if (session.isSuperAdmin) {
            adminFetch('/api/admin/settings/skip-payment')
                .then((r) => r.json())
                .then((d) => setSkipPaymentEnabled(d.enabled))
                .catch(() => {});
        }
    }, [session.isSuperAdmin]);

    const fetchMemberDetails = async (id: string, setter: (member: any) => void) => {
        try {
            const response = await adminFetch(`/api/admin/members/${id}?refresh=true`);
            const data = await response.json();
            if (data.success && data.member) setter(data.member);
        } catch (error) {
            console.error('Error fetching member details:', error);
        }
    };

    if (session.isLoading || !session.isSuperAdmin) return null;

    return (
        <PageContainer>
            <PageHeader title="Ajustes" />
            <FilterChips options={TABS} activeId={activeTab} onChange={setActiveTab} />

            {activeTab === 'all-members' && (
                <>
                    <RequestsTable
                        filter="all"
                        requestType="all-members"
                        isSuperAdmin={session.isSuperAdmin}
                        refreshKey={refreshKey}
                        onViewDetails={(id) => fetchMemberDetails(id, setSelectedMember)}
                        onApprove={async (id) => {
                            if (!confirm('¿Aprobar?')) return;
                            const res = await adminFetch(`/api/admin/members/${id}/approve`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adminId: session.adminName }),
                            });
                            if (res.ok) setRefreshKey((k) => k + 1);
                        }}
                        onReject={(id) => fetchMemberDetails(id, setMemberToReject)}
                        onDelete={async (id) => {
                            if (!confirm('¿ESTÁS SEGURO? Esta acción es permanente.')) return;
                            const res = await adminFetch(`/api/admin/members/${id}/delete`, { method: 'DELETE' });
                            if (res.ok) setRefreshKey((k) => k + 1);
                        }}
                    />

                    <MemberDetailModal
                        isOpen={!!selectedMember}
                        onClose={() => {
                            setSelectedMember(null);
                            setRefreshKey((k) => k + 1);
                        }}
                        member={selectedMember}
                        isSuperAdmin={session.isSuperAdmin}
                        onApprove={async (id, metadata) => {
                            if (!confirm('¿Aprobar?')) return;
                            const res = await adminFetch(`/api/admin/members/${id}/approve`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adminId: session.adminName, ...metadata }),
                            });
                            if (res.ok) fetchMemberDetails(id, setSelectedMember);
                        }}
                        onReject={() => {
                            setMemberToReject(selectedMember);
                            setSelectedMember(null);
                        }}
                        onDataChange={() => setRefreshKey((k) => k + 1)}
                    />

                    <RejectionModal
                        isOpen={!!memberToReject}
                        onClose={() => setMemberToReject(null)}
                        memberName={`${memberToReject?.customFields?.['first-name'] || ''} ${memberToReject?.customFields?.['paternal-last-name'] || ''}`}
                        onConfirm={async (reason) => {
                            const res = await adminFetch(`/api/admin/members/${memberToReject.id}/reject`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adminId: session.adminName, reason }),
                            });
                            if (res.ok) {
                                setMemberToReject(null);
                                setRefreshKey((k) => k + 1);
                            }
                        }}
                    />
                </>
            )}

            {activeTab === 'admins' && <AdminsTable />}
            {activeTab === 'cancellations' && <CancellationsTable />}
            {activeTab === 'settings' && (
                <SettingsPanel
                    skipPaymentEnabled={skipPaymentEnabled}
                    onToggleSkipPayment={async (enabled) => {
                        try {
                            const res = await adminFetch('/api/admin/settings/skip-payment', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ enabled, adminId: session.adminMemberstackId }),
                            });
                            if (res.ok) setSkipPaymentEnabled(enabled);
                            else alert('Error al actualizar');
                        } catch {
                            alert('Error de conexión');
                        }
                    }}
                />
            )}
        </PageContainer>
    );
}
