import React, { useEffect } from 'react';
import styles from './Step3_5PaymentSuccess.module.css';

interface Step3_5PaymentSuccessProps {
    onNext: () => void;
}

export default function Step3_5PaymentSuccess({ onNext }: Step3_5PaymentSuccessProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onNext();
        }, 5000); // 5 segundos para que disfruten el éxito

        return () => clearTimeout(timer);
    }, [onNext]);

    return (
        <div className={styles.containerCenter}>
            <div className={styles.pageBackground} />
            
            <div className={styles.formCard}>
                <div className={styles.successIconContainer}>
                    <img
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1773784834/logo_pata_amiga_negro_jalukg.webp"
                        alt="Pata Amiga Logo"
                    />
                </div>

                <h2 className={styles.title}>¡Todo salió perfecto!</h2>
                <p className={styles.subtitle}>
                    Tu suscripción se ha activado correctamente. ¡Estamos muy felices de tenerte en la manada!
                </p>

                <div className={styles.loaderWrapper}>
                    <div className={styles.spinner} />
                    <p className={styles.waitMessage}>
                        Estamos preparando tu perfil de socio...
                    </p>
                </div>
            </div>
        </div>
    );
}
