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
import ActivityFeed, { ActivityLog } from './ActivityFeed';
import AdminsTable from './AdminsTable';
import CommunicationsHub from './Communications/CommunicationsHub';

export default function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState<RequestType | 'all' | 'admins'>('all');
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
        'communications': 0,
    });

    // Admin Identity & Activity State
    const [currentAdminId, setCurrentAdminId] = useState('Admin');
    const [adminName, setAdminName] = useState('Cargando...');
    const [adminRoleLabel, setAdminRoleLabel] = useState('Verificando...');
    const [isAdminSuper, setIsAdminSuper] = useState(false);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [hasMounted, setHasMounted] = useState(false);

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

    // Initial Data Load
    useEffect(() => {
        const fetchAdminRole = async () => {
            if (typeof window !== 'undefined' && window.$memberstackDom) {
                try {
                    const member = await window.$memberstackDom.getCurrentMember();
                    if (!member?.data?.id) return; // Wait for auth

                    const currentMemberId = member.data.id;

                    const response = await fetch('/api/admin/me', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberstackId: currentMemberId })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setIsAdminSuper(data.isSuperAdmin);
                        // Update UI with real data
                        setCurrentAdminId(data.name || 'Admin');
                        setAdminName(data.name || 'Admin');
                        setAdminRoleLabel(data.isSuperAdmin ? 'Super Admin' : 'Administrador');
                    }
                } catch (e) {
                    console.error("Error checking permissions", e);
                }
            }
        };

        fetchAdminRole();
        loadMetrics();
        loadPendingCounts();
        loadActivityLogs();
        setHasMounted(true);
    }, []);

    async function loadMetrics() {
        try {
            const response = await fetch('/api/admin/metrics');
            const data = await response.json();

            if (data.success && data.metrics) {
                setMetrics(data.metrics);
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    }

    async function loadActivityLogs() {
        try {
            // Fetch all members to derive activity
            const response = await fetch('/api/admin/members?status=all');
            const data = await response.json();

            if (data.success && data.members) {
                const logs: ActivityLog[] = [];
                data.members.forEach((m: any) => {
                    const name = `${m.customFields?.['first-name'] || ''} ${m.customFields?.['paternal-last-name'] || ''}`.trim() || 'Usuario';

                    // Approval Log
                    if (m.customFields?.['approved-at']) {
                        logs.push({
                            id: m.id,
                            type: 'approved',
                            targetName: name,
                            adminName: m.customFields?.['approved-by'] || 'Admin',
                            timestamp: m.customFields?.['approved-at'],
                            role: 'Miembro'
                        });
                    }

                    // Rejection Log
                    if (m.customFields?.['rejected-at']) {
                        logs.push({
                            id: m.id,
                            type: 'rejected',
                            targetName: name,
                            adminName: m.customFields?.['rejected-by'] || 'Admin',
                            timestamp: m.customFields?.['rejected-at'],
                            role: 'Miembro'
                        });
                    }
                });

                // Sort newest first
                logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setActivityLogs(logs);
            }

        } catch (error) {
            console.error('Error loading activity:', error);
        }
    }

    async function loadPendingCounts() {
        try {
            const response = await fetch('/api/admin/members?status=pending');
            const data = await response.json();
            if (data.success && data.members) {
                setPendingCounts(prev => ({ ...prev, member: data.members.length }));
            }
        } catch (error) { console.error('Error loading pending counts', error); }
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
                    isSuperAdmin={isAdminSuper}
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
                                                activeFilter === 'admins' ? 'Administradores' :
                                                    'Fondo Solidario'}
                            </h1>
                            <p className={styles.pageDate}>
                                {hasMounted && new Date().toLocaleDateString('es-MX', {
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
                                    <div className={styles.adminName}>{adminName}</div>
                                    <div className={styles.adminRole}>{adminRoleLabel}</div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Metric Cards - Hide when viewing admins */}
                    {activeFilter !== 'admins' && <MetricCards metrics={metrics} />}

                    {/* Admins Table - Only for Super Admins */}
                    {activeFilter === 'admins' ? (
                        <AdminsTable />
                    ) : activeFilter === 'communications' ? (
                        <CommunicationsHub
                            adminName={adminName}
                            isSuperAdmin={isAdminSuper}
                        />
                    ) : (
                        <>
                            {/* Requests Table */}
                            <RequestsTable
                                filter="all"
                                requestType={activeFilter === 'all' ? 'all' : activeFilter as any}
                                onViewDetails={(id) => fetchMemberDetails(id, setSelectedMember)}
                                onViewRejectionReason={(id) => fetchMemberDetails(id, setRejectionToView)}
                                onApprove={async (id) => {
                                    if (confirm('¿Estás seguro de aprobar este miembro?')) {
                                        try {
                                            const response = await fetch(`/api/admin/members/${id}/approve`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ adminId: currentAdminId })
                                            });

                                            if (response.ok) {
                                                alert('Miembro aprobado');
                                                window.location.reload();
                                            } else {
                                                alert('Error al aprobar');
                                            }
                                        } catch (error) {
                                            console.error('Error:', error);
                                            alert('Error de conexión');
                                        }
                                    }
                                }}
                                onReject={(id) => fetchMemberDetails(id, setMemberToReject)}
                            />

                            {/* Activity History Section */}
                            <div className={styles.activitySection}>
                                {/* Panel 1: Recent Activity (Super Admin Only) */}
                                {isAdminSuper && (
                                    <ActivityFeed
                                        title="Actividad reciente"
                                        logs={activityLogs}
                                    />
                                )}

                                {/* Panel 2: Your Activity (Everyone) */}
                                <ActivityFeed
                                    title="Tu actividad"
                                    logs={activityLogs.filter(log =>
                                        log.adminName === currentAdminId ||
                                        log.adminName === 'Admin' ||
                                        log.adminName === 'current-admin-id' ||
                                        log.adminName === 'Lucero Marvel'
                                    )}
                                />
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Modals outside main content */}
            <MemberDetailModal
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                member={selectedMember}
                onApprove={async (id) => {
                    if (confirm('¿Estás seguro de aprobar este miembro?')) {
                        try {
                            const response = await fetch(`/api/admin/members/${id}/approve`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adminId: currentAdminId })
                            });

                            if (response.ok) {
                                alert('Miembro aprobado');
                                window.location.reload();
                            } else {
                                alert('Error al aprobar');
                            }
                        } catch (error) {
                            console.error('Error:', error);
                        }
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
                memberName={`${memberToReject?.customFields?.['first-name'] || ''} ${memberToReject?.customFields?.['paternal-last-name'] || ''}`}
                onConfirm={async (reason) => {
                    if (!memberToReject) return;

                    try {
                        const response = await fetch(`/api/admin/members/${memberToReject.id}/reject`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                adminId: currentAdminId,
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
        </div >
    );
}
