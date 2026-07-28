'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminFetch } from '@/utils/admin-fetch';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import WellnessCentersTable from '../WellnessCentersTable';
import WellnessCenterDetailModal from '../WellnessCenterDetailModal';
import type { WellnessCenter } from '@/types/wellness.types';

function CentrosPageContent() {
    const searchParams = useSearchParams();
    const [selectedCenter, setSelectedCenter] = useState<WellnessCenter | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const wellnessCenterId = searchParams.get('wellnessCenterId');
        if (!wellnessCenterId) return;
        adminFetch(`/api/admin/wellness?id=${wellnessCenterId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data?.[0]) setSelectedCenter(data.data[0]);
            })
            .catch((err) => console.error('❌ Error cargando centro:', err));
    }, [searchParams]);

    return (
        <PageContainer>
            <PageHeader title="Centros" />

            <WellnessCentersTable
                refreshKey={refreshKey}
                onViewDetails={(center) => setSelectedCenter(center)}
            />

            {selectedCenter && (
                <WellnessCenterDetailModal
                    center={selectedCenter}
                    isOpen={!!selectedCenter}
                    onClose={() => setSelectedCenter(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </PageContainer>
    );
}

export default function CentrosPage() {
    return (
        <Suspense fallback={null}>
            <CentrosPageContent />
        </Suspense>
    );
}
