'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReferralCodeChanger } from '@/components/AmbassadorReferralCode';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

function LoadingState() {
    return (
        <div className={styles.pageBackground}>
            <div className={styles.whiteCard}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando...</p>
                </div>
            </div>
        </div>
    );
}

function CambiarCodigoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [ambassadorId, setAmbassadorId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Token de acceso no proporcionado');
                setIsLoading(false);
                return;
            }

            try {
                // Verificar el token y obtener el ID del embajador
                const response = await fetch(`/api/ambassadors/me?token=${token}`);
                const data = await response.json();

                if (!data.success || !data.authenticated) {
                    setError(data.error || 'Token inválido o sesión expirada');
                    setIsLoading(false);
                    return;
                }

                setAmbassadorId(data.ambassador.id);
            } catch (err) {
                console.error('Error verificando token:', err);
                setError('Error de conexión. Por favor intenta de nuevo.');
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSuccess = (oldCode: string, newCode: string) => {
        console.log(`Código cambiado: ${oldCode} → ${newCode}`);
        // El componente muestra el estado de éxito, no redirigimos automáticamente
    };

    const handleCancel = () => {
        // Redirigir al dashboard
        router.push('/embajadores/dashboard');
    };

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <div className={styles.pageBackground}>
                <div className={styles.whiteCard}>
                    <div className={styles.errorContainer}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h2 className={styles.errorTitle}>Acceso denegado</h2>
                        <p className={styles.errorMessage}>{error}</p>
                        <button 
                            onClick={() => router.push('/embajadores/login')}
                            className={styles.loginButton}
                        >
                            Iniciar sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!ambassadorId) {
        return (
            <div className={styles.pageBackground}>
                <div className={styles.whiteCard}>
                    <div className={styles.errorContainer}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h2 className={styles.errorTitle}>Error</h2>
                        <p className={styles.errorMessage}>No se pudo cargar la información del embajador.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.whiteCard}>
                <ReferralCodeChanger
                    ambassadorId={ambassadorId}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
}

export default function CambiarCodigoPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <CambiarCodigoContent />
        </Suspense>
    );
}
