'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './Sidebar.module.css';
import type { RequestType } from '@/types/admin.types';

interface SidebarProps {
    activeFilter: RequestType | 'all' | 'admins' | 'legal-docs' | 'settings' | 'all-members' | 'cancellations' | 'newsletter' | 'wellness-leads' | 'campaign-leads' | 'emergency-report' | 'pet-unsubscriptions';
    activeSubStatus?: string | null;
    onFilterChange: (filter: any) => void;
    pendingCounts: Record<string, number>;
    isMobileOpen?: boolean;
    onClose?: () => void;
    isSuperAdmin?: boolean;
    adminName?: string;
    adminRole?: string;
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

export default function Sidebar({ 
    activeFilter, 
    activeSubStatus,
    onFilterChange, 
    pendingCounts, 
    isMobileOpen, 
    onClose, 
    isSuperAdmin = false,
    adminName = 'Admin',
    adminRole = 'Administrador',
}: SidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'gestion': true,
        'fondo': true,
        'pagos-facturacion': false,
        'gestion-pagos': false,
        'comunicaciones': false,
        'centros-reg': false
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
                { id: 'pet-unsubscriptions', label: 'Bajas de peludos', icon: '🐾', badge: pendingCounts['pet-unsubscriptions'] },
                { id: 'ambassador', label: 'Embajadores', icon: '🎯', badge: pendingCounts.ambassador },
                { id: 'wellness-center', label: 'Centros de bienestar', icon: '🏥', badge: pendingCounts['wellness-center'] },
                { id: 'terminate-users', label: 'Baja de Usuarios', icon: '🚫' },
                ...(isSuperAdmin ? [{ id: 'cancellations', label: 'Membresias canceladas', icon: '📋' }] : []),
            ]
        },
        {
            id: 'fondo',
            title: 'Apoyo Económico',
            icon: '💰',
            items: [
                { id: 'solidarity-fund', label: 'Nuevas solicitudes', icon: '📩', subStatus: 'new', badge: pendingCounts['solidarity-fund'] },
                { id: 'solidarity-fund', label: 'Aprobadas', icon: '✅', subStatus: 'approved' },
                { id: 'solidarity-fund', label: 'Rechazadas', icon: '❌', subStatus: 'rejected' },
                { id: 'solidarity-fund', label: 'En proceso', icon: '⏳', subStatus: 'in_process' },
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
                { id: 'registered-centers', label: 'Ver Directorio', icon: '✅' },
            ]
        },
        {
            id: 'webflow-leads',
            title: 'Leads Webflow',
            icon: '🌐',
            items: [
                { id: 'newsletter', label: 'Newsletter', icon: '📧' },
                { id: 'wellness-leads', label: 'Centros Bienestar', icon: '🏥' },
                { id: 'campaign-leads', label: 'Campaña Regalos', icon: '🎁' },
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
                { id: 'communications-emails', label: 'Plantillas de Correo', icon: '📧' },
            ]
        },
        {
            id: 'reporteo',
            title: 'Reporteo',
            icon: '📈',
            items: [
                { id: 'reports-interactive', label: 'Gráficas interactivas', icon: '📊' },
                { id: 'emergency-report', label: 'Botón Emergencia', icon: '🚨' },
            ]
        }
    ];

    return (
        <aside className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}>
            <div className={styles.brand}>
                <Image
                    src="/widgets/home%20v2%20images/logo-on-dark.svg"
                    alt="Pata Amiga"
                    width={113}
                    height={40}
                    priority
                />
                <span>Panel del comité</span>
            </div>
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
                                        className={`${styles.menuItem} ${
                                            activeFilter === item.id && (!item.subStatus || activeSubStatus === item.subStatus) 
                                            ? styles.active 
                                            : ''
                                        }`}
                                        onClick={() => {
                                            if (item.subStatus) {
                                                onFilterChange({ id: item.id, subStatus: item.subStatus });
                                            } else {
                                                onFilterChange(item.id);
                                            }
                                        }}
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
                            className={`${styles.menuItem} ${activeFilter === 'all-members' ? styles.active : ''}`}
                            onClick={() => onFilterChange('all-members')}
                        >
                            <span className={styles.menuIcon}>🧪</span>
                            <span className={styles.menuLabel}>Pruebas / Todos</span>
                        </button>
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

            <div className={styles.adminFooter}>
                <span className={styles.adminInitial}>{adminName.charAt(0).toUpperCase()}</span>
                <span>
                    <strong>{adminName}</strong>
                    <small>{adminRole}</small>
                </span>
            </div>

        </aside>
    );
}
