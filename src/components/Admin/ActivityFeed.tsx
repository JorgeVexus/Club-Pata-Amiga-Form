'use client';

import React, { useState } from 'react';
import styles from './ActivityFeed.module.css';

export interface ActivityLog {
    id: string;
    type: 'approved' | 'rejected';
    targetName: string;
    adminName: string;
    timestamp: string; // ISO Date
    role: 'Miembro' | 'Embajador';
    detail?: string; // e.g. "Reembolso #B568" or just "Solicitud #C474"
}

interface ActivityFeedProps {
    title: string;
    logs: ActivityLog[];
    currentAdminView?: boolean; // If true, maybe some specific styling?
}

export default function ActivityFeed({ title, logs }: ActivityFeedProps) {
    const [filter, setFilter] = useState<'all' | 'rejected' | 'approved'>('all');
    const [search, setSearch] = useState('');

    // Time Ago Helper
    const timeAgo = (dateData: string) => {
        const date = new Date(dateData);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return `Hace ${Math.floor(interval)} años`;

        interval = seconds / 2592000;
        if (interval > 1) return `Hace ${Math.floor(interval)} meses`;

        interval = seconds / 86400;
        if (interval > 1) return `Hace ${Math.floor(interval)} días`;

        interval = seconds / 3600;
        if (interval > 1) return `Hace ${Math.floor(interval)} horas`;

        interval = seconds / 60;
        if (interval > 1) return `Hace ${Math.floor(interval)} minutos`;

        return "Hace un momento";
    };

    const filteredLogs = logs
        .filter(log => {
            if (filter === 'all') return true;
            return log.type === filter;
        })
        .filter(log => {
            if (!search) return true;
            const term = search.toLowerCase();
            return (
                log.targetName.toLowerCase().includes(term) ||
                log.adminName.toLowerCase().includes(term) ||
                (log.detail || '').toLowerCase().includes(term)
            );
        });

    return (
        <div className={styles.feedContainer}>
            <h2 className={styles.title}>{title}</h2>

            {/* Filter Tabs */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todas
                </button>
                <button
                    className={`${styles.filterButton} ${filter === 'rejected' ? styles.active : ''}`}
                    onClick={() => setFilter('rejected')}
                >
                    Rechazadas
                </button>
                <button
                    className={`${styles.filterButton} ${filter === 'approved' ? styles.active : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Resueltas
                </button>
            </div>

            {/* Search and Sort Controls */}
            <div className={styles.controls}>
                <div className={styles.search}>
                    <span>🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar"
                        className={styles.searchInput}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className={styles.sort}>
                    Filtrar por: <strong>Recientes ⌄</strong>
                </div>
            </div>

            <span className={styles.viewAll}>Ver toda la actividad</span>

            {/* List */}
            <div className={styles.feedList}>
                {filteredLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                        No hay actividad reciente.
                    </div>
                ) : (
                    filteredLogs.map(log => (
                        <div key={log.id} className={styles.activityCard}>
                            <div className={styles.cardHeader}>
                                <span>
                                    {log.type === 'approved' ? 'SOLICITUD APROBADA' : 'SOLICITUD RECHAZADA'} #{log.id.substring(0, 4).toUpperCase()}
                                </span>
                                <span className={styles.timeAgo}>{timeAgo(log.timestamp)}</span>
                            </div>

                            <div className={styles.tags}>
                                <div className={`${styles.tag} ${log.type === 'approved' ? styles.member : styles.rejected}`}>
                                    {log.type === 'approved' ? (log.role === 'Miembro' ? '👤 Miembro' : '🗣 Embajador') : (log.role === 'Embajador' ? '🗣 Embajador' : '⚠️ Rechazado')}
                                </div>
                                {/* Example extra tag if we had reimbursement logic */}
                                {/* <div className={`${styles.tag} ${styles.medical}`}>❄️ Emergencia médica</div> */}
                            </div>

                            <div className={styles.actors}>
                                {/* Admin Info */}
                                <div className={styles.actor}>
                                    <div className={styles.avatarIcon} style={{ background: '#FFD700', color: '#000' }}>
                                        🛡️
                                    </div>
                                    <div className={styles.actorInfo}>
                                        <span className={styles.roleLabel}>Administrador</span>
                                        <span className={styles.nameLabel}>{log.adminName}</span>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className={styles.actor}>
                                    <div className={styles.avatarIcon}>
                                        👤
                                    </div>
                                    <div className={styles.actorInfo}>
                                        <span className={styles.roleLabel}>Usuario</span>
                                        <span className={styles.nameLabel}>{log.targetName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
