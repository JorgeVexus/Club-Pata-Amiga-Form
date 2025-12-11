'use client';

import React, { useState, useEffect } from 'react';
import '@/styles/admin-globals.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MetricCards from './MetricCards';
import RequestsTable from './RequestsTable';
import styles from './AdminDashboard.module.css';
import type { RequestType, DashboardMetrics } from '@/types/admin.types';
import MemberDetailModal from './MemberDetailModal';
import RejectionModal from './RejectionModal';
import RejectionReasonModal from './RejectionReasonModal';

export default function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState<RequestType | 'all'>('all');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberToReject, setMemberToReject] = useState<any>(null); // For rejection action
    const [rejectionToView, setRejectionToView] = useState<any>(null); // For viewing reason
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

    // Helper to fetch single member details
    const fetchMemberDetails = async (id: string, customSetter: (member: any) => void) => {
        try {
            const response = await fetch(`/api/admin/members/${id}`);
            const data = await response.json();

            if (data.success && data.member) {
                customSetter(data.member);
            } else {
                alert('No se pudo cargar la información del miembro.');
            }
        } catch (error) {
            console.error('Error fetching member details:', error);
            alert('Error cargando detalles.');
        }
    };

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

                    {/* Requests Table */}
                    <RequestsTable
                        filter={activeFilter === 'all' ? 'recents' : 'recents'}
                        onViewDetails={(id) => fetchMemberDetails(id, setSelectedMember)}
                        onViewRejectionReason={(id) => fetchMemberDetails(id, setRejectionToView)}
                        onApprove={async (id) => {
                            // Quick approve from table without modal
                            if (confirm('¿Estás seguro de aprobar este miembro?')) {
                                try {
                                    const response = await fetch(`/api/admin/members/${id}/approve`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ adminId: 'current-admin-id' })
                                    });

                                    if (response.ok) {
                                        alert('Miembro aprobado');
                                        window.location.reload();
                                    }
                                } catch (error) {
                                    alert('Error al aprobar');
                                }
                            }
                        }}
                        onReject={async (memberId) => {
                            // Fetch basic info to show name in modal if coming from table
                            fetchMemberDetails(memberId, setMemberToReject);
                        }}
                    />
                </main>
            </div>

            <MemberDetailModal
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                member={selectedMember}
                onApprove={async (id) => {
                    try {
                        const response = await fetch(`/api/admin/members/${id}/approve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adminId: 'current-admin-id' })
                        });

                        if (response.ok) {
                            alert('Miembro aprobado exitosamente');
                            setSelectedMember(null);
                            window.location.reload();
                        }
                    } catch (error) {
                        alert('Error al aprobar miembro');
                    }
                }}
                onReject={(id) => {
                    setMemberToReject(selectedMember);
                    setSelectedMember(null); // Close detail modal
                }}
            />

            <RejectionModal
                isOpen={!!memberToReject}
                onClose={() => setMemberToReject(null)}
                memberName={`${memberToReject?.customFields?.['first-name'] || ''} ${memberToReject?.customFields?.['paternal-last-name'] || ''}`.trim() || 'Usuario'}
                onConfirm={async (reason) => {
                    try {
                        const response = await fetch(`/api/admin/members/${memberToReject.id}/reject`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                adminId: 'current-admin-id',
                                reason: reason
                            })
                        });

                        if (response.ok) {
                            alert('Solicitud rechazada correctamente.');
                            setMemberToReject(null);
                            window.location.reload();
                        } else {
                            alert('Error al rechazar la solicitud.');
                        }
                    } catch (error) {
                        console.error('Error rejecting:', error);
                        alert('Error de red al rechazar.');
                    }
                }}
            />

            <RejectionReasonModal
                isOpen={!!rejectionToView}
                onClose={() => setRejectionToView(null)}
                memberName={`${rejectionToView?.customFields?.['first-name'] || ''} ${rejectionToView?.customFields?.['paternal-last-name'] || ''}`.trim() || 'Usuario'}
                rejectionReason={rejectionToView?.customFields?.['rejection-reason'] || ''}
                rejectedBy={rejectionToView?.customFields?.['rejected-by'] || 'Admin'}
                rejectedAt={rejectionToView?.customFields?.['rejected-at'] || ''}
            />
        </div>
    );
}
