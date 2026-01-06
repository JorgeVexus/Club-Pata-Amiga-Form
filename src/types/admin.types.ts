/**
 * Tipos y constantes para el Dashboard de Admin
 */

// Tipos de solicitudes
export type RequestType = 'member' | 'ambassador' | 'wellness-center' | 'solidarity-fund' | 'communications';

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
    'member': 'Miembro',
    'ambassador': 'Embajador',
    'wellness-center': 'Centro de Bienestar',
    'solidarity-fund': 'Fondo Solidario',
    'communications': 'Comunicaciones',
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
