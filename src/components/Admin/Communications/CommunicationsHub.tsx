'use client';

import React, { useState, useEffect } from 'react';
import styles from './CommunicationsHub.module.css';
import TemplateManager from './TemplateManager';
import MessageSender from './MessageSender';

export default function CommunicationsHub() {
    const [activeTab, setActiveTab] = useState<'messaging' | 'templates'>('messaging');

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
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'messaging' ? (
                    <MessageSender />
                ) : (
                    <TemplateManager />
                )}
            </div>
        </div>
    );
}
