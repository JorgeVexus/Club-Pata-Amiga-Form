'use client';

import React, { useState, useEffect } from 'react';
import styles from './CommunicationsHub.module.css';
import TemplateManager from './TemplateManager';
import MessageSender from './MessageSender';
import CommHistory from './CommHistory';

export default function CommunicationsHub() {
    const [activeTab, setActiveTab] = useState<'messaging' | 'templates' | 'history'>('messaging');

    return (
        <div className={styles.hubContainer}>
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
                    <MessageSender />
                ) : activeTab === 'templates' ? (
                    <TemplateManager />
                ) : (
                    <CommHistory />
                )}
            </div>
        </div>
    );
}
