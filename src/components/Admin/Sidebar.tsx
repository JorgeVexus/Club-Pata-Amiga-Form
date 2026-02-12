'use client';

import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import type { RequestType } from '@/types/admin.types';

interface SidebarProps {
    activeFilter: RequestType | 'all' | 'admins' | 'legal-docs';
    onFilterChange: (filter: RequestType | 'all' | 'admins' | 'legal-docs') => void;
    pendingCounts: Record<RequestType, number>;
    isMobileOpen?: boolean;
    onClose?: () => void;
    isSuperAdmin?: boolean;
}

export default function Sidebar({ activeFilter, onFilterChange, pendingCounts, isMobileOpen, onClose, isSuperAdmin = false }: SidebarProps) {
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

            {/* Menú Principal */}
            <nav className={styles.menuSection}>
                <h3 className={styles.menuTitle}>Gestión General</h3>

                <button
                    className={`${styles.menuItem} ${activeFilter === 'all' ? styles.active : ''}`}
                    onClick={() => onFilterChange('all')}
                >
                    <span className={styles.menuIcon}>📊</span>
                    <span className={styles.menuLabel}>Gestión general</span>
                </button>

                <button
                    className={`${styles.menuItem} ${activeFilter === 'member' ? styles.active : ''}`}
                    onClick={() => onFilterChange('member')}
                >
                    <span className={styles.menuIcon}>👥</span>
                    <span className={styles.menuLabel}>Miembros</span>
                    {pendingCounts.member > 0 && (
                        <span className={styles.menuBadge}>{pendingCounts.member}</span>
                    )}
                </button>

                <button
                    className={`${styles.menuItem} ${activeFilter === 'ambassador' ? styles.active : ''}`}
                    onClick={() => onFilterChange('ambassador')}
                >
                    <span className={styles.menuIcon}>🎯</span>
                    <span className={styles.menuLabel}>Embajadores</span>
                    {pendingCounts.ambassador > 0 && (
                        <span className={styles.menuBadge}>{pendingCounts.ambassador}</span>
                    )}
                </button>

                <button
                    className={`${styles.menuItem} ${activeFilter === 'wellness-center' ? styles.active : ''}`}
                    onClick={() => onFilterChange('wellness-center')}
                >
                    <span className={styles.menuIcon}>🏥</span>
                    <span className={styles.menuLabel}>Centro de Bienestar</span>
                    {pendingCounts['wellness-center'] > 0 && (
                        <span className={styles.menuBadge}>{pendingCounts['wellness-center']}</span>
                    )}
                </button>

                <button
                    className={`${styles.menuItem} ${activeFilter === 'solidarity-fund' ? styles.active : ''}`}
                    onClick={() => onFilterChange('solidarity-fund')}
                >
                    <span className={styles.menuIcon}>💰</span>
                    <span className={styles.menuLabel}>Fondo solidario</span>
                    {pendingCounts['solidarity-fund'] > 0 && (
                        <span className={styles.menuBadge}>{pendingCounts['solidarity-fund']}</span>
                    )}
                </button>

                <button
                    className={`${styles.menuItem} ${activeFilter === 'communications' ? styles.active : ''}`}
                    onClick={() => onFilterChange('communications')}
                >
                    <span className={styles.menuIcon}>📡</span>
                    <span className={styles.menuLabel}>Comunicaciones</span>
                </button>

                {isSuperAdmin && (
                    <button
                        className={`${styles.menuItem} ${activeFilter === 'appeals' ? styles.active : ''}`}
                        onClick={() => onFilterChange('appeals')}
                    >
                        <span className={styles.menuIcon}>📩</span>
                        <span className={styles.menuLabel}>Apelaciones</span>
                        {pendingCounts.appeals > 0 && (
                            <span className={styles.menuBadge}>{pendingCounts.appeals}</span>
                        )}
                    </button>
                )}
            </nav>

            {/* Super Admin Only: Admins Section */}
            {isSuperAdmin && (
                <nav className={styles.menuSection}>
                    <h3 className={styles.menuTitle}>Administración</h3>
                    <button
                        className={`${styles.menuItem} ${activeFilter === 'admins' ? styles.active : ''}`}
                        onClick={() => onFilterChange('admins')}
                    >
                        <span className={styles.menuIcon}>👨‍💼</span>
                        <span className={styles.menuLabel}>Administradores</span>
                    </button>
                    <button
                        className={`${styles.menuItem} ${activeFilter === 'legal-docs' ? styles.active : ''}`}
                        onClick={() => onFilterChange('legal-docs')}
                    >
                        <span className={styles.menuIcon}>📄</span>
                        <span className={styles.menuLabel}>Documentos Legales</span>
                    </button>
                </nav>
            )}

            {/* Historial de Actividad */}
            <nav className={styles.menuSection}>
                <h3 className={styles.menuTitle}>Historial de Actividad</h3>

                <button className={styles.menuItem}>
                    <span className={styles.menuIcon}>📋</span>
                    <span className={styles.menuLabel}>Historial de actividad</span>
                </button>
            </nav>

            {/* Botón de Cerrar Sesión */}
            {/* Botón de Cerrar Sesión */}
            <button
                className={styles.logoutButton}
                data-ms-action="logout"
                onClick={() => {
                    // Optional: Force redirect fallback if Memberstack doesn't redirect automatically
                    setTimeout(() => {
                        window.location.href = '/admin/login?post_logout=true';
                    }, 500);
                }}
            >
                <span>🚪</span>
                <span>Cerrar sesión</span>
            </button>
        </aside>
    );
}
