'use client';

import React from 'react';
import Image from 'next/image';
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

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
    const session = useAdminSession();
    const counts = usePendingCounts(session.isSuperAdmin, !session.isLoading);

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
                    <AdminNotifications />
                </div>

                <main>{children}</main>
            </div>
        </div>
    );
}
