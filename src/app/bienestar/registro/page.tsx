'use client';

import React from 'react';
import WellnessForm from '@/components/WellnessForm/WellnessForm';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

export default function WellnessRegistrationPage() {
    return (
        <div className={styles.pageBackground}>
            <header className={styles.registrationNav}>
                <BrandLogo />
                <a className={styles.loginLink} href="https://www.pataamiga.mx/user/inicio-de-sesion">
                    Ya tengo una cuenta
                </a>
            </header>
            <main className={styles.container}>
                <section className={styles.heroCopy} aria-labelledby="wellness-registration-title">
                    <span className={styles.eyebrow}>Red Pata Amiga</span>
                    <h1 id="wellness-registration-title" className={styles.title}>Únete como Centro de Bienestar</h1>
                    <p className={styles.subtitle}>
                        Registra tu establecimiento y comienza a recibir beneficios de la red Pata Amiga.
                    </p>
                </section>
                <section className={styles.formCard} aria-label="Registro de Centro de Bienestar">
                    <WellnessForm />
                </section>
            </main>
            <footer className={styles.footer}>
                <p>© 2026 Club Pata Amiga · Programa de aliados</p>
            </footer>
        </div>
    );
}
