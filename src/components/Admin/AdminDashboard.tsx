'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MetricCards from './MetricCards';
import RequestsTable from './RequestsTable';
import styles from './AdminDashboard.module.css';
import type { RequestType, DashboardMetrics } from '@/types/admin.types';
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, RequestStatus } from '@/types/admin.types';
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
import { adminFetch } from '@/utils/admin-fetch';
import SolidarityDashboard from './Solidarity/SolidarityDashboard';
import SolidarityRequestDetail from './Solidarity/SolidarityRequestDetail';
import CancellationsTable from './CancellationsTable';
import WellnessCentersTable from './WellnessCentersTable';
import WellnessCenterDetailModal from './WellnessCenterDetailModal';
import { WellnessCenter } from '@/types/wellness.types';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [activeFilter, setActiveFilter] = useState<RequestType | 'admins' | 'legal-docs' | 'settings'>('all-members');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedSolidarityRequestId, setSelectedSolidarityRequestId] = useState<string | null>(null);

    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [memberToReject, setMemberToReject] = useState<any>(null);
    const [rejectionToView, setRejectionToView] = useState<any>(null);
    const [selectedWellnessCenter, setSelectedWellnessCenter] = useState<WellnessCenter | null>(null);
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

    const [subFilter, setSubFilter] = useState<string | null>(null);
    const [currentAdminId, setCurrentAdminId] = useState('Admin');
    const [adminMemberstackId, setAdminMemberstackId] = useState<string | null>(null);
    const [adminName, setAdminName] = useState('Cargando...');
    const [adminRoleLabel, setAdminRoleLabel] = useState('Verificando...');
    const [isAdminSuper, setIsAdminSuper] = useState(false);
    const [recentActivityLogs, setRecentActivityLogs] = useState<ActivityLog[]>([]);
    const [yourActivityLogs, setYourActivityLogs] = useState<ActivityLog[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [skipPaymentEnabled, setSkipPaymentEnabled] = useState(false);

    const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
    const [commPrefill, setCommPrefill] = useState<{ recipientId?: string; templateSearch?: string; isTermination?: boolean } | null>(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const triggerInPlaceRefresh = () => {
        setRefreshKey(prev => prev + 1);
        loadMetrics(adminMemberstackId || undefined);
        loadPendingCounts(isAdminSuper, adminMemberstackId || undefined);
        loadActivityLogs(adminMemberstackId || undefined);
    };

    // Fetch helpers
    const fetchMemberDetails = async (id: string, customSetter: (member: any) => void) => {
        try {
            // Force refresh to get the latest data from Memberstack
            const response = await adminFetch(`/api/admin/members/${id}?refresh=true`);
            const data = await response.json();
            if (data.success && data.member) {
                customSetter(data.member);
                console.log(`🔄 Member details refreshed for ${id}`);
            } else {
                alert('No se pudo cargar la información.');
            }
        } catch (error) { 
            console.error('Error fetching member details:', error);
            alert('Error al cargar la información del miembro.');
        }
    };

    const fetchAmbassadorDetails = async (id: string) => {
        try {
            const response = await adminFetch(`/api/ambassadors/${id}`);
            const data = await response.json();
            if (data.success) {
                setSelectedAmbassador(data.data);
            }
        } catch (error) { console.error(error); }
    };

    // Escuchar cambios en los parámetros de la URL para navegación profunda (notificaciones, links directos)
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) setActiveFilter(tabParam as any);

        const memberId = searchParams.get('member');
        if (memberId) {
            fetchMemberDetails(memberId, setSelectedMember);
        } else {
            // Si el parámetro member se elimina (usuario regresó de la vista de detalle), 
            // forzar refresco de la lista para obtener datos actualizados
            triggerInPlaceRefresh();
        }

        const requestId = searchParams.get('requestId');
        if (requestId) {
            setActiveFilter('solidarity-fund');
            setSelectedSolidarityRequestId(requestId);
        }

        const ambId = searchParams.get('ambassadorId');
        if (ambId) {
            setActiveFilter('ambassadors' as any);
            fetchAmbassadorDetails(ambId);
        }
    }, [searchParams]);

    // Escuchar evento de recarga forzada desde el navbar
    useEffect(() => {
        const handleForceRefresh = () => {
            console.log('🔄 Recibida señal de recarga forzada');
            triggerInPlaceRefresh();
        };

        window.addEventListener('force-refresh-dashboard', handleForceRefresh);
        return () => {
            window.removeEventListener('force-refresh-dashboard', handleForceRefresh);
        };
    }, []);

    const handleFilterChange = (filter: any) => {
        if (typeof filter === 'object') {
            setActiveFilter(filter.id);
            setSubFilter(filter.subStatus);
        } else {
            setActiveFilter(filter);
            setSubFilter(null);
        }
        setIsMobileMenuOpen(false);
        setSelectedMember(null);
        setSelectedSolidarityRequestId(null);
        setSelectedAmbassador(null);
        
        // Limpiar URL al cambiar de pestaña manualmente
        router.push('/admin/dashboard');
    };

    useEffect(() => {
        const fetchAdminRole = async () => {
            if (typeof window !== 'undefined' && (window as any).$memberstackDom) {
                try {
                    const sessionActive = sessionStorage.getItem('admin_session_active');
                    const member = await (window as any).$memberstackDom.getCurrentMember();

                    if (member?.data) {
                        if (!sessionActive) {
                            console.log('🔄 Sesión nueva detectada (reinicio de navegador). Forzando logout por seguridad.');
                            await (window as any).$memberstackDom.logout();
                            window.location.href = '/admin/login?reason=session_expired';
                            return;
                        }
                    } else {
                        console.log('❌ No hay sesión activa. Redirigiendo...');
                        window.location.href = '/admin/login';
                        return;
                    }

                    const currentMemberId = member.data.id;
                    const response = await adminFetch('/api/admin/me', {
                        method: 'POST',
                        body: JSON.stringify({ memberstackId: currentMemberId })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        
                        if (!data.isAdmin) {
                            window.location.href = '/admin/login?error=not_admin';
                            return;
                        }

                        setIsAdminSuper(data.isSuperAdmin);
                        setCurrentAdminId(data.name || 'Admin');
                        setAdminMemberstackId(currentMemberId);
                        localStorage.setItem('admin_memberstack_id', currentMemberId);
                        setAdminName(data.name || 'Admin');
                        setAdminRoleLabel(data.isSuperAdmin ? 'Super Admin' : 'Administrador');
                        
                        sessionStorage.setItem('admin_session_active', 'true');
                        
                        loadMetrics(currentMemberId);
                        loadPendingCounts(data.isSuperAdmin, currentMemberId);
                        loadActivityLogs(currentMemberId);
                        if (data.isSuperAdmin) {
                            adminFetch('/api/admin/settings/skip-payment').then(r => r.json()).then(d => setSkipPaymentEnabled(d.enabled)).catch(() => { });
                        }
                        setIsAuthLoading(false);
                    } else {
                        window.location.href = '/admin/login';
                    }
                } catch (e) { 
                    console.error(e);
                    window.location.href = '/admin/login';
                }
            } else if (hasMounted) {
                setTimeout(() => {
                    if (!(window as any).$memberstackDom) window.location.href = '/admin/login';
                }, 2000);
            }
        };
        fetchAdminRole();
        setHasMounted(true);
    }, [hasMounted]);

    useEffect(() => {
        if (hasMounted && !isAdminSuper) {
            const restricted = ['appeals', 'admins', 'settings', 'all-members', 'cancellations'];
            if (restricted.includes(activeFilter)) setActiveFilter('member');
        }
    }, [activeFilter, isAdminSuper, hasMounted]);

    async function loadMetrics(overrideId?: string) {
        try {
            const response = await adminFetch('/api/admin/metrics');
            const data = await response.json();
            if (data.success && data.metrics) setMetrics(data.metrics);
        } catch (error) { console.error(error); }
    }

    async function loadActivityLogs(memberstackId?: string) {
        try {
            const idToUse = memberstackId || adminMemberstackId;
            if (!idToUse) return;
            const response = await adminFetch('/api/admin/activity', {
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

    async function loadPendingCounts(isSuper: boolean = false, overrideId?: string) {
        try {
            const response = await adminFetch('/api/admin/members?status=pending');
            const data = await response.json();
            if (data.success && data.members) {
                const checkIsPaid = (m: any) => m.planConnections?.some((p: any) => p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'trialing');
                setPendingCounts(prev => ({ ...prev, member: data.members.filter((m: any) => checkIsPaid(m)).length }));
            }
            if (isSuper) {
                const appealRes = await adminFetch('/api/admin/pets/appealed');
                const appealData = await appealRes.json();
                if (appealData.success) setPendingCounts(prev => ({ ...prev, appeals: appealData.count || 0 }));
            }
            const ambassadorRes = await adminFetch('/api/ambassadors?status=pending&limit=1');
            const ambassadorData = await ambassadorRes.json();
            if (ambassadorData.success) setPendingCounts(prev => ({ ...prev, ambassador: ambassadorData.total || 0 }));

            const solidarityRes = await adminFetch('/api/admin/solidarity/list?status=new');
            const solidarityData = await solidarityRes.json();
            if (solidarityData.success) setPendingCounts(prev => ({ ...prev, 'solidarity-fund': solidarityData.count || 0 }));

            const wellnessRes = await adminFetch('/api/admin/wellness?status=pending');
            const wellnessData = await wellnessRes.json();
            if (wellnessData.success) setPendingCounts(prev => ({ ...prev, 'wellness-center': wellnessData.data?.length || 0 }));
        } catch (error) { console.error(error); }
    }

    function handleNotificationClick(notification: any) {
        const userId = notification.metadata?.userId;
        if (userId) fetchMemberDetails(userId, setSelectedMember);

        const requestId = notification.metadata?.requestId;
        const ambassadorId = notification.metadata?.ambassador_id || notification.metadata?.ambassadorId;

        if (requestId) {
            setActiveFilter('solidarity-fund');
            setSelectedSolidarityRequestId(requestId);
            router.push(`/admin/dashboard?tab=solidarity-fund&requestId=${requestId}`);
        } else if (ambassadorId) {
            setActiveFilter('ambassadors' as any);
            fetchAmbassadorDetails(ambassadorId);
            router.push(`/admin/dashboard?tab=ambassadors&ambassadorId=${ambassadorId}`);
        } else if (userId) {
            router.push(`/admin/dashboard?tab=member&member=${userId}`);
        }
    }

    const renderContent = () => {
        if (activeFilter.startsWith('finance-')) {
            const type = activeFilter.replace('finance-', '') as any;
            return <FinancialLedger type={type} />;
        }

        const billingViews = ['payment-records', 'billing', 'payment-status', 'auto-retries'];
        if (billingViews.includes(activeFilter)) {
            const view = activeFilter.replace('payment-', '') as any;
            return <BillingManagement view={view === 'records' ? 'records' : view === 'status' ? 'status' : (view === 'billing' ? 'billing' : 'retries')} />;
        }

        if (activeFilter === 'billing') {
            return <BillingManagement view="billing" />;
        }

        if (activeFilter === 'reports-interactive') {
            return <InteractiveReports />;
        }

        switch (activeFilter) {
            case 'admins':
                return <AdminsTable />;
            case 'settings':
                return (
                    <SettingsPanel
                        skipPaymentEnabled={skipPaymentEnabled}
                        onToggleSkipPayment={async (enabled: boolean) => {
                            try {
                                const res = await adminFetch('/api/admin/settings/skip-payment', {
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
            case 'communications-member':
            case 'communications-ambassador':
            case 'communications-wellness':
            case 'communications':
                let audience: 'member' | 'ambassador' | 'wellness-center' | 'general' = 'member';
                
                if (activeFilter === 'communications-ambassador') audience = 'ambassador';
                else if (activeFilter === 'communications-wellness') audience = 'wellness-center';
                else if (activeFilter === 'communications') audience = 'general';
                
                return (
                    <CommunicationsHub
                        adminName={adminName}
                        isSuperAdmin={isAdminSuper}
                        prefill={commPrefill}
                        audience={audience}
                    />
                );
            case 'communications-emails':
                return <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '2px solid #000' }}>Visualizador de Plantillas de Correo</div>;
            case 'ambassador':
            case 'ambassadors' as any:
                return <AmbassadorsTable onViewDetails={(amb) => setSelectedAmbassador(amb)} refreshKey={refreshKey} />;
            case 'wellness-center':
            case 'registered-centers':
                return <WellnessCentersTable onViewDetails={(center) => setSelectedWellnessCenter(center)} refreshKey={refreshKey} />;
            case 'legal-docs':
                return <LegalDocsManager />;
            case 'cancellations':
                return <CancellationsTable />;
            default:
                return (
                    <>
                        <RequestsTable
                            filter={(subFilter as any) || 'all'}
                            isSuperAdmin={isAdminSuper}
                            requestType={activeFilter === 'all-members' ? 'all' : (activeFilter === 'terminate-users' ? 'terminate-users' : activeFilter as any)}
                            mode={activeFilter === 'terminate-users' ? 'termination' : 'default'}
                            refreshKey={refreshKey}
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
                                        const response = await adminFetch(`/api/ambassadors/${id}`, {
                                            method: 'PATCH',
                                            body: JSON.stringify({ status: 'approved' })
                                        });
                                        if (response.ok) { alert('Embajador aprobado'); triggerInPlaceRefresh(); }
                                        else alert('Error al aprobar');
                                    } catch (e) { console.error(e); }
                                } else {
                                    if (confirm('¿Estás seguro de aprobar este miembro?')) {
                                        try {
                                            const response = await adminFetch(`/api/admin/members/${id}/approve`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ adminId: currentAdminId })
                                            });
                                            if (response.ok) { alert('Miembro aprobado'); triggerInPlaceRefresh(); }
                                            else alert('Error al aprobar');
                                        } catch (error) { console.error(error); }
                                    }
                                }
                            }}
                            onReject={(id, type) => {
                                if (type === 'ambassador') {
                                    const reason = prompt('Motivo del rechazo (Embajador):');
                                    if (!reason) return;
                                    adminFetch(`/api/ambassadors/${id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
                                    }).then(res => {
                                        if (res.ok) { alert('Rechazado'); triggerInPlaceRefresh(); }
                                        else alert('Error');
                                    });
                                } else fetchMemberDetails(id, setMemberToReject);
                            }}
                            onDelete={async (id: string, type: any) => {
                                if (!confirm('¿ESTÁS SEGURO? Esta acción es permanente.')) return;
                                try {
                                    let url = `/api/admin/members/${id}/delete`;
                                    if (type === 'ambassador') url = `/api/ambassadors/${id}`;
                                    const res = await adminFetch(url, { method: 'DELETE' });
                                    if (res.ok) { alert('Eliminado correctamente'); triggerInPlaceRefresh(); }
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
            case 'solidarity-fund':
                return (
                    <SolidarityDashboard 
                        onViewDetail={(id) => setSelectedSolidarityRequestId(id)} 
                        initialFilter={subFilter}
                    />
                );
        }
    };

    if (isAuthLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: '#f8f9fa',
                fontFamily: 'var(--font-body)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #00BBB4',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <p style={{ marginTop: '1rem', color: '#666', fontWeight: 500 }}>
                    Verificando credenciales...
                </p>
            </div>
        );
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
                    activeSubStatus={subFilter}
                    onFilterChange={handleFilterChange}
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

                    {activeFilter !== 'admins' && <MetricCards metrics={metrics} activeFilter={activeFilter} />}

                    {renderContent()}
                </main>
            </div>

            <MemberDetailModal
                isOpen={!!selectedMember}
                onClose={() => { 
                    setSelectedMember(null); 
                    setSelectedPetId(null);
                    // Refresh the list when closing the modal to get updated data
                    triggerInPlaceRefresh();
                }}
                member={selectedMember}
                showAppealSection={activeFilter === 'appeals'}
                selectedPetId={selectedPetId}
                isSuperAdmin={isAdminSuper}
                onApprove={async (id, metadata) => {
                    if (confirm('¿Aprobar?')) {
                        const res = await adminFetch(`/api/admin/members/${id}/approve`, { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify({ 
                                adminId: currentAdminId,
                                ...metadata 
                            }) 
                        });
                        if (res.ok) {
                            alert('Aprobado');
                            triggerInPlaceRefresh();
                            fetchMemberDetails(id, setSelectedMember);
                        } else {
                            alert('Error al aprobar');
                        }
                    }
                }}
                onReject={() => { setMemberToReject(selectedMember); setSelectedMember(null); }}
                onDataChange={() => {
                    triggerInPlaceRefresh();
                    if (selectedMember?.id) {
                        fetchMemberDetails(selectedMember.id, setSelectedMember);
                    }
                }}
            />

            <RejectionModal
                isOpen={!!memberToReject}
                onClose={() => setMemberToReject(null)}
                memberName={`${memberToReject?.customFields?.['first-name'] || ''} ${memberToReject?.customFields?.['paternal-last-name'] || ''}`}
                onConfirm={async (reason) => {
                    const res = await adminFetch(`/api/admin/members/${memberToReject.id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: currentAdminId, reason }) });
                    if (res.ok) {
                        alert('Rechazado');
                        setMemberToReject(null);
                        triggerInPlaceRefresh();
                    } else {
                        alert('Error al rechazar');
                    }
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
                    onRefresh={() => {
                        triggerInPlaceRefresh();
                        fetchAmbassadorDetails(selectedAmbassador.id);
                    }}
                />
            )}

            {selectedSolidarityRequestId && adminMemberstackId && (
                <SolidarityRequestDetail 
                    requestId={selectedSolidarityRequestId}
                    adminMemberstackId={adminMemberstackId}
                    onClose={() => setSelectedSolidarityRequestId(null)}
                />
            )}

            {selectedWellnessCenter && (
                <WellnessCenterDetailModal
                    center={selectedWellnessCenter}
                    isOpen={!!selectedWellnessCenter}
                    onClose={() => setSelectedWellnessCenter(null)}
                    onRefresh={triggerInPlaceRefresh}
                />
            )}
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div>Cargando dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
