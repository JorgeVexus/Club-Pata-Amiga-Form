'use client';

import React, { useState } from 'react';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import FilterChips from '../ui/FilterChips';
import CampaignLeadsManager from '../CampaignLeadsManager';
import WellnessLeadsTable from '../WellnessLeadsTable';

const TABS = [
    { id: 'campaign', label: 'Campaña regalos' },
    { id: 'wellness', label: 'Centros bienestar' },
];

export default function LandingsPage() {
    const [activeTab, setActiveTab] = useState('campaign');

    return (
        <PageContainer>
            <PageHeader title="Landings" />
            <FilterChips options={TABS} activeId={activeTab} onChange={setActiveTab} />

            {activeTab === 'campaign' ? <CampaignLeadsManager /> : <WellnessLeadsTable />}
        </PageContainer>
    );
}
