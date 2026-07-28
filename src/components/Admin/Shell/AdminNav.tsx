'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminNav.module.css';
import { NAV_ITEMS, MARKETING_ITEMS, SETTINGS_ITEMS, NavItem } from './navConfig';
import type { PendingCounts } from './usePendingCounts';

interface AdminNavProps {
    counts: PendingCounts;
    isSuperAdmin: boolean;
}

function isActive(pathname: string, href: string) {
    return href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href);
}

function renderBadge(item: NavItem, counts: PendingCounts) {
    const value = item.badgeKey ? counts[item.badgeKey] : 0;
    if (!value) return null;
    return <span className={styles.badge}>{value}</span>;
}

export function AdminNav({ counts, isSuperAdmin }: AdminNavProps) {
    const pathname = usePathname();
    const inMarketing = MARKETING_ITEMS.some((m) => pathname.startsWith(m.href));
    const [marketingOpen, setMarketingOpen] = useState(inMarketing);

    const items = NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin);
    const settingsItems = SETTINGS_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin);

    return (
        <>
            {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.item} ${active ? styles.itemActive : ''}`}
                    >
                        <span className={styles.itemLabel}>
                            <span aria-hidden>{item.icon}</span>
                            {item.label}
                        </span>
                        {renderBadge(item, counts)}
                    </Link>
                );
            })}

            <button
                type="button"
                onClick={() => setMarketingOpen((v) => !v)}
                aria-expanded={marketingOpen}
                className={`${styles.groupToggle} ${inMarketing ? styles.groupToggleActive : ''}`}
            >
                <span className={styles.itemLabel}>
                    <span aria-hidden>📣</span>
                    Marketing
                </span>
                <span className={styles.chevron} aria-hidden>{marketingOpen ? '▾' : '▸'}</span>
            </button>
            {marketingOpen &&
                MARKETING_ITEMS.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.subItem} ${active ? styles.subItemActive : ''}`}
                        >
                            <span aria-hidden>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}

            {settingsItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.item} ${active ? styles.itemActive : ''}`}
                    >
                        <span className={styles.itemLabel}>
                            <span aria-hidden>{item.icon}</span>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </>
    );
}

export function AdminNavMobile({ counts, isSuperAdmin }: AdminNavProps) {
    const pathname = usePathname();
    const items = [
        ...NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin),
        ...MARKETING_ITEMS,
        ...SETTINGS_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin),
    ];

    return (
        <nav className={styles.mobileNav}>
            {items.map((item) => {
                const active = isActive(pathname, item.href);
                const value = item.badgeKey ? counts[item.badgeKey] : 0;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.mobileChip} ${active ? styles.mobileChipActive : ''}`}
                    >
                        <span aria-hidden>{item.icon}</span>
                        {item.label}
                        {!!value && <span className={styles.mobileBadge}>{value}</span>}
                    </Link>
                );
            })}
        </nav>
    );
}
