'use client';

import React, { useState } from 'react';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import FilterChips from '../ui/FilterChips';
import LegalDocsManager from '../LegalDocsManager';
import AmbassadorMaterialsManager from '../Communications/AmbassadorMaterialsManager';
import NewsletterSubscribersTable from '../NewsletterSubscribersTable';

const TABS = [
    { id: 'legal-docs', label: 'Documentos legales' },
    { id: 'ambassador-materials', label: 'Materiales de embajador' },
    { id: 'newsletter', label: 'Newsletter' },
];

export default function SitioPage() {
    const [activeTab, setActiveTab] = useState('legal-docs');

    return (
        <PageContainer>
            <PageHeader title="Sitio web" />
            <FilterChips options={TABS} activeId={activeTab} onChange={setActiveTab} />

            {activeTab === 'legal-docs' && <LegalDocsManager />}
            {activeTab === 'ambassador-materials' && <AmbassadorMaterialsManager />}
            {activeTab === 'newsletter' && <NewsletterSubscribersTable />}
        </PageContainer>
    );
}
