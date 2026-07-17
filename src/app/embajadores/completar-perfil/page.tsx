'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/UI/BrandLogo';
import Step5CompleteProfile from '@/components/AmbassadorForm/Step5CompleteProfile';
import styles from './page.module.css';

function LoadingState() {
    return (
        <div className={styles.pageBackground}>
            <div className={styles.loadingCard}>
                <div className={styles.spinner}></div>
                <p>Cargando tu información...</p>
            </div>
        </div>
    );
}

function CompleteProfileContent() {
    const searchParams = useSearchParams();
    const ambassadorIdParam = searchParams.get('ambassadorId');
    const memberIdParam = searchParams.get('memberId');

    const [ambassador, setAmbassador] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAmbassador = async () => {
            try {
                const memberstackWindow = window as Window & {
                    $memberstackDom?: { getMemberCookie?: () => string | Promise<string> };
                };
                const memberstack = memberstackWindow.$memberstackDom;
                const token = await Promise.resolve(memberstack?.getMemberCookie?.());
                if (!token) throw new Error('No hay una sesión activa de Memberstack');
                const res = await fetch('/api/ambassadors/dashboard', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setAmbassador(data.data);
                }
            } catch (err) {
                console.error('Error cargando embajador:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAmbassador();
    }, [ambassadorIdParam, memberIdParam]);

    if (isLoading) return <LoadingState />;

    if (!ambassador) {
        return (
            <div className={styles.pageBackground}>
                <div className={styles.errorCard}>
                    <h2>No encontramos tu solicitud</h2>
                    <p>Verifica el enlace o intenta iniciar sesión de nuevo.</p>
                    <button onClick={() => window.location.href = '/embajadores/registro'}>Ir al registro</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.whiteCard}>
                <Step5CompleteProfile
                    ambassadorId={ambassador.id}
                    initialData={{
                        rfc: ambassador.rfc || '',
                        payment_method: ambassador.payment_method || '',
                        bank_name: ambassador.bank_name || '',
                        clabe: ambassador.clabe || '',
                        facebook: ambassador.facebook || '',
                        instagram: ambassador.instagram || '',
                        tiktok: ambassador.tiktok || '',
                        motivation: ambassador.motivation || '',
                        profile_photo_url: ambassador.profile_photo_url || ''
                    }}
                />
            </div>
        </div>
    );
}

export default function CompleteAmbassadorProfilePage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <CompleteProfileContent />
        </Suspense>
    );
}
