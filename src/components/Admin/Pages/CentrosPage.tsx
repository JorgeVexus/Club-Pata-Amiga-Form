'use client';

import React, { useState } from 'react';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import WellnessCentersTable from '../WellnessCentersTable';
import WellnessCenterDetailModal from '../WellnessCenterDetailModal';
import type { WellnessCenter } from '@/types/wellness.types';

export default function CentrosPage() {
    const [selectedCenter, setSelectedCenter] = useState<WellnessCenter | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
