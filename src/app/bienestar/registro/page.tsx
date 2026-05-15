'use client';

import React from 'react';
import WellnessForm from '@/components/WellnessForm/WellnessForm';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

export default function WellnessRegistrationPage() {
    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Únete como Centro de Bienestar</h1>
                    <p className={styles.subtitle}>
                        Registra tu establecimiento y comienza a recibir beneficios de la red Pata Amiga.
                    </p>
                </div>
                
                <div className={styles.formCard}>
                    <WellnessForm />
                </div>
                
                <div className={styles.footer}>
                    <p>© 2026 Club Pata Amiga - Programa de Aliados</p>
                </div>
            </div>
        </div>
    );
}
