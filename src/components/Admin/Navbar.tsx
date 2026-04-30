'use client';

import React from 'react';
import Image from 'next/image';
import styles from './Navbar.module.css';
import AdminNotifications from './AdminNotifications';

interface NavbarProps {
    onMobileMenuToggle?: () => void;
    onNotificationClick?: (notification: any) => void;
}

export default function Navbar({ onMobileMenuToggle, onNotificationClick }: NavbarProps) {
    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarLogo}>
                {/* Mobile Menu Button */}
                <button
                    className={styles.mobileMenuButton}
                    onClick={onMobileMenuToggle}
                    aria-label="Toggle menu"
                >
                    ☰
                </button>

                <Image
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929d5ea79839f5517dc2edd_2ccd338fb84f816d8245097d8203902f_client-first-logo-white.png"
                    alt="Club Pata Amiga"
                    width={160}
                    height={64}
                    className={styles.logoImage}
                    priority
                />
            </div>

            <div className={styles.navbarRight}>
                {/* 🆕 Campanita de Notificaciones */}
                <AdminNotifications onNotificationClick={onNotificationClick} />

                <div className={styles.adminBadgeNav}>
                    <Image
                        src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693b20b431b6b876fa5356ee_Icon%20huella.svg"
                        alt="Admin"
                        width={24}
                        height={24}
                        className={styles.pawIcon}
                    />
                    <span className={styles.adminText}>Administrador</span>
                </div>

                {/* Botón de Cerrar Sesión movido al Navbar */}
                <button
                    className={styles.logoutButton}
                    onClick={async () => {
                        try {
                            if (typeof window !== 'undefined' && (window as any).$memberstackDom) {
                                await (window as any).$memberstackDom.logout();
                            }
                        } catch (e) {
                            console.error('Error logging out:', e);
                        }
                        window.location.href = 'https://app.pataamiga.mx/admin/login?post_logout=true';
                    }}
                    title="Cerrar sesión"
                >
                    <span className={styles.logoutIcon}>🚪</span>
                    <span className={styles.logoutText}>Cerrar sesión</span>
                </button>
            </div>
        </nav>
    );
}
