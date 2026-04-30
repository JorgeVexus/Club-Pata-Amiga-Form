'use client';

import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import type { RequestType } from '@/types/admin.types';

interface SidebarProps {
    activeFilter: RequestType | 'all' | 'admins' | 'legal-docs' | 'settings' | 'all-members';
    onFilterChange: (filter: any) => void;
    pendingCounts: Record<string, number>;
    isMobileOpen?: boolean;
    onClose?: () => void;
    isSuperAdmin?: boolean;
}

interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    badge?: number;
    subStatus?: string;
}

interface MenuSection {
    id: string;
    title: string;
    icon: string;
    items: MenuItem[];
    isCollapsible?: boolean;
}

export default function Sidebar({ activeFilter, onFilterChange, pendingCounts, isMobileOpen, onClose, isSuperAdmin = false }: SidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'gestion': true,
        'fondo': true,
        'pagos-facturacion': false,
        'gestion-pagos': false,
        'comunicaciones': false,
    });

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const sections: MenuSection[] = [
        {
            id: 'gestion',
            title: 'Gestión General',
            icon: '🏢',
            items: [
                { id: 'all', label: 'Dashboard Global', icon: '📊' },
                { id: 'member', label: 'Miembros', icon: '👥', badge: pendingCounts.member },
                { id: 'ambassador', label: 'Embajadores', icon: '🎯', badge: pendingCounts.ambassador },
                { id: 'wellness-center', label: 'Centros de bienestar', icon: '🏥', badge: pendingCounts['wellness-center'] },
                { id: 'terminate-users', label: 'Baja de Usuarios', icon: '🚫' },
            ]
        },
        {
            id: 'fondo',
            title: 'Fondo Solidario',
            icon: '💰',
            items: [
                { id: 'solidarity-fund', label: 'Nuevas solicitudes', icon: '📩', subStatus: 'pending' },
                { id: 'solidarity-fund', label: 'Aprobadas', icon: '✅', subStatus: 'approved' },
                { id: 'solidarity-fund', label: 'Rechazadas', icon: '❌', subStatus: 'rejected' },
                { id: 'solidarity-fund', label: 'En proceso', icon: '⏳', subStatus: 'in-review' },
            ]
        },
        {
            id: 'pagos-facturacion',
            title: 'Pagos y Facturación',
            icon: '💳',
            items: [
                { id: 'payment-records', label: 'Registros de pagos', icon: '📝' },
                { id: 'billing', label: 'Facturación', icon: '🧾' },
                { id: 'payment-status', label: 'Estado de pago', icon: '🚦' },
                { id: 'auto-retries', label: 'Cobros automáticos', icon: '🔄' },
            ]
        },
        {
            id: 'gestion-pagos',
            title: 'Gestión de Pagos',
            icon: '🏦',
            items: [
                { id: 'finance-memberships', label: 'Ingresos (Membresías)', icon: '📈' },
                { id: 'finance-refunds', label: 'Reembolsos (Apoyos)', icon: '📉' },
                { id: 'finance-wellness', label: 'Pagos a Centros', icon: '🏥' },
                { id: 'finance-commissions', label: 'Comisiones', icon: '🤝' },
            ]
        },
        {
            id: 'centros-reg',
            title: 'Centros Registrados',
            icon: '📜',
            items: [
                { id: 'registered-centers', label: 'Fase 2 (Próximamente)', icon: '🔒' },
            ]
        },
        {
            id: 'comunicaciones',
            title: 'Comunicaciones',
            icon: '📡',
            items: [
                { id: 'communications-member', label: 'Miembros', icon: '👥' },
                { id: 'communications-wellness', label: 'Centros de Bienestar', icon: '🏥' },
                { id: 'communications-ambassador', label: 'Embajadores', icon: '🎯' },
            ]
        },
        {
            id: 'reporteo',
            title: 'Reporteo',
            icon: '📈',
            items: [
                { id: 'reports-interactive', label: 'Gráficas interactivas', icon: '📊' },
            ]
        }
    ];

    return (
        <aside className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}>
            {/* Close Button (Mobile Only) */}
            <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Cerrar menú"
            >
                ✕
            </button>

            <div className={styles.sidebarContent}>
                {sections.map((section) => (
                    <nav key={section.id} className={styles.menuSection}>
                        <div 
                            className={styles.sectionHeader}
                            onClick={() => toggleSection(section.id)}
                        >
                            <span className={styles.sectionIcon}>{section.icon}</span>
                            <h3 className={styles.menuTitle}>{section.title}</h3>
                            <span className={`${styles.chevron} ${expandedSections[section.id] ? styles.chevronOpen : ''}`}>
                                ⌄
                            </span>
                        </div>

                        {expandedSections[section.id] && (
                            <div className={styles.sectionItems}>
                                {section.items.map((item, idx) => (
                                    <button
                                        key={`${item.id}-${idx}`}
                                        className={`${styles.menuItem} ${activeFilter === item.id ? styles.active : ''}`}
                                        onClick={() => onFilterChange(item.id)}
                                    >
                                        {item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
                                        <span className={styles.menuLabel}>{item.label}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className={styles.menuBadge}>{item.badge}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </nav>
                ))}

                {/* Legal & Config (Fixed bottom or separate) */}
                <div className={styles.separator} />
                
                <nav className={styles.menuSection}>
                    <button
                        className={`${styles.menuItem} ${activeFilter === 'legal-docs' ? styles.active : ''}`}
                        onClick={() => onFilterChange('legal-docs')}
                    >
                        <span className={styles.menuIcon}>📄</span>
                        <span className={styles.menuLabel}>Documentos Legales</span>
                    </button>
                </nav>

                {isSuperAdmin && (
                    <nav className={styles.menuSection}>
                        <h3 className={styles.menuTitle}>Ajustes Master</h3>
                        <button
                            className={`${styles.menuItem} ${activeFilter === 'admins' ? styles.active : ''}`}
                            onClick={() => onFilterChange('admins')}
                        >
                            <span className={styles.menuIcon}>👨‍💼</span>
                            <span className={styles.menuLabel}>Administradores</span>
                        </button>
                        <button
                            className={`${styles.menuItem} ${activeFilter === 'settings' ? styles.active : ''}`}
                            onClick={() => onFilterChange('settings')}
                        >
                            <span className={styles.menuIcon}>⚙️</span>
                            <span className={styles.menuLabel}>Configuración</span>
                        </button>
                    </nav>
                )}
            </div>

        </aside>
    );
}
