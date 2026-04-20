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
        }, 3000); // Aumentado a 3s para mejorar la legibilidad tras el pago

        return () => clearTimeout(timer);
    }, [onNext]);

    return (
        <div className={styles.successTransitionContainer}>
            <h2 className={styles.successTitle}>¡Todo salió perfecto!</h2>
            <p className={styles.successSubtitle}>Tu pago se realizó correctamente.</p>

            <div className={styles.brandLogoContainer}>
                <div className={styles.petCircleIcon}>
                    <img
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1773784834/logo_pata_amiga_negro_jalukg.webp"
                        alt="Pata Amiga Logo"
                    />
                </div>
            </div>

            <div className={styles.waitMessageContainer}>
                <h3 className={styles.waitTitle}>
                    ¡Estamos a un paso de cuidar a tu peludito!
                </h3>
                <p className={styles.waitDetail}>
                    Completa el siguiente formulario para registrar a tu peludo y empezar a darle el cuidado y la atención que merece. 🐶🐱💛
                </p>
            </div>
        </div>
    );
}
