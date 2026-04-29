'use client';

import React, { useState, useEffect } from 'react';
import styles from './CommunicationsHub.module.css';
import TemplateManager from './TemplateManager';
import MessageSender from './MessageSender';
import CommHistory from './CommHistory';

interface CommunicationsHubProps {
    adminName: string;
    isSuperAdmin: boolean;
    prefill?: { recipientId?: string; templateSearch?: string; isTermination?: boolean } | null;
    audience?: 'member' | 'ambassador' | 'wellness-center' | 'general';
}

export default function CommunicationsHub({ adminName, isSuperAdmin, prefill, audience = 'general' }: CommunicationsHubProps) {
    const [activeTab, setActiveTab] = useState<'messaging' | 'templates' | 'history'>('messaging');

    const getAudienceLabel = () => {
        switch (audience) {
            case 'member': return 'Miembros';
            case 'ambassador': return 'Embajadores';
            case 'wellness-center': return 'Centros de Bienestar';
            default: return 'General';
        }
    };

    return (
        <div className={styles.hubContainer}>
            <div className={styles.hubHeader}>
                <h1 className={styles.hubTitle}>
                    📡 Hub de Comunicación: <span className={styles.audienceTag}>{getAudienceLabel()}</span>
                </h1>
            </div>

            {/* Tabs Navigation */}
            <div className={styles.tabsHeader}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'messaging' ? styles.active : ''}`}
                    onClick={() => setActiveTab('messaging')}
                >
                    <span className={styles.tabIcon}>📤</span>
                    Enviar Mensaje
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'templates' ? styles.active : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    <span className={styles.tabIcon}>📄</span>
                    Gestionar Plantillas
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <span className={styles.tabIcon}>📜</span>
                    Historial
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'messaging' ? (
                    <MessageSender adminName={adminName} prefill={prefill} audience={audience} />
                ) : activeTab === 'templates' ? (
                    <TemplateManager audience={audience} />
                ) : (
                    <CommHistory adminName={adminName} isSuperAdmin={isSuperAdmin} audience={audience} />
                )}
            </div>
        </div>
    );
}
