'use client';

import React, { useEffect } from 'react';
import styles from './steps.module.css';

interface Step3_5PaymentSuccessProps {
    onNext: () => void;
}

export default function Step3_5PaymentSuccess({ onNext }: Step3_5PaymentSuccessProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onNext();
        }, 2500); // 2.5 segundos para que se alcance a leer bien

        return () => clearTimeout(timer);
    }, [onNext]);

    return (
        <div className={styles.successTransitionContainer}>
            <h2 className={styles.successTitle}>¡Todo bien!</h2>
            <p className={styles.successSubtitle}>¡Yeah, tu pago se realizó correctamente!</p>

            <div className={styles.brandLogoContainer}>
                <div className={styles.petCircleIcon}>
                    <img
                        src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6930687c8f64d3b129a9cece_PATA_AMIGA_LOGOTIPO_EDITABLE-02.webp"
                        alt="Pata Amiga Logo"
                    />
                </div>
            </div>

            <div className={styles.waitMessageContainer}>
                <h3 className={styles.waitTitle}>
                    <span>⚠️</span> ¡Espera! Tu mascota aún no está protegida
                </h3>
                <p className={styles.waitDetail}>
                    Ayúdanos a completar la información del siguiente formulario para terminar de proteger a tu peludito.
                </p>
            </div>
        </div>
    );
}
