'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminSession } from '../Shell/useAdminSession';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import SolidarityDashboard from '../Solidarity/SolidarityDashboard';
import SolidarityRequestDetail from '../Solidarity/SolidarityRequestDetail';

function ReintegrosPageContent() {
    const session = useAdminSession();
    const searchParams = useSearchParams();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const requestId = searchParams.get('requestId');
        if (requestId) setSelectedId(requestId);
    }, [searchParams]);

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

export default function ReintegrosPage() {
    return (
        <Suspense fallback={null}>
            <ReintegrosPageContent />
        </Suspense>
    );
}
