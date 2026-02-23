'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReferralCodeSelector } from '@/components/AmbassadorReferralCode';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

interface AmbassadorData {
    id: string;
    first_name: string;
    email: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    referral_code: string | null;
    referral_code_status: 'pending' | 'active' | 'inactive' | 'changed';
}

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

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className={styles.pageBackground}>
            <div className={styles.whiteCard}>
                <div className={styles.errorContainer}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2 className={styles.errorTitle}>Algo salió mal</h2>
                    <p className={styles.errorMessage}>{message}</p>
                    {onRetry && (
                        <button onClick={onRetry} className={styles.retryButton}>
                            Intentar de nuevo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function SuccessState({ code }: { code: string }) {
    const router = useRouter();
    
    return (
        <div className={styles.pageBackground}>
            <div className={styles.whiteCard}>
                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>🎉</div>
                    <h2 className={styles.successTitle}>¡Código establecido!</h2>
                    
                    <div className={styles.successCode}>
                        <span className={styles.codeLabel}>Tu código:</span>
                        <span className={styles.codeValue}>{code}</span>
                    </div>
                    
                    <p className={styles.successMessage}>
                        Tu código de embajador ha sido guardado exitosamente.
                        Ahora puedes compartirlo con tus amigos y conocidos.
                    </p>
                    
                    <div className={styles.shareSection}>
                        <p className={styles.shareLabel}>Tu enlace de referido:</p>
                        <div className={styles.shareUrl}>
                            clubpataamiga.com?ref={code}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => router.push('/embajadores/dashboard')}
                        className={styles.dashboardButton}
                    >
                        Ir a mi dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

function CodeSelectionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ambassador, setAmbassador] = useState<AmbassadorData | null>(null);
    const [successCode, setSuccessCode] = useState<string | null>(null);

    useEffect(() => {
        const fetchAmbassador = async () => {
            if (!token) {
                setError('Token de acceso no proporcionado');
                setIsLoading(false);
                return;
            }

            try {
                // Obtener datos del embajador usando el token
                const response = await fetch(`/api/ambassadors/me?token=${token}`);
                const data = await response.json();

                if (!data.success) {
                    setError(data.error || 'No se pudo cargar la información del embajador');
                    setIsLoading(false);
                    return;
                }

                const ambassadorData = data.data;

                // Verificar que esté aprobado
                if (ambassadorData.status !== 'approved') {
                    setError('Tu cuenta de embajador aún no ha sido aprobada. Te notificaremos cuando sea aprobada.');
                    setIsLoading(false);
                    return;
                }

                // Verificar que no tenga ya un código activo
                if (ambassadorData.referral_code && ambassadorData.referral_code_status === 'active') {
                    setError('Ya has establecido tu código de embajador. No puedes cambiarlo.');
                    setIsLoading(false);
                    return;
                }

                setAmbassador(ambassadorData);
            } catch (err) {
                console.error('Error fetching ambassador:', err);
                setError('Error de conexión. Por favor intenta de nuevo.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAmbassador();
    }, [token]);

    const handleSuccess = (code: string) => {
        setSuccessCode(code);
    };

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        window.location.reload();
    };

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={handleRetry} />;
    }

    if (successCode) {
        return <SuccessState code={successCode} />;
    }

    if (!ambassador) {
        return <ErrorState message="No se encontró información del embajador" />;
    }

    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.whiteCard}>
                <ReferralCodeSelector
                    ambassadorId={ambassador.id}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}

export default function SeleccionarCodigoPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <CodeSelectionContent />
        </Suspense>
    );
}
