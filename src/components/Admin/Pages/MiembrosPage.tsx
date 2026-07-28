'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminFetch } from '@/utils/admin-fetch';
import { useAdminSession } from '../Shell/useAdminSession';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import RequestsTable from '../RequestsTable';
import MemberDetailModal from '../MemberDetailModal';
import RejectionModal from '../RejectionModal';
import RejectionReasonModal from '../RejectionReasonModal';

function MiembrosPageContent() {
    const session = useAdminSession();
    const searchParams = useSearchParams();

    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [memberToReject, setMemberToReject] = useState<any>(null);
    const [rejectionToView, setRejectionToView] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

    const fetchMemberDetails = async (id: string, setter: (member: any) => void) => {
        try {
            const response = await adminFetch(`/api/admin/members/${id}?refresh=true`);
            const data = await response.json();
            if (data.success && data.member) {
                setter(data.member);
            } else {
                alert('No se pudo cargar la información.');
            }
        } catch (error) {
            console.error('Error fetching member details:', error);
            alert('Error al cargar la información del miembro.');
        }
    };

    useEffect(() => {
        const memberId = searchParams.get('member');
        if (memberId) fetchMemberDetails(memberId, setSelectedMember);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    if (session.isLoading) return null;

    return (
        <PageContainer>
            <PageHeader title="Miembros" />

            <RequestsTable
                filter="all"
                requestType="member"
                isSuperAdmin={session.isSuperAdmin}
                refreshKey={refreshKey}
                onViewDetails={(id, _type, petId) => {
                    setSelectedPetId(petId || null);
                    fetchMemberDetails(id, setSelectedMember);
                }}
                onViewRejectionReason={(id) => fetchMemberDetails(id, setRejectionToView)}
                onApprove={async (id) => {
                    if (!confirm('¿Estás seguro de aprobar este miembro?')) return;
                    try {
                        const response = await adminFetch(`/api/admin/members/${id}/approve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adminId: session.adminName }),
                        });
                        if (response.ok) {
                            alert('Miembro aprobado');
                            triggerRefresh();
                        } else {
                            alert('Error al aprobar');
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }}
                onReject={(id) => fetchMemberDetails(id, setMemberToReject)}
                onDelete={async (id) => {
                    if (!confirm('¿ESTÁS SEGURO? Esta acción es permanente.')) return;
                    try {
                        const res = await adminFetch(`/api/admin/members/${id}/delete`, { method: 'DELETE' });
                        if (res.ok) {
                            alert('Eliminado correctamente');
                            triggerRefresh();
                        } else {
                            alert('Error al eliminar');
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }}
                onBulkDelete={async (ids) => {
                    if (!confirm(`¿Estás seguro de eliminar permanentemente ${ids.length} registros?`)) return;
                    try {
                        const res = await adminFetch('/api/admin/members/bulk-delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ids }),
                        });
                        if (res.ok) {
                            alert('Registros eliminados correctamente');
                            triggerRefresh();
                        } else {
                            alert('Error al eliminar algunos registros');
                        }
                    } catch (e) {
                        console.error('Error in bulk delete:', e);
                    }
                }}
            />

            <MemberDetailModal
                isOpen={!!selectedMember}
                onClose={() => {
                    setSelectedMember(null);
                    setSelectedPetId(null);
                    triggerRefresh();
                }}
                member={selectedMember}
                selectedPetId={selectedPetId}
                isSuperAdmin={session.isSuperAdmin}
                onApprove={async (id, metadata) => {
                    if (!confirm('¿Aprobar?')) return;
                    const res = await adminFetch(`/api/admin/members/${id}/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adminId: session.adminName, ...metadata }),
                    });
                    if (res.ok) {
                        alert('Aprobado');
                        triggerRefresh();
                        fetchMemberDetails(id, setSelectedMember);
                    } else {
                        alert('Error al aprobar');
                    }
                }}
                onReject={() => {
                    setMemberToReject(selectedMember);
                    setSelectedMember(null);
                }}
                onDataChange={() => {
                    triggerRefresh();
                    if (selectedMember?.id) fetchMemberDetails(selectedMember.id, setSelectedMember);
                }}
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
                        alert('Rechazado');
                        setMemberToReject(null);
                        triggerRefresh();
                    } else {
                        alert('Error al rechazar');
                    }
                }}
            />

            <RejectionReasonModal
                isOpen={!!rejectionToView}
                onClose={() => setRejectionToView(null)}
                memberName={`${rejectionToView?.customFields?.['first-name'] || ''} ${rejectionToView?.customFields?.['paternal-last-name'] || ''}`.trim()}
                rejectionReason={rejectionToView?.customFields?.['rejection-reason'] || ''}
                rejectedBy={rejectionToView?.customFields?.['rejected-by'] || 'Admin'}
                rejectedAt={rejectionToView?.customFields?.['rejected-at'] || ''}
            />
        </PageContainer>
    );
}

export default function MiembrosPage() {
    return (
        <Suspense fallback={null}>
            <MiembrosPageContent />
        </Suspense>
    );
}
