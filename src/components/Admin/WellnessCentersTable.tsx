'use client';

import React, { useState, useEffect } from 'react';
import styles from './RequestsTable.module.css';
import { adminFetch } from '@/utils/admin-fetch';
import { WellnessCenter } from '@/types/wellness.types';

interface Props {
    onViewDetails: (center: WellnessCenter) => void;
    refreshKey?: number;
}

export default function WellnessCentersTable({ onViewDetails, refreshKey }: Props) {
    const [centers, setCenters] = useState<WellnessCenter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortFilter, setSortFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    useEffect(() => {
        loadStats();
    }, [refreshKey]);

    useEffect(() => {
        fetchCenters();
    }, [sortFilter, refreshKey]);

    const loadStats = async () => {
        try {
            const statuses = ['all', 'pending', 'approved', 'rejected'] as const;
            const results = await Promise.all(statuses.map(async (status) => {
                const query = status !== 'all' ? `?status=${status}` : '';
                const response = await adminFetch(`/api/admin/wellness${query}`);
                const data = await response.json();
                return { status, count: data.success ? data.data.length : 0 };
            }));

            setStats({
                total: results.find(r => r.status === 'all')?.count || 0,
                pending: results.find(r => r.status === 'pending')?.count || 0,
                approved: results.find(r => r.status === 'approved')?.count || 0,
                rejected: results.find(r => r.status === 'rejected')?.count || 0
            });
        } catch (error) {
            console.error('Error loading wellness stats:', error);
        }
    };

    const fetchCenters = async () => {
        setIsLoading(true);
        try {
            const query = sortFilter !== 'all' ? `?status=${sortFilter}` : '';
            const response = await adminFetch(`/api/admin/wellness${query}`);
            const data = await response.json();
            if (data.success) {
                setCenters(data.data);
            }
        } catch (error) {
            console.error('Error fetching wellness centers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCenters = centers.filter(c => 
        c.establishment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.requestsContainer}>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🎯</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.total}</div>
                        <div className={styles.statLabel}>Total Centros</div>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statPending}`}>
                    <div className={styles.statIcon}>⏳</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.pending}</div>
                        <div className={styles.statLabel}>Pendientes</div>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statApproved}`}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.approved}</div>
                        <div className={styles.statLabel}>Activos</div>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statRejected}`}>
                    <div className={styles.statIcon}>❌</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{stats.rejected}</div>
                        <div className={styles.statLabel}>Rechazados</div>
                    </div>
                </div>
            </div>

            <div className={styles.requestsSection}>
                <div className={styles.requestsHeader}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        <h2 className={styles.requestsTitle}>Gestión de Centros de Bienestar</h2>
                        
                        <div className={styles.tabFilters}>
                            <button
                                className={`${styles.tabBtn} ${sortFilter === 'all' ? styles.active : ''}`}
                                onClick={() => setSortFilter('all')}
                            >
                                Todos <span className={styles.tabBadge}>{stats.total}</span>
                            </button>
                            <button
                                className={`${styles.tabBtn} ${sortFilter === 'pending' ? styles.active : ''}`}
                                onClick={() => setSortFilter('pending')}
                            >
                                Pendientes <span className={styles.tabBadge}>{stats.pending}</span>
                            </button>
                            <button
                                className={`${styles.tabBtn} ${sortFilter === 'approved' ? styles.active : ''}`}
                                onClick={() => setSortFilter('approved')}
                            >
                                Activos <span className={styles.tabBadge}>{stats.approved}</span>
                            </button>
                            <button
                                className={`${styles.tabBtn} ${sortFilter === 'rejected' ? styles.active : ''}`}
                                onClick={() => setSortFilter('rejected')}
                            >
                                Rechazados <span className={styles.tabBadge}>{stats.rejected}</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.requestsControls}>
                        <div className={styles.searchBox}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Buscar por nombre o email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Establecimiento</th>
                                <th>Servicios</th>
                                <th>Estado</th>
                                <th>Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className={styles.emptyCell}>
                                        <div className={styles.loading}>Cargando aliados...</div>
                                    </td>
                                </tr>
                            ) : filteredCenters.length > 0 ? (
                                filteredCenters.map((center) => (
                                    <tr key={center.id}>
                                        <td>
                                            <div className={styles.memberDetails}>
                                                <span className={styles.memberName}>{center.establishment_name}</span>
                                                <span className={styles.memberEmail}>{center.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.servicesContainer}>
                                                {center.services.map((service, idx) => (
                                                    <span key={idx} className={styles.serviceTag}>
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[center.status]}`}>
                                                {center.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{new Date(center.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button 
                                                    className={styles.viewButton}
                                                    onClick={() => onViewDetails(center)}
                                                >
                                                    Ver Detalles
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className={styles.emptyCell}>
                                        No se encontraron centros de bienestar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
