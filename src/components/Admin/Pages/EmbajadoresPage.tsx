'use client';

import React, { useState } from 'react';
import { adminFetch } from '@/utils/admin-fetch';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import AmbassadorsTable from '../AmbassadorsTable';
import AmbassadorDetailModal from '../AmbassadorDetailModal';
import type { Ambassador } from '@/types/ambassador.types';

export default function EmbajadoresPage() {
    const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
    const [autoOpenReject, setAutoOpenReject] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchAmbassadorDetails = async (id: string) => {
        try {
            const response = await adminFetch(`/api/ambassadors/${id}`);
            const data = await response.json();
            if (data.success) setSelectedAmbassador(data.data);
        } catch (error) {
            console.error('❌ Error cargando embajador:', error);
        }
    };

    return (
        <PageContainer>
            <PageHeader title="Embajadores" />

            <AmbassadorsTable
                refreshKey={refreshKey}
                onViewDetails={(amb) => {
                    setAutoOpenReject(false);
                    setSelectedAmbassador(amb);
                }}
                onRejectClick={(amb) => {
                    setAutoOpenReject(true);
                    setSelectedAmbassador(amb);
                }}
            />

            {selectedAmbassador && (
                <AmbassadorDetailModal
                    ambassador={selectedAmbassador}
                    autoOpenReject={autoOpenReject}
                    onClose={() => {
                        setSelectedAmbassador(null);
                        setAutoOpenReject(false);
                    }}
                    onRefresh={() => {
                        setRefreshKey((k) => k + 1);
                        fetchAmbassadorDetails(selectedAmbassador.id);
                    }}
                />
            )}
        </PageContainer>
    );
}
