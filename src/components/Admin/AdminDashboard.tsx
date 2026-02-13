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
import { Ambassador } from '@/types/ambassador.types';

export default function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState<RequestType | 'all' | 'admins' | 'legal-docs' | 'settings'>('all');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null); // Para apelaciones por mascota
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
        'appeals': 0,
    });

    // Admin Identity & Activity State
    const [currentAdminId, setCurrentAdminId] = useState('Admin');
    const [adminName, setAdminName] = useState('Cargando...');
    const [adminRoleLabel, setAdminRoleLabel] = useState('Verificando...');
    const [isAdminSuper, setIsAdminSuper] = useState(false);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [skipPaymentEnabled, setSkipPaymentEnabled] = useState(false);

    // Estado para embajadores
    const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);

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

    // Helper to fetch single ambassador details
    const fetchAmbassadorDetails = async (id: string) => {
        try {
            // Reusing the list endpoint with ID filter or just iterating?
            // Since we don't have a directGET /api/ambassadors/:id implemented in the context (only PATCH),
            // we will fetch by ID using URL params if supported or filter from list. 
            // Actually, querying Supabase directly for one ID is better, but let's see if the API supports it.
            // The GET /api/ambassadors endpoint supports search.
            // Let's try searching by ID first or use the list and find.
            // Ideally we should have a GET /api/ambassadors/[id] endpoint.
            // Assuming for now we can filter or we just need to implement a detailed fetch.
            // Quick fix: fetch list with search=id (might not work if search doesn't query ID).
            // Better: use the existing /api/ambassadors endpoint filtering.

            // Checking AmbassadorsTable.tsx, it passes the FULL object to onViewDetails. 
            // But RequestsTable only has summary.
            // Let's try to fetch all (or limit 1 with search?)
            // Actually, let's implement a quick fetch by ID logic here or just rely on the list if it's paginated.
            // WORKAROUND: Iterate or fetch specifically.
            // To be safe and quick, I'll fetch the specific ambassador by ID using the same list endpoint if possible, 
            // OR allow AdminDashboard to open the modal.

            // Since we don't have a direct 'get by id' handy in the client code viewed in AmbassadorsTable (it uses local state),
            // I will assume I can fetch it via the list endpoint with a filter, OR I'll add a specific endpoint call if needed.
            // For now, let's try fetching the specific item via a query parameter if possible, or just the list.

            // Let's try to use the generic endpoint with a limit to find it? No.
            // Let's just use the `RequestsTable` data if possible? No, incomplete.

            // Valid fallback: Fetch all ambassadors (filtered) and find. 
            // API: /api/ambassadors?search=EMAIL might work if we have email.
            // But we have ID. 
            // Let's assume for now we can't easily fetch single.

            // WAIT! I can use /api/ambassadors/[id] if it exists?
            // The file tree showed `AmbassadorsTable.tsx` utilizing `/api/ambassadors`. 
            // `src/app/api/ambassadors/[id]/route.ts` likely exists for PATCH (approve/reject).
            // Does it support GET? I haven't viewed it.

            // Let's try GET /api/ambassadors?status=all&search=ID? Not guaranteed.
            // Let's try to fetch the list and find locally.
            const response = await fetch('/api/ambassadors?limit=1000'); // Valid for now
            const data = await response.json();
            if (data.success) {
                const found = data.data.find((a: any) => a.id === id);
                if (found) {
                    setSelectedAmbassador(found);
                } else {
                    alert('Embajador no encontrado');
                }
            }
        } catch (error) {
            console.error('Error fetching ambassador:', error);
        }
    };


    // 🆕 Verificar si hay un miembro para abrir desde la URL (desde notificación)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);

            // Verificar si hay un tab específico para abrir (ej: ?tab=appeals)
            const tabParam = params.get('tab');
            if (tabParam) {
                const validTabs = ['member', 'ambassador', 'wellness-center', 'solidarity-fund', 'communications', 'appeals'];
                if (validTabs.includes(tabParam)) {
                    setActiveFilter(tabParam as any);
                }
            }

            // Verificar si hay un miembro para abrir
            const memberId = params.get('member');
            if (memberId) {
                // Abrir directamente el detalle del miembro
                fetchMemberDetails(memberId, setSelectedMember);
            }

            // Limpiar la URL si hay parámetros
            if (tabParam || memberId) {
                window.history.replaceState({}, '', '/admin/dashboard');
            }
        }
    }, []);

    // Initial Data Load and Auth Check
    useEffect(() => {
        const fetchAdminRole = async () => {
            // Accessing window.MemberstackDom is tricky with TS, assuming it's available or casted
            // Using simple check
            if (typeof window !== 'undefined' && (window as any).$memberstackDom) {
                try {
                    const member = await (window as any).$memberstackDom.getCurrentMember();
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

                        // Cargar el resto después de verificar el rol
                        loadMetrics();
                        loadPendingCounts(data.isSuperAdmin);
                        loadActivityLogs();

                        // Cargar skip payment flag si es super admin
                        if (data.isSuperAdmin) {
                            fetch('/api/admin/settings/skip-payment')
                                .then(r => r.json())
                                .then(d => setSkipPaymentEnabled(d.enabled))
                                .catch(() => { });
                        }
                    }
                } catch (e) {
                    console.error("Error checking permissions", e);
                }
            }
        };

        fetchAdminRole();
        setHasMounted(true);
    }, []);

    // Seguridad: Redirigir si intenta entrar a filtros de superadmin no siendo uno
    useEffect(() => {
        if (hasMounted && !isAdminSuper) {
            if (activeFilter === 'appeals' || activeFilter === 'admins' || activeFilter === 'settings') {
                setActiveFilter('all');
            }
        }
    }, [activeFilter, isAdminSuper, hasMounted]);


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
                const logs: any[] = []; // Explicit any to avoid cluttering with ActivityLog interface here
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

    async function loadPendingCounts(isSuper: boolean = false) {
        try {
            const response = await fetch('/api/admin/members?status=pending');
            const data = await response.json();
            if (data.success && data.members) {
                setPendingCounts(prev => ({ ...prev, member: data.members.length }));
            }

            // Load appealed counts only if superadmin
            if (isSuper) {
                const appealRes = await fetch('/api/admin/pets/appealed');
                const appealData = await appealRes.json();
                if (appealData.success) {
                    setPendingCounts(prev => ({ ...prev, appeals: appealData.count || appealData.pets?.length || 0 }));
                }
            } else {
                setPendingCounts(prev => ({ ...prev, appeals: 0 }));
            }

            // Load ambassador pending counts
            const ambassadorRes = await fetch('/api/ambassadors?status=pending&limit=1');
            const ambassadorData = await ambassadorRes.json();
            if (ambassadorData.success) {
                setPendingCounts(prev => ({ ...prev, ambassador: ambassadorData.total || 0 }));
            }
        } catch (error) { console.error('Error loading pending counts', error); }
    }

    // 🆕 Handler para cuando se hace clic en una notificación
    function handleNotificationClick(notification: any) {
        const userId = notification.metadata?.userId;
        if (userId) {
            // Abrir el modal del miembro
            fetchMemberDetails(userId, setSelectedMember);
        }
    }

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
                    activeFilter={activeFilter}
                    onFilterChange={(filter: any) => {

                        setActiveFilter(filter);
                        setIsMobileMenuOpen(false); // Close menu on selection
                    }}
                    pendingCounts={pendingCounts}
                    isMobileOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    isSuperAdmin={isAdminSuper}
                />

                <main className={styles.mainContent}>
                    {/* ... (Header remains) ... */}
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>
                                {activeFilter === 'all' ? 'Gestión general' :
                                    activeFilter === 'member' ? 'Miembros' :
                                        activeFilter === 'ambassador' ? 'Embajadores' :
                                            activeFilter === 'wellness-center' ? 'Centros de Bienestar' :
                                                activeFilter === 'admins' ? 'Administradores' :
                                                    activeFilter === 'appeals' ? 'Apelaciones' :
                                                        activeFilter === 'legal-docs' ? 'Documentos Legales' :
                                                            activeFilter === 'settings' ? 'Configuración' :
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
                    ) : activeFilter === 'settings' ? (
                        <SettingsPanel
                            skipPaymentEnabled={skipPaymentEnabled}
                            onToggleSkipPayment={async (enabled: boolean) => {
                                try {
                                    const res = await fetch('/api/admin/settings/skip-payment', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ enabled, adminId: currentAdminId })
                                    });
                                    if (res.ok) setSkipPaymentEnabled(enabled);
                                    else alert('Error al actualizar');
                                } catch { alert('Error de conexión'); }
                            }}
                        />
                    ) : activeFilter === 'communications' ? (
                        <CommunicationsHub
                            adminName={adminName}
                            isSuperAdmin={isAdminSuper}
                        />
                    ) : activeFilter === 'ambassador' ? (
                        <AmbassadorsTable
                            onViewDetails={(amb) => setSelectedAmbassador(amb)}
                        />
                    ) : activeFilter === 'legal-docs' ? (
                        <LegalDocsManager />
                    ) : (
                        <>
                            {/* Requests Table */}
                            <RequestsTable
                                filter="all"
                                isSuperAdmin={isAdminSuper}
                                requestType={activeFilter === 'all' ? 'all' : activeFilter as any}
                                onViewDetails={(id, type, petId) => {
                                    if (type === 'ambassador') {
                                        fetchAmbassadorDetails(id);
                                    } else if (type === 'appeal') { // Handling appeal type
                                        fetchMemberDetails(id, setSelectedMember);
                                        setSelectedPetId(petId || null);
                                    } else {
                                        // Default member
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
                                            if (response.ok) {
                                                alert('Embajador aprobado');
                                                window.location.reload();
                                            } else {
                                                alert('Error al aprobar');
                                            }
                                        } catch (e) { console.error(e); alert('Error de conexión'); }
                                    } else {
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
                                    }
                                }}
                                onReject={(id, type) => {
                                    if (type === 'ambassador') {
                                        fetchAmbassadorDetails(id); // Open details to reject from modal?
                                        // Or direct reject?
                                        // AmbassadorsTable handles reject with prompt.
                                        // Let's simple prompt here for consistency with inline actions
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
                                    } else {
                                        fetchMemberDetails(id, setMemberToReject);
                                    }
                                }}
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
                onClose={() => {
                    setSelectedMember(null);
                    setSelectedPetId(null);
                }}
                member={selectedMember}
                showAppealSection={activeFilter === 'appeals'}
                selectedPetId={selectedPetId}
                isSuperAdmin={isAdminSuper}
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
                onDataChange={() => {
                    // Forzar recarga de RequestsTable
                    window.location.reload();
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

            {/* Modal de Detalle de Embajador */}
            {selectedAmbassador && (
                <AmbassadorDetailModal
                    ambassador={selectedAmbassador}
                    onClose={() => setSelectedAmbassador(null)}
                    onRefresh={() => {
                        setSelectedAmbassador(null);
                        // Forzar recarga de la lista
                        window.location.reload();
                    }}
                />
            )}
        </div >
    );
}
