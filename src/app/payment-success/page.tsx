'use client';

import { useEffect } from 'react';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccessRedirect() {
    useEffect(() => {
        // Redirigir de vuelta al flujo de registro con el parÃ¡metro de Ã©xito
        const timer = setTimeout(() => {
            window.location.href = '/registro?payment=success';
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={styles.containerCenter}>
            <div className={styles.pageBackground} />
            
            <div className={styles.formCard}>
                <span className={styles.icon}>🎉</span>
                <h1 className={styles.title}>¡Pago Exitoso!</h1>
                <p className={styles.subtitle}>
                    Estamos procesando tu suscripción. En unos segundos volverás para completar tu perfil.
                </p>
                
                <div className={styles.loader} />
            </div>
        </div>
    );
}
