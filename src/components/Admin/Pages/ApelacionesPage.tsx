'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/utils/admin-fetch';
import { useAdminSession } from '../Shell/useAdminSession';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import RequestsTable from '../RequestsTable';
import MemberDetailModal from '../MemberDetailModal';

export default function ApelacionesPage() {
    const session = useAdminSession();
    const router = useRouter();

    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!session.isLoading && !session.isSuperAdmin) {
            router.replace('/admin/dashboard');
        }
    }, [session.isLoading, session.isSuperAdmin, router]);

    const fetchMemberDetails = async (id: string) => {
        try {
            const response = await adminFetch(`/api/admin/members/${id}?refresh=true`);
            const data = await response.json();
            if (data.success && data.member) {
                setSelectedMember(data.member);
            } else {
                alert('No se pudo cargar la información.');
            }
        } catch (error) {
            console.error('Error fetching member details:', error);
        }
    };

    if (session.isLoading || !session.isSuperAdmin) return null;

    return (
        <PageContainer>
            <PageHeader title="Apelaciones" />

            <RequestsTable
                filter="all"
                requestType="appeals"
                isSuperAdmin={session.isSuperAdmin}
                refreshKey={refreshKey}
                onViewDetails={(id, _type, petId) => {
                    setSelectedPetId(petId || null);
                    fetchMemberDetails(id);
                }}
                onApprove={() => {}}
                onReject={() => {}}
            />

            <MemberDetailModal
                isOpen={!!selectedMember}
                onClose={() => {
                    setSelectedMember(null);
                    setSelectedPetId(null);
                    setRefreshKey((k) => k + 1);
                }}
                member={selectedMember}
                showAppealSection
                selectedPetId={selectedPetId}
                isSuperAdmin={session.isSuperAdmin}
                onApprove={async () => {}}
                onReject={() => {}}
                onDataChange={() => {
                    setRefreshKey((k) => k + 1);
                    if (selectedMember?.id) fetchMemberDetails(selectedMember.id);
                }}
            />
        </PageContainer>
    );
}
