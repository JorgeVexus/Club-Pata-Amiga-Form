'use client';

import React from 'react';
import Image from 'next/image';
import styles from './Navbar.module.css';

interface NavbarProps {
    onMobileMenuToggle?: () => void;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
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
            </div>
        </nav>
    );
}
