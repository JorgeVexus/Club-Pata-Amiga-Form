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
import AmbassadorsTable from './AmbassadorsTable';
import AmbassadorDetailModal from './AmbassadorDetailModal';
import LegalDocsManager from './LegalDocsManager';
import SettingsPanel from './SettingsPanel';
import FinancialLedger from './Finance/FinancialLedger';
import BillingManagement from './Finance/BillingManagement';
import InteractiveReports from './Reports/InteractiveReports';
import { Ambassador } from '@/types/ambassador.types';

export default function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState<RequestType | 'admins' | 'legal-docs' | 'settings'>('all-members');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // ... rest of state stays the same
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [memberToReject, setMemberToReject] = useState<any>(null);
    const [rejectionToView, setRejectionToView] = useState<any>(null);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalRefunds: 0,
        activeWellnessCenters: 0,
        totalMembers: 0,
        totalAmbassadors: 0,
    });
    const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({
        member: 0,
        ambassador: 0,
        'wellness-center': 0,
        'solidarity-fund': 0,
        'communications': 0,
        'appeals': 0,
        'all-members': 0,
        'terminate-users': 0,
    });

    // Sub-estado para filtros específicos (Fondo Solidario)
    const [subFilter, setSubFilter] = useState<string | null>(null);

    // ... (rest of auth and load logic) ...
    const [currentAdminId, setCurrentAdminId] = useState('Admin');
    const [adminMemberstackId, setAdminMemberstackId] = useState<string | null>(null);
    const [adminName, setAdminName] = useState('Cargando...');
    const [adminRoleLabel, setAdminRoleLabel] = useState('Verificando...');
    const [isAdminSuper, setIsAdminSuper] = useState(false);
    const [recentActivityLogs, setRecentActivityLogs] = useState<ActivityLog[]>([]);
    const [yourActivityLogs, setYourActivityLogs] = useState<ActivityLog[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [skipPaymentEnabled, setSkipPaymentEnabled] = useState(false);

    const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
    const [commPrefill, setCommPrefill] = useState<{ recipientId?: string; templateSearch?: string; isTermination?: boolean } | null>(null);

    // Fetch helpers ... (same as before)
    const fetchMemberDetails = async (id: string, customSetter: (member: any) => void) => {
        try {
            const response = await fetch(`/api/admin/members/${id}`);
            const data = await response.json();
            if (data.success && data.member) customSetter(data.member);
            else alert('No se pudo cargar la información.');
        } catch (error) { console.error(error); }
    };

    const fetchAmbassadorDetails = async (id: string) => {
        try {
            const response = await fetch('/api/ambassadors?limit=1000');
            const data = await response.json();
            if (data.success) {
                const found = data.data.find((a: any) => a.id === id);
                if (found) setSelectedAmbassador(found);
            }
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam) setActiveFilter(tabParam as any);
            const memberId = params.get('member');
            if (memberId) fetchMemberDetails(memberId, setSelectedMember);
            if (tabParam || memberId) window.history.replaceState({}, '', '/admin/dashboard');
        }
    }, []);

    useEffect(() => {
        const fetchAdminRole = async () => {
            if (typeof window !== 'undefined' && (window as any).$memberstackDom) {
                try {
                    const member = await (window as any).$memberstackDom.getCurrentMember();
                    if (!member?.data?.id) return;
                    const currentMemberId = member.data.id;
                    const response = await fetch('/api/admin/me', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberstackId: currentMemberId })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setIsAdminSuper(data.isSuperAdmin);
                        setCurrentAdminId(data.name || 'Admin');
                        setAdminMemberstackId(currentMemberId);
                        setAdminName(data.name || 'Admin');
                        setAdminRoleLabel(data.isSuperAdmin ? 'Super Admin' : 'Administrador');
                        loadMetrics();
                        loadPendingCounts(data.isSuperAdmin);
                        loadActivityLogs(currentMemberId);
                        if (data.isSuperAdmin) {
                            fetch('/api/admin/settings/skip-payment').then(r => r.json()).then(d => setSkipPaymentEnabled(d.enabled)).catch(() => { });
                        }
                    }
                } catch (e) { console.error(e); }
            }
        };
        fetchAdminRole();
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (hasMounted && !isAdminSuper) {
            const restricted = ['appeals', 'admins', 'settings', 'all-members'];
            if (restricted.includes(activeFilter)) setActiveFilter('all-members');
        }
    }, [activeFilter, isAdminSuper, hasMounted]);

    async function loadMetrics() {
        try {
            const response = await fetch('/api/admin/metrics');
            const data = await response.json();
            if (data.success && data.metrics) setMetrics(data.metrics);
        } catch (error) { console.error(error); }
    }

    async function loadActivityLogs(memberstackId?: string) {
        try {
            const idToUse = memberstackId || adminMemberstackId;
            if (!idToUse) return;
            const response = await fetch('/api/admin/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberstackId: idToUse })
            });
            const data = await response.json();
            if (data.success) {
                setRecentActivityLogs(data.recentActivity || []);
                setYourActivityLogs(data.yourActivity || []);
            }
        } catch (error) { console.error(error); }
    }

    async function loadPendingCounts(isSuper: boolean = false) {
        try {
            const response = await fetch('/api/admin/members?status=pending');
            const data = await response.json();
            if (data.success && data.members) {
                const checkIsPaid = (m: any) => m.planConnections?.some((p: any) => p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'trialing');
                setPendingCounts(prev => ({ ...prev, member: data.members.filter((m: any) => checkIsPaid(m)).length }));
            }
            if (isSuper) {
                const appealRes = await fetch('/api/admin/pets/appealed');
                const appealData = await appealRes.json();
                if (appealData.success) setPendingCounts(prev => ({ ...prev, appeals: appealData.count || 0 }));
            }
            const ambassadorRes = await fetch('/api/ambassadors?status=pending&limit=1');
            const ambassadorData = await ambassadorRes.json();
            if (ambassadorData.success) setPendingCounts(prev => ({ ...prev, ambassador: ambassadorData.total || 0 }));
        } catch (error) { console.error(error); }
    }

    function handleNotificationClick(notification: any) {
        const userId = notification.metadata?.userId;
        if (userId) fetchMemberDetails(userId, setSelectedMember);
    }

    // Renderizado condicional del contenido principal
    const renderContent = () => {
        // Secciones de Finanzas
        if (activeFilter.startsWith('finance-')) {
            const type = activeFilter.replace('finance-', '') as any;
            return <FinancialLedger type={type} />;
        }

        // Secciones de Pagos y Facturación
        const billingViews = ['payment-records', 'billing', 'payment-status', 'auto-retries'];
        if (billingViews.includes(activeFilter)) {
            const view = activeFilter.replace('payment-', '') as any;
            return <BillingManagement view={view === 'records' ? 'records' : view === 'status' ? 'status' : (view === 'billing' ? 'billing' : 'retries')} />;
        }

        if (activeFilter === 'billing') {
            return <BillingManagement view="billing" />;
        }

        // Reporteo
        if (activeFilter === 'reports-interactive') {
            return <InteractiveReports />;
        }

        // Secciones Estándar
        switch (activeFilter) {
            case 'admins':
                return <AdminsTable />;
            case 'settings':
                return (
                    <SettingsPanel
                        skipPaymentEnabled={skipPaymentEnabled}
                        onToggleSkipPayment={async (enabled: boolean) => {
                            try {
                                const res = await fetch('/api/admin/settings/skip-payment', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ enabled, adminId: adminMemberstackId })
                                });
                                if (res.ok) setSkipPaymentEnabled(enabled);
                                else alert('Error al actualizar');
                            } catch { alert('Error de conexión'); }
                        }}
                    />
                );
            case 'communications':
            case 'communications-member':
            case 'communications-ambassador':
            case 'communications-wellness':
                const audience = activeFilter.includes('-') 
                    ? activeFilter.split('-')[1] as any 
                    : 'member'; // Default to member for the legacy 'communications' ID
                
                return (
                    <CommunicationsHub
                        adminName={adminName}
                        isSuperAdmin={isAdminSuper}
                        prefill={commPrefill}
                        audience={audience}
                    />
                );
            case 'ambassador':
                return <AmbassadorsTable onViewDetails={(amb) => setSelectedAmbassador(amb)} />;
            case 'legal-docs':
                return <LegalDocsManager />;
            default:
                // RequestsTable para Miembros, Centros, Fondo Solidario, etc.
                return (
                    <>
                        <RequestsTable
                            filter={(subFilter as any) || 'all'}
                            isSuperAdmin={isAdminSuper}
                            requestType={activeFilter === 'all-members' ? 'all' : (activeFilter === 'terminate-users' ? 'terminate-users' : activeFilter as any)}
                            mode={activeFilter === 'terminate-users' ? 'termination' : 'default'}
                            onViewDetails={(id, type, petId) => {
                                if (type === 'ambassador') fetchAmbassadorDetails(id);
                                else {
                                    setSelectedPetId(petId || null);
                                    fetchMemberDetails(id, setSelectedMember);
                                }
                            }}
                            onViewRejectionReason={(id) => fetchMemberDetails(id, setRejectionToView)}
                            onApprove={async (id, type) => {
                                if (type === 'ambassador') {
                                    if (!confirm('¿Aprobar este embajador?')) return;
                                    try {
                                        const response = await fetch(`/api/ambassadors/${id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'approved' })
                                        });
                                        if (response.ok) { alert('Embajador aprobado'); window.location.reload(); }
                                        else alert('Error al aprobar');
                                    } catch (e) { console.error(e); }
                                } else {
                                    if (confirm('¿Estás seguro de aprobar este miembro?')) {
                                        try {
                                            const response = await fetch(`/api/admin/members/${id}/approve`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ adminId: currentAdminId })
                                            });
                                            if (response.ok) { alert('Miembro aprobado'); window.location.reload(); }
                                            else alert('Error al aprobar');
                                        } catch (error) { console.error(error); }
                                    }
                                }
                            }}
                            onReject={(id, type) => {
                                if (type === 'ambassador') {
                                    const reason = prompt('Motivo del rechazo (Embajador):');
                                    if (!reason) return;
                                    fetch(`/api/ambassadors/${id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
                                    }).then(res => {
                                        if (res.ok) { alert('Rechazado'); window.location.reload(); }
                                        else alert('Error');
                                    });
                                } else fetchMemberDetails(id, setMemberToReject);
                            }}
                            onDelete={async (id: string, type: any) => {
                                if (!confirm('¿ESTÁS SEGURO? Esta acción es permanente.')) return;
                                try {
                                    let url = `/api/admin/members/${id}/delete`;
                                    if (type === 'ambassador') url = `/api/ambassadors/${id}`;
                                    const res = await fetch(url, { method: 'DELETE' });
                                    if (res.ok) { alert('Eliminado correctamente'); window.location.reload(); }
                                    else alert('Error al eliminar');
                                } catch (e) { console.error(e); }
                            }}
                            onTerminate={(member) => {
                                setCommPrefill({ recipientId: member.id, templateSearch: 'Baja', isTermination: true });
                                setActiveFilter('communications');
                            }}
                        />
                        <div className={styles.activitySection}>
                            {isAdminSuper && <ActivityFeed title="Actividad reciente" logs={recentActivityLogs} />}
                            <ActivityFeed title="Tu actividad" logs={yourActivityLogs} />
                        </div>
                    </>
                );
        }
    };

    return (
        <div className={styles.dashboard}>
            <Navbar
                onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                onNotificationClick={handleNotificationClick}
            />

            <div className={styles.dashboardContent}>
                <div
                    className={`${styles.sidebarOverlay} ${isMobileMenuOpen ? styles.visible : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                <Sidebar
                    activeFilter={activeFilter as any}
                    onFilterChange={(filter: any) => {
                        // Soporte para sub-filtros de Fondo Solidario
                        if (typeof filter === 'object' && filter.id === 'solidarity-fund') {
                            setActiveFilter('solidarity-fund');
                            setSubFilter(filter.subStatus);
                        } else {
                            setActiveFilter(filter);
                            setSubFilter(null);
                        }
                        setIsMobileMenuOpen(false);
                    }}
                    pendingCounts={pendingCounts}
                    isMobileOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    isSuperAdmin={isAdminSuper}
                />

                <main className={styles.mainContent}>
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>
                                {REQUEST_TYPE_LABELS[activeFilter as RequestType] || 'Administración'}
                                {subFilter && ` - ${REQUEST_STATUS_LABELS[subFilter as RequestStatus]}`}
                            </h1>
                            <p className={styles.pageDate}>
                                {hasMounted && new Date().toLocaleDateString('es-MX', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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

                    {activeFilter !== 'admins' && <MetricCards metrics={metrics} />}

                    {renderContent()}
                </main>
            </div>

            {/* Modals ... (MemberDetailModal, RejectionModal, etc. - stay the same) */}
            <MemberDetailModal
                isOpen={!!selectedMember}
                onClose={() => { setSelectedMember(null); setSelectedPetId(null); }}
                member={selectedMember}
                showAppealSection={activeFilter === 'appeals'}
                selectedPetId={selectedPetId}
                isSuperAdmin={isAdminSuper}
                onApprove={async (id) => {
                    if (confirm('¿Aprobar?')) {
                        const res = await fetch(`/api/admin/members/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: currentAdminId }) });
                        if (res.ok) { alert('Aprobado'); window.location.reload(); }
                    }
                }}
                onReject={() => { setMemberToReject(selectedMember); setSelectedMember(null); }}
                onDataChange={() => window.location.reload()}
            />

            <RejectionModal
                isOpen={!!memberToReject}
                onClose={() => setMemberToReject(null)}
                memberName={`${memberToReject?.customFields?.['first-name'] || ''} ${memberToReject?.customFields?.['paternal-last-name'] || ''}`}
                onConfirm={async (reason) => {
                    const res = await fetch(`/api/admin/members/${memberToReject.id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: currentAdminId, reason }) });
                    if (res.ok) { alert('Rechazado'); window.location.reload(); }
                }}
            />

            <RejectionReasonModal
                isOpen={!!rejectionToView}
                onClose={() => setRejectionToView(null)}
                memberName={`${rejectionToView?.customFields?.['first-name'] || ''} ${rejectionToView?.customFields?.['paternal-last-name'] || ''}`.trim()}
                rejectionReason={rejectionToView?.customFields?.['rejection-reason'] || ''}
                rejectedBy={rejectionToView?.customFields?.['rejected-by'] || 'Admin'}
                rejectedAt={rejectionToView?.customFields?.['rejected-at'] || ''}
            />

            {selectedAmbassador && (
                <AmbassadorDetailModal
                    ambassador={selectedAmbassador}
                    onClose={() => setSelectedAmbassador(null)}
                    onRefresh={() => window.location.reload()}
                />
            )}
        </div>
    );
}

import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, RequestStatus } from '@/types/admin.types';
