'use client';

import React from 'react';
import styles from './NavbarRedesign.module.css';

interface NavbarRedesignProps {
    onLogout: () => void;
    member: any;
}

export default function NavbarRedesign({ onLogout, member }: NavbarRedesignProps) {
    return (
        <nav className={styles.navbar}>
            <div className={styles.content}>
                <a href="https://www.pataamiga.mx" className={styles.logoWrapper}>
                    <img 
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695849/logo_pata_amiga_cbgtjz.png" 
                        alt="Pata Amiga" 
                        className={styles.logo} 
                    />
                </a>
                
                <div className={styles.actions}>
                    <button 
                        className={styles.logoutButton}
                        onClick={onLogout}
                    >
                        <span className={styles.logoutText}>Cerrar sesión</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
