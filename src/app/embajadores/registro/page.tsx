'use client';

import { useState, useEffect } from 'react';
import AmbassadorForm from '@/components/AmbassadorForm/AmbassadorForm';
import styles from './page.module.css';

interface MemberstackMember {
    id: string;
    auth?: {
        email?: string;
    };
    customFields?: Record<string, string>;
}

export default function AmbassadorRegistrationPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [memberData, setMemberData] = useState<MemberstackMember | null>(null);

    useEffect(() => {
        const checkMemberStatus = async () => {
            setIsLoading(true);

            // Esperar a que Memberstack esté disponible
            if (typeof window !== 'undefined' && window.$memberstackDom) {
                try {
                    const result = await window.$memberstackDom.getCurrentMember();
                    if (result?.data) {
                        setMemberData(result.data);
                        setIsLoggedIn(true);
                        console.log('✅ Usuario logueado detectado:', result.data.auth?.email);
                    }
                } catch (error) {
                    console.log('ℹ️ Usuario no logueado');
                }
            }

            setIsLoading(false);
        };

        // Pequeño delay para asegurar que Memberstack esté listo
        const timer = setTimeout(checkMemberStatus, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleGoogleSignup = async () => {
        if (window.$memberstackDom) {
            try {
                await window.$memberstackDom.signupWithProvider({ provider: 'google' });
                // Después del signup, recargar para verificar estado
                window.location.reload();
            } catch (error) {
                console.error('Error en signup con Google:', error);
            }
        }
    };

    // Estado de carga
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingCard}>
                    <div className={styles.spinner}></div>
                    <p>Verificando tu cuenta...</p>
                </div>
            </div>
        );
    }

    // Usuario logueado → Mostrar formulario de embajador (pasos 2 y 3)
    if (isLoggedIn && memberData) {
        return <AmbassadorForm linkedMemberstackId={memberData.id} />;
    }

    // Usuario NO logueado → Mostrar pantalla de autenticación
    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                {/* Header */}
                <div className={styles.header}>
                    <img
                        src="/images/logo-pata-amiga.png"
                        alt="Pata Amiga"
                        className={styles.logo}
                    />
                    <h1 className={styles.title}>Sé Embajador Pata Amiga</h1>
                    <p className={styles.subtitle}>
                        Únete a nuestra manada y gana comisiones por cada familia que ayudes a proteger a sus peludos.
                    </p>
                </div>

                {/* Beneficios */}
                <div className={styles.benefits}>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>💰</span>
                        <span>Gana 10% de comisión por cada referido</span>
                    </div>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>🔗</span>
                        <span>Tu código único para compartir</span>
                    </div>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>📊</span>
                        <span>Dashboard para ver tus ganancias</span>
                    </div>
                </div>

                {/* Opciones de registro */}
                <div className={styles.authOptions}>
                    <p className={styles.authLabel}>Para comenzar, crea tu cuenta o inicia sesión:</p>

                    {/* Botón Google */}
                    <button
                        className={styles.googleButton}
                        onClick={handleGoogleSignup}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </button>

                    <div className={styles.divider}>
                        <span>o</span>
                    </div>

                    {/* Botón Email */}
                    <a
                        href="#"
                        className={styles.emailButton}
                        data-ms-modal="signup"
                    >
                        ✉️ Registrarme con Email
                    </a>

                    {/* Ya tengo cuenta */}
                    <p className={styles.loginLink}>
                        ¿Ya tienes cuenta?{' '}
                        <a href="#" data-ms-modal="login">Inicia sesión</a>
                    </p>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <p>Al registrarte, aceptas nuestros <a href="/terminos">Términos y Condiciones</a></p>
                </div>
            </div>
        </div>
    );
}
