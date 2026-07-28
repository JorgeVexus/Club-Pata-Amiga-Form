'use client';

import React, { useState } from 'react';
import { useAdminSession } from '../Shell/useAdminSession';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import SolidarityDashboard from '../Solidarity/SolidarityDashboard';
import SolidarityRequestDetail from '../Solidarity/SolidarityRequestDetail';

export default function ReintegrosPage() {
    const session = useAdminSession();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (session.isLoading) return null;

    return (
        <PageContainer>
            <PageHeader title="Reintegros" />
            <SolidarityDashboard onViewDetail={setSelectedId} />

            {selectedId && session.adminMemberstackId && (
                <SolidarityRequestDetail
                    requestId={selectedId}
                    adminMemberstackId={session.adminMemberstackId}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </PageContainer>
    );
}
