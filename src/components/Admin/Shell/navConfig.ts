import type { PendingCounts } from './usePendingCounts';

export interface NavItem {
    href: string;
    icon: string;
    label: string;
    badgeKey?: keyof PendingCounts;
    superAdminOnly?: boolean;
}

/** Orden e iconos calcados del repo de referencia (pata-amiga), apuntando a
 * nuestras rutas propias. */
export const NAV_ITEMS: NavItem[] = [
    { href: '/admin/dashboard', icon: '📊', label: 'Resumen' },
    { href: '/admin/mascotas', icon: '🐾', label: 'Mascotas', badgeKey: 'pet-unsubscriptions' },
    { href: '/admin/reintegros', icon: '💚', label: 'Reintegros', badgeKey: 'solidarity-fund' },
    { href: '/admin/embajadores', icon: '🤝', label: 'Embajadores', badgeKey: 'ambassador' },
    { href: '/admin/centros', icon: '📍', label: 'Centros', badgeKey: 'wellness-center' },
    { href: '/admin/miembros', icon: '👥', label: 'Miembros', badgeKey: 'member' },
    { href: '/admin/apelaciones', icon: '⚖️', label: 'Apelaciones', badgeKey: 'appeals', superAdminOnly: true },
    { href: '/admin/finanzas', icon: '💰', label: 'Finanzas' },
    { href: '/admin/reportes', icon: '📈', label: 'Reportes' },
    { href: '/admin/vet', icon: '💬', label: 'Vet 24/7' },
    { href: '/admin/conversaciones', icon: '📨', label: 'Conversaciones' },
];

export const MARKETING_ITEMS: NavItem[] = [
    { href: '/admin/landings', icon: '🎯', label: 'Landings' },
    { href: '/admin/comunicados', icon: '✉️', label: 'Comunicados' },
    { href: '/admin/sitio', icon: '🌐', label: 'Sitio web' },
];

export const SETTINGS_ITEMS: NavItem[] = [
    { href: '/admin/ajustes', icon: '⚙️', label: 'Ajustes', superAdminOnly: true },
];
