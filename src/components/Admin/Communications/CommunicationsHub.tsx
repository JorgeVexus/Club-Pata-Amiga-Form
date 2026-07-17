'use client';

import React, { useState } from 'react';
import styles from './CommunicationsHub.module.css';
import TemplateManager from './TemplateManager';
import MessageSender from './MessageSender';
import CommHistory from './CommHistory';
import AmbassadorMaterialsManager from './AmbassadorMaterialsManager';

interface CommunicationsHubProps {
    adminName: string;
    isSuperAdmin: boolean;
    prefill?: { recipientId?: string; templateSearch?: string; isTermination?: boolean } | null;
    audience?: 'member' | 'ambassador' | 'wellness-center' | 'general';
}

export default function CommunicationsHub({ adminName, isSuperAdmin, prefill, audience = 'general' }: CommunicationsHubProps) {
    const [activeTab, setActiveTab] = useState<'messaging' | 'templates' | 'history' | 'materials'>('messaging');

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
                <div>
                    <span className={styles.eyebrow}>Comunicaciones</span>
                    <h1 className={styles.hubTitle}>Hub de Comunicación</h1>
                    <p className={styles.hubDescription}>Envía mensajes, administra plantillas y consulta el historial desde un solo lugar.</p>
                </div>
                <span className={styles.audienceTag}>{getAudienceLabel()}</span>
            </div>

            {/* Tabs Navigation */}
            <div className={styles.tabsHeader} role="tablist" aria-label="Secciones de comunicación">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'messaging'}
                    className={`${styles.tabButton} ${activeTab === 'messaging' ? styles.active : ''}`}
                    onClick={() => setActiveTab('messaging')}
                >
                    <span className={`${styles.tabIcon} ${styles.sendIcon}`} aria-hidden="true" />
                    Enviar mensaje
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'templates'}
                    className={`${styles.tabButton} ${activeTab === 'templates' ? styles.active : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    <span className={`${styles.tabIcon} ${styles.templateIcon}`} aria-hidden="true" />
                    Plantillas
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'history'}
                    className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <span className={`${styles.tabIcon} ${styles.historyIcon}`} aria-hidden="true" />
                    Historial
                </button>
                {audience === 'ambassador' && (
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'materials'}
                        className={`${styles.tabButton} ${activeTab === 'materials' ? styles.active : ''}`}
                        onClick={() => setActiveTab('materials')}
                    >
                        <span className={`${styles.tabIcon} ${styles.materialIcon}`} aria-hidden="true" />
                        Materiales
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent} role="tabpanel">
                {activeTab === 'messaging' ? (
                    <MessageSender adminName={adminName} prefill={prefill} audience={audience} />
                ) : activeTab === 'templates' ? (
                    <TemplateManager audience={audience} />
                ) : activeTab === 'materials' && audience === 'ambassador' ? (
                    <AmbassadorMaterialsManager />
                ) : (
                    <CommHistory adminName={adminName} isSuperAdmin={isSuperAdmin} audience={audience} />
                )}
            </div>
        </div>
    );
}
