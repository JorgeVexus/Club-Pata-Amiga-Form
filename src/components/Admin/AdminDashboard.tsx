'use client';

import React, { useState, useEffect } from 'react';
import '@/styles/admin-globals.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MetricCards from './MetricCards';
import styles from './AdminDashboard.module.css';
import type { RequestType, DashboardMetrics } from '@/types/admin.types';

export default function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState<RequestType | 'all'>('all');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalRefunds: 0,
        activeWellnessCenters: 0,
        totalMembers: 0,
        totalAmbassadors: 0,
    });
    const [pendingCounts, setPendingCounts] = useState({
        member: 0,
        ambassador: 0,
        'wellness-center': 0,
        'solidarity-fund': 0,
    });

    // Cargar métricas al montar
    useEffect(() => {
        loadMetrics();
        loadPendingCounts();
    }, []);

    async function loadMetrics() {
        try {
            // TODO: Llamar a API para obtener métricas reales
            // Por ahora usamos datos de ejemplo
            setMetrics({
                totalRefunds: 124500,
                activeWellnessCenters: 16,
                totalMembers: 98,
                totalAmbassadors: 26,
            });
        } catch (error) {
            console.error('Error cargando métricas:', error);
        }
    }

    async function loadPendingCounts() {
        try {
            // Obtener conteo de miembros pendientes
            const response = await fetch('/api/admin/members?status=pending');
            const data = await response.json();

            setPendingCounts(prev => ({
                ...prev,
                member: data.count || 0,
            }));
        } catch (error) {
            console.error('Error cargando conteos:', error);
        }
    }

    return (
        <div className={styles.dashboard}>
            <Navbar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

            <div className={styles.dashboardContent}>
                {/* Mobile Overlay */}
                <div
                    className={`${styles.sidebarOverlay} ${isMobileMenuOpen ? styles.visible : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                <Sidebar
                    activeFilter={activeFilter}
                    onFilterChange={(filter) => {
                        setActiveFilter(filter);
                        setIsMobileMenuOpen(false); // Close menu on selection
                    }}
                    pendingCounts={pendingCounts}
                    isMobileOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                />

                <main className={styles.mainContent}>
                    {/* Header */}
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>
                                {activeFilter === 'all' ? 'Gestión general' :
                                    activeFilter === 'member' ? 'Miembros' :
                                        activeFilter === 'ambassador' ? 'Embajadores' :
                                            activeFilter === 'wellness-center' ? 'Centros de Bienestar' :
                                                'Fondo Solidario'}
                            </h1>
                            <p className={styles.pageDate}>
                                {new Date().toLocaleDateString('es-MX', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className={styles.headerRight}>
                            <div className={styles.adminBadge}>
                                <span className={styles.adminIcon}>👤</span>
                                <div className={styles.adminInfo}>
                                    <div className={styles.adminName}>Lucero Marvel</div>
                                    <div className={styles.adminRole}>Administrador</div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Metric Cards */}
                    <MetricCards metrics={metrics} />

                    {/* TODO: Tabla de solicitudes */}
                    <div style={{ padding: '2rem', background: 'white', borderRadius: '1rem' }}>
                        <h2>Solicitudes</h2>
                        <p>Tabla de solicitudes en construcción...</p>
                        <p>Filtro activo: <strong>{activeFilter}</strong></p>
                    </div>
                </main>
            </div>
        </div>
    );
}
