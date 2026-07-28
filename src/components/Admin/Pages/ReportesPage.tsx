'use client';

import React, { useState } from 'react';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import FilterChips from '../ui/FilterChips';
import InteractiveReports from '../Reports/InteractiveReports';
import EmergencyReportTable from '../EmergencyReportTable';

const TABS = [
    { id: 'analytics', label: 'Gráficas interactivas' },
    { id: 'emergency', label: 'Botón de emergencia' },
];

export default function ReportesPage() {
    const [activeTab, setActiveTab] = useState('analytics');

    return (
        <PageContainer>
            <PageHeader title="Reportes" />
            <FilterChips options={TABS} activeId={activeTab} onChange={setActiveTab} />

            {activeTab === 'analytics' ? <InteractiveReports /> : <EmergencyReportTable />}
        </PageContainer>
    );
}
