'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/admin-fetch';

export interface PendingCounts {
    member: number;
    ambassador: number;
    'wellness-center': number;
    'solidarity-fund': number;
    appeals: number;
    'pet-unsubscriptions': number;
}

const EMPTY: PendingCounts = {
    member: 0,
    ambassador: 0,
    'wellness-center': 0,
    'solidarity-fund': 0,
    appeals: 0,
    'pet-unsubscriptions': 0,
};

/**
 * Conteos de pendientes para los badges del nav. Reutiliza los mismos
 * endpoints que ya consumía Sidebar/AdminDashboard (sin cambios de backend).
 */
export function usePendingCounts(isSuperAdmin: boolean, ready: boolean) {
    const [counts, setCounts] = useState<PendingCounts>(EMPTY);

    useEffect(() => {
        if (!ready) return;

        let cancelled = false;

        const load = async () => {
            try {
                const [membersRes, ambassadorRes, solidarityRes, wellnessRes, petUnsubRes] =
                    await Promise.all([
                        adminFetch('/api/admin/members?status=all'),
                        adminFetch('/api/ambassadors?status=pending&limit=1'),
                        adminFetch('/api/admin/solidarity/list?status=new'),
                        adminFetch('/api/admin/wellness?status=pending'),
                        adminFetch('/api/admin/pet-unsubscriptions'),
                    ]);

                const [membersData, ambassadorData, solidarityData, wellnessData, petUnsubData] =
                    await Promise.all([
                        membersRes.json(),
                        ambassadorRes.json(),
                        solidarityRes.json(),
                        wellnessRes.json(),
                        petUnsubRes.json(),
                    ]);

                let appeals = 0;
                if (isSuperAdmin) {
                    const appealRes = await adminFetch('/api/admin/pets/appealed');
                    const appealData = await appealRes.json();
                    if (appealData.success) appeals = appealData.count || 0;
                }

                if (cancelled) return;

                const checkIsPaid = (m: any) =>
                    m.planConnections?.some(
                        (p: any) => p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'trialing',
                    );

                setCounts({
                    member: membersData.success
                        ? (membersData.members || []).filter(
                              (m: any) => checkIsPaid(m) && (m.pendingPetCount || 0) > 0,
                          ).length
                        : 0,
                    ambassador: ambassadorData.success ? ambassadorData.total || 0 : 0,
                    'wellness-center': wellnessData.success ? wellnessData.data?.length || 0 : 0,
                    'solidarity-fund': solidarityData.success ? solidarityData.count || 0 : 0,
                    'pet-unsubscriptions': petUnsubData.success ? petUnsubData.count || 0 : 0,
                    appeals,
                });
            } catch (error) {
                console.error('❌ Error cargando conteos pendientes:', error);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [isSuperAdmin, ready]);

    return counts;
}
