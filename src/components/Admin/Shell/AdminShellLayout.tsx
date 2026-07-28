'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminSession } from './useAdminSession';
import { usePendingCounts } from './usePendingCounts';
import { AdminNav, AdminNavMobile } from './AdminNav';
import AdminLoadingShell from '../V2/AdminLoadingShell';
import AdminNotifications from '../AdminNotifications';
import styles from './AdminShellLayout.module.css';

async function handleLogout() {
    try {
        if (typeof window !== 'undefined' && (window as any).$memberstackDom) {
            await (window as any).$memberstackDom.logout();
        }
        localStorage.removeItem('admin_memberstack_id');
    } catch (e) {
        console.error('Error logging out:', e);
    }
    window.location.href = '/admin/login?post_logout=true';
}

/**
 * Traduce las notificaciones (que llevan el mismo metadata que ya
 * generaba el backend: userId, requestId, ambassador_id, wellnessCenterId,
 * petUnsubscriptionId) a las rutas nuevas del panel, sin tocar cómo se
 * crean las notificaciones en el servidor.
 */
function buildNotificationHref(notification: any): string | null {
    const metadata = notification.metadata || {};
    const data = notification.data || {};

    const requestId = metadata.requestId;
    const ambassadorId = metadata.ambassador_id || metadata.ambassadorId;
    const wellnessCenterId =
        metadata.wellnessCenterId || metadata.wellness_center_id ||
        data.wellnessCenterId || data.wellness_center_id;
    const userId = metadata.userId;

    if (requestId) return `/admin/reintegros?requestId=${requestId}`;
    if (metadata.action === 'open_pet_unsubscriptions' || metadata.petUnsubscriptionId) {
        return '/admin/mascotas?filter=bajas';
    }
    if (ambassadorId) return `/admin/embajadores?ambassadorId=${ambassadorId}`;
    if (wellnessCenterId) return `/admin/centros?wellnessCenterId=${wellnessCenterId}`;
    if (userId) return `/admin/miembros?member=${userId}`;

    return null;
}

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
    const session = useAdminSession();
    const counts = usePendingCounts(session.isSuperAdmin, !session.isLoading);
    const router = useRouter();

    if (session.isLoading) {
        return <AdminLoadingShell />;
    }

    return (
        <div className={styles.grid}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <Image
                        src="/widgets/home%20v2%20images/logo-on-dark.svg"
                        alt="Pata Amiga"
                        width={113}
                        height={40}
                        priority
                    />
                    <span className={styles.brandLabel}>Panel del comité</span>
                </div>

                <AdminNav counts={counts} isSuperAdmin={session.isSuperAdmin} />

                <div className={styles.spacer} />

                <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                    🚪 Cerrar sesión
                </button>

                <div className={styles.profile}>
                    <span className={styles.profileInitial}>
                        {session.adminName.charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.profileText}>
                        <span className={styles.profileName}>{session.adminName}</span>
                        <span className={styles.profileRole}>{session.adminRoleLabel}</span>
                    </span>
                </div>
            </aside>

            <div className={styles.main}>
                <header className={styles.mobileHeader}>
                    <div className={styles.mobileTopRow}>
                        <span className={styles.mobileBrand}>🐾 Panel del comité</span>
                        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                            🚪
                        </button>
                    </div>
                    <AdminNavMobile counts={counts} isSuperAdmin={session.isSuperAdmin} />
                </header>

                <div className={styles.topbar}>
                    <AdminNotifications
                        onNotificationClick={(notification) => {
                            const href = buildNotificationHref(notification);
                            if (href) router.push(href);
                            else if (notification.link) router.push(notification.link);
                        }}
                    />
                </div>

                <main>{children}</main>
            </div>
        </div>
    );
}
