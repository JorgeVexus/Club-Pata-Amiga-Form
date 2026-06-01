'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/UI/BrandLogo';
import styles from './page.module.css';

export default function PlanSelectionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = new URLSearchParams();
        const reason = searchParams.get('reason');
        const recuperar = searchParams.get('recuperar');

        if (reason === 'complete_payment' || recuperar === '1') {
            params.set('reason', 'complete_payment');
        }

        const target = params.toString() ? `/registro?${params.toString()}` : '/registro';
        router.replace(target);
    }, [router, searchParams]);

    return (
        <div className={styles.pageBackground}>
            <BrandLogo />
            <div className={styles.whiteCard}>
                <h1 className={styles.mainTitle}>Redirigiendo al registro</h1>
            </div>
        </div>
    );
}
