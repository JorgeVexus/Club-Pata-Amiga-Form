/**
 * Tipos y constantes para el Dashboard de Admin
 */

// Tipos de solicitudes
export type RequestType = 
    | 'member' 
    | 'ambassador' 
    | 'wellness-center' 
    | 'solidarity-fund' 
    | 'communications' 
    | 'communications-member'
    | 'communications-ambassador'
    | 'communications-wellness'
    | 'appeals' 
    | 'all-members' 
    | 'terminate-users'
    | 'billing'
    | 'payment-records'
    | 'payment-status'
    | 'auto-retries'
    | 'finance-memberships'
    | 'finance-refunds'
    | 'finance-wellness'
    | 'finance-commissions'
    | 'reports-interactive'
    | 'registered-centers';

// Estados de solicitud
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'appealed' | 'in-review';

// Nivel de urgencia (para solicitudes de fondo solidario)
export type UrgencyLevel = 'normal' | 'high';

// Roles de administrador
export type AdminRole = 'master' | 'general';

// Interfaz de solicitud
export interface Request {
    id: string;
    requestNumber: string; // Ej: "#A345"
    type: RequestType;
    userName: string;
    userEmail: string;
    date: string;
    status: RequestStatus;
    urgency?: UrgencyLevel;
    // Datos adicionales según tipo
    memberData?: MemberRequestData;
    ambassadorData?: any; // Para futuro
    wellnessCenterData?: any; // Para futuro
    solidarityFundData?: any; // Para futuro
}

// Datos específicos de solicitud de miembro
export interface MemberRequestData {
    memberstackId: string;
    firstName: string;
    lastName: string;
    motherLastName: string;
    email: string;
    phone: string;
    curp: string;
    birthDate: string;
    gender: string;
    address: {
        postalCode: string;
        state: string;
        city: string;
        colony: string;
        street: string;
    };
    documents: {
        ineFrontUrl: string;
        ineBackUrl: string;
        proofOfAddressUrl: string;
    };
    pets: PetData[];
    submittedAt: string;
}

// Datos de mascota
export interface PetData {
    name: string;
    type: 'perro' | 'gato';
    breed: string;
    age: string;
    size: string;
    photos: string[];
    isAdopted: boolean;
    hasGeneticIssues: boolean;
    warningMessage?: string;
}

// Actividad del admin
export interface AdminActivity {
    id: string;
    action: 'approved' | 'rejected';
    requestNumber: string;
    requestType: RequestType;
    adminName: string;
    adminId: string;
    timestamp: string;
    reason?: string; // Para rechazos
}

// Métricas del dashboard
export interface DashboardMetrics {
    totalRefunds: number;
    activeWellnessCenters: number;
    totalMembers: number;
    totalAmbassadors: number;
}

// Colores de la marca
export const BRAND_COLORS = {
    beige: '#fffc67',
    yellow: '#febd01',
    pink: '#fe4b5b',
    orange: '#fe8f15',
    green: '#00bbb4',
    greenAlt: '#f9fd06',
    yellowLight: '#fefa15',
} as const;

// Mapeo de colores por tipo de solicitud
export const REQUEST_TYPE_COLORS: Record<RequestType, string> = {
    'member': BRAND_COLORS.green,
    'ambassador': BRAND_COLORS.yellow,
    'wellness-center': BRAND_COLORS.orange,
    'solidarity-fund': BRAND_COLORS.pink,
    'communications': BRAND_COLORS.green,
    'communications-member': BRAND_COLORS.green,
    'communications-ambassador': BRAND_COLORS.yellow,
    'communications-wellness': BRAND_COLORS.orange,
    'appeals': BRAND_COLORS.yellow,
    'all-members': BRAND_COLORS.green,
    'terminate-users': BRAND_COLORS.pink,
    'billing': BRAND_COLORS.orange,
    'payment-records': BRAND_COLORS.green,
    'payment-status': BRAND_COLORS.yellow,
    'auto-retries': BRAND_COLORS.pink,
    'finance-memberships': BRAND_COLORS.green,
    'finance-refunds': BRAND_COLORS.pink,
    'finance-wellness': BRAND_COLORS.orange,
    'finance-commissions': BRAND_COLORS.yellow,
    'reports-interactive': BRAND_COLORS.green,
    'registered-centers': BRAND_COLORS.orange,
};

// Mapeo de colores por estado
export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
    'pending': '#9CA3AF', // Gris
    'approved': BRAND_COLORS.green,
    'rejected': BRAND_COLORS.pink,
    'appealed': BRAND_COLORS.yellow,
    'in-review': BRAND_COLORS.orange,
};

// Labels en español
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
    'member': 'Miembros',
    'ambassador': 'Embajadores',
    'wellness-center': 'Centros de Bienestar',
    'solidarity-fund': 'Fondo Solidario',
    'communications': 'Comunicaciones',
    'communications-member': 'Comunicaciones (Miembros)',
    'communications-ambassador': 'Comunicaciones (Embajadores)',
    'communications-wellness': 'Comunicaciones (Centros)',
    'appeals': 'Apelaciones',
    'all-members': 'Gestión General',
    'terminate-users': 'Baja de Usuarios',
    'billing': 'Facturación',
    'payment-records': 'Registros de pagos',
    'payment-status': 'Estado de pago',
    'auto-retries': 'Reintentos automáticos',
    'finance-memberships': 'Membresías (Ingresos)',
    'finance-refunds': 'Apoyos (Reembolsos)',
    'finance-wellness': 'Pagos a Centros',
    'finance-commissions': 'Comisiones (Embajadores)',
    'reports-interactive': 'Gráficas interactivas',
    'registered-centers': 'Centros registrados',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
    'pending': 'Pendiente',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'appealed': 'Apelado',
    'in-review': 'En revisión',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
    'normal': 'Normal',
    'high': 'Alta',
};
