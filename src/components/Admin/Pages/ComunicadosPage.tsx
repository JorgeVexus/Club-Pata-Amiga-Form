'use client';

import React, { useState } from 'react';
import { useAdminSession } from '../Shell/useAdminSession';
import PageContainer from '../ui/PageContainer';
import PageHeader from '../ui/PageHeader';
import FilterChips from '../ui/FilterChips';
import CommunicationsHub from '../Communications/CommunicationsHub';
import EmailTemplatePreviewer from '../Communications/EmailTemplatePreviewer';

const TABS = [
    { id: 'member', label: 'Miembros' },
    { id: 'ambassador', label: 'Embajadores' },
    { id: 'wellness-center', label: 'Centros de bienestar' },
    { id: 'general', label: 'General' },
    { id: 'templates', label: 'Plantillas de correo' },
];

export default function ComunicadosPage() {
    const session = useAdminSession();
    const [activeTab, setActiveTab] = useState('member');

    if (session.isLoading) return null;

    return (
        <PageContainer>
            <PageHeader title="Comunicados" />
            <FilterChips options={TABS} activeId={activeTab} onChange={setActiveTab} />

            {activeTab === 'templates' ? (
                <EmailTemplatePreviewer />
            ) : (
                <CommunicationsHub
                    adminName={session.adminName}
                    isSuperAdmin={session.isSuperAdmin}
                    audience={activeTab as 'member' | 'ambassador' | 'wellness-center' | 'general'}
                />
            )}
        </PageContainer>
    );
}
