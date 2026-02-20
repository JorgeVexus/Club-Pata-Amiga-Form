'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

export default function PaymentProcessingPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Verificar estado de pago cada 10 segundos
        const checkPaymentStatus = async () => {
            try {
                if (!window.$memberstackDom) return;
                
                const { data: member } = await window.$memberstackDom.getCurrentMember();
                if (!member) {
                    router.push('/user/inicio-de-sesion');
                    return;
                }

                // Verificar si ya tiene plan activo
                const response = await fetch('/api/auth/check-role', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberstackId: member.id })
                });

                const data = await response.json();
                
                if (data.role === 'member') {
                    // Ya tiene plan activo, redirigir al dashboard
                    window.location.href = 'https://www.pataamiga.mx/pets/pet-waiting-period';
                }
            } catch (error) {
                console.error('Error verificando estado:', error);
            }
        };

        // Primera verificación inmediata
        checkPaymentStatus();

        // Verificar cada 10 segundos
        const interval = setInterval(checkPaymentStatus, 10000);

        // Countdown para reintentar
        const countdownInterval = setInterval(() => {
            setCountdown(prev => prev === 1 ? 10 : prev - 1);
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(countdownInterval);
        };
    }, [router]);

    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.whiteCard}>
                <div className={styles.content}>
                    <div className={styles.icon}>⏳</div>
                    <h1 className={styles.title}>Estamos confirmando tu pago</h1>
                    <p className={styles.message}>
                        Esto puede tomar unos momentos. Por favor, no cierres esta ventana.
                    </p>
                    <div className={styles.spinner}></div>
                    <p className={styles.subMessage}>
                        Verificando estado en {countdown} segundos...
                    </p>
                    <div className={styles.helpSection}>
                        <p>¿Tienes problemas con tu pago?</p>
                        <a href="mailto:hola@pataamiga.mx" className={styles.contactLink}>
                            Contáctanos en hola@pataamiga.mx
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
