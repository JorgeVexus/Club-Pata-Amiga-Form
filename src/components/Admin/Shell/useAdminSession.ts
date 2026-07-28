'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/utils/admin-fetch';

export interface AdminSession {
    isLoading: boolean;
    adminMemberstackId: string | null;
    adminName: string;
    adminRoleLabel: string;
    isSuperAdmin: boolean;
}

/**
 * Misma lógica de auth-gate que usaba AdminDashboard.tsx: verifica sesión de
 * Memberstack en el cliente y confirma el rol contra /api/admin/me. Se
 * extrajo a un hook para reutilizarla en el nuevo layout de rutas del panel.
 */
export function useAdminSession(): AdminSession {
    const [isLoading, setIsLoading] = useState(true);
    const [adminMemberstackId, setAdminMemberstackId] = useState<string | null>(null);
    const [adminName, setAdminName] = useState('Cargando...');
    const [adminRoleLabel, setAdminRoleLabel] = useState('Verificando...');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        const fetchAdminRole = async () => {
            if (typeof window !== 'undefined' && (window as any).$memberstackDom) {
                try {
                    const member = await (window as any).$memberstackDom.getCurrentMember();

                    if (!member?.data) {
                        window.location.href = '/admin/login';
                        return;
                    }

                    const currentMemberId = member.data.id;
                    const response = await adminFetch('/api/admin/me', {
                        method: 'POST',
                        body: JSON.stringify({ memberstackId: currentMemberId }),
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (!data.isAdmin) {
                            window.location.href = '/admin/login?error=not_admin';
                            return;
                        }

                        setIsSuperAdmin(!!data.isSuperAdmin);
                        setAdminMemberstackId(currentMemberId);
                        localStorage.setItem('admin_memberstack_id', currentMemberId);
                        setAdminName(data.name || 'Admin');
                        setAdminRoleLabel(data.isSuperAdmin ? 'Super Admin' : 'Administrador');
                        setIsLoading(false);
                    } else {
                        window.location.href = '/admin/login';
                    }
                } catch (e) {
                    console.error('❌ Error verificando sesión de admin:', e);
                    window.location.href = '/admin/login';
                }
            } else if (hasMounted) {
                setTimeout(() => {
                    if (!(window as any).$memberstackDom) window.location.href = '/admin/login';
                }, 2000);
            }
        };

        fetchAdminRole();
        setHasMounted(true);
    }, [hasMounted]);

    return { isLoading, adminMemberstackId, adminName, adminRoleLabel, isSuperAdmin };
}
