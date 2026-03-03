'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Confirmacion() {
    const router = useRouter();
    const [petData, setPetData] = useState<any>(null);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Verificar que completó el registro
        const completed = localStorage.getItem('registration_completed');
        if (!completed) {
            router.replace('/registro/paso-1-cuenta');
            return;
        }

        const step2Data = localStorage.getItem('registration_step2');
        if (step2Data) {
            setPetData(JSON.parse(step2Data));
        }

        // Contador para redirección
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Redirigir al dashboard
                    // router.push('/user/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    const handleGoToDashboard = () => {
        // router.push('/user/dashboard');
        window.location.href = '/';
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.iconWrapper}>
                        <span className={styles.successIcon}>🎉</span>
                        <div className={styles.confetti}>🎊</div>
                        <div className={styles.confetti2}>✨</div>
                    </div>

                    <h1 className={styles.title}>
                        ¡Bienvenido a la manada!
                    </h1>

                    <p className={styles.message}>
                        {petData ? (
                            <>
                                <strong>{petData.petName}</strong> ya está protegido con nosotros.
                            </>
                        ) : (
                            'Tu mascota ya está protegida con nosotros.'
                        )}
                    </p>

                    <div className={styles.benefitsBox}>
                        <h3 className={styles.benefitsTitle}>¿Qué sigue?</h3>
                        <ul className={styles.benefitsList}>
                            <li>
                                <span className={styles.check}>✓</span>
                                <span>Recibirás un email de confirmación con tus datos de acceso</span>
                            </li>
                            <li>
                                <span className={styles.check}>✓</span>
                                <span>
                                    Tienes <strong>15 días</strong> para subir fotos de tu mascota
                                </span>
                            </li>
                            <li>
                                <span className={styles.check}>✓</span>
                                <span>El período de carencia comienza hoy</span>
                            </li>
                            <li>
                                <span className={styles.check}>✓</span>
                                <span>Puedes acceder a tu cuenta en cualquier momento</span>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.nextSteps}>
                        <div className={styles.step}>
                            <span className={styles.stepNumber}>1</span>
                            <span>Revisa tu email</span>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepNumber}>2</span>
                            <span>Completa las fotos de tu mascota</span>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepNumber}>3</span>
                            <span>Descarga tu póliza</span>
                        </div>
                    </div>

                    <button 
                        className={styles.dashboardButton}
                        onClick={handleGoToDashboard}
                    >
                        Ir a mi cuenta
                        <span>→</span>
                    </button>

                    <p className={styles.countdown}>
                        Redirigiendo automáticamente en {countdown} segundos...
                    </p>
                </div>

                <div className={styles.supportBox}>
                    <span>¿Necesitas ayuda?</span>
                    <a href="mailto:soporte@petmembership.com">soporte@petmembership.com</a>
                    <span>o</span>
                    <a href="tel:5555555555">55 5555 5555</a>
                </div>
            </div>
        </div>
    );
}
