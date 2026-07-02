'use client';

import React from 'react';
import styles from './RegistrationPromoMarquee.module.css';

const PROMO_TEXT = '⚽ ¡Últimos días para entrar a la Manada Mundialista! Regístrate antes del 5 de julio, llévate 1 mes gratis con el cupón VAMOSMEXICO y si México gana la copa, ¡tu membresía es gratis por un año! 🐾';

export default function RegistrationPromoMarquee() {
    return (
        <div className={styles.container} role="region" aria-label="Promoción de registro">
            <div className={styles.content}>
                <div className={styles.text}>{PROMO_TEXT}</div>
                <div className={styles.text} aria-hidden="true">{PROMO_TEXT}</div>
            </div>
        </div>
    );
}
